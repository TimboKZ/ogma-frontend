/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import _ from 'lodash';
import Denque from 'denque';
import Promise from 'bluebird';

import ErrorHandler from './ErrorHandler';
import {BackendEvents, FileErrorStatus} from './typedef';
import {Dispatcher, EnvDispatcher} from '../redux/Action';

export default class DataManager {

    /**
     * @param {object} data
     * @param {object} data.socket
     * @param {object} data.store
     */
    constructor(data) {
        this.socket = data.socket;
        this.store = data.store;
        this.emitter = window.proxyEmitter;

        this.lastThumbRequestEnvId = '';
        this.thumbRequestQueue = new Denque();
        this._debounceRequestBatchThumbnails = _.debounce(this._requestBatchThumbnails, 100);
    }

    init() {
        // Setup reconnect logic
        this.socket.on('connect', () => {
            this._syncBaseState()
                .catch(ErrorHandler.handleMiscError);
        });

        // Setup listeners
        const listenerMap = {
            [BackendEvents.AddConnection]: Dispatcher.addConnection,
            [BackendEvents.RemoveConnection]: Dispatcher.removeConnection,

            [BackendEvents.UpdateEnvSummaries]: Dispatcher.updateSummaries,
            [BackendEvents.UpdateEnvSummary]: summary => EnvDispatcher.updateSummary(summary.id, summary),

            [BackendEvents.EnvAddEntities]: data => EnvDispatcher.updateEntities(data.id, data.entities),
            [BackendEvents.EnvRemoveEntities]: data => EnvDispatcher.removeEntities(data.id, data.entityIds),
            [BackendEvents.EnvUpdateEntities]: data => EnvDispatcher.updateEntities(data.id, data.entities),

            [BackendEvents.EnvAddFiles]: data => EnvDispatcher.updateFiles(data.id, data.files),
            [BackendEvents.EnvRemoveFiles]: data => EnvDispatcher.removeFiles(data.id, data.hashes),
            [BackendEvents.EnvUpdateThumbs]: data => EnvDispatcher.updateThumbStates(data.id, data.thumbs, data.thumbState),

            [BackendEvents.EnvAddTags]: data => EnvDispatcher.updateTags(data.id, data.tags),
            [BackendEvents.EnvTagFiles]: data => EnvDispatcher.tagFiles(data.id, data.entities, data.tagIds),
            [BackendEvents.EnvUntagFiles]: data => EnvDispatcher.untagFiles(data.id, data.entityIds, data.tagIds),
        };
        for (const eventName in BackendEvents) {
            if (!listenerMap[BackendEvents[eventName]]) {
                console.warn(`Backend event "${eventName}" does not have a listener `);
            }
        }
        this.emitter.on('*', function (...args) {
            const eventName = this.event;
            const listener = listenerMap[eventName];
            if (!listener) return;
            listener(...args);
        });

        // Attempt initial sync
        return this._syncBaseState();
    }

    _syncBaseState() {
        const fetchPromises = [
            window.ipcModule.getClientDetails(),
            window.ipcModule.getClientList(),
            window.ipcModule.getSummaries(),
        ];
        const fetchDispatchers = [
            Dispatcher.setClientDetails,
            Dispatcher.setClientList,
            Dispatcher.updateSummaries,
        ];
        return Promise.all(fetchPromises)
            .then(results => {
                for (let i = 0; i < results.length; ++i) fetchDispatchers[i](results[i]);
            })
            .then(() => Promise.all([this._fetchAllTags(), this._fetchAllEntities()]));
    }

    _fetchAllTags() {
        const envIds = this.store.getState().envIds;
        const promises = _.map(envIds, id => window.ipcModule.getAllTags({id}));

        const dispatchFunc = (envId, allTags) => EnvDispatcher.setAllTags(envId, allTags);
        return Promise.all(promises)
            .then(allAllTags => _.zipWith(envIds, allAllTags, dispatchFunc));
    }

    _fetchAllEntities() {
        const envIds = this.store.getState().envIds;
        const promises = _.map(envIds, id => window.ipcModule.getAllEntities({id}));

        const dispatchFunc = (envId, allEntities) => EnvDispatcher.setAllEntities(envId, allEntities);
        return Promise.all(promises)
            .then(allAllEntities => _.zipWith(envIds, allAllEntities, dispatchFunc));
    }

    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {string} data.path Path relative to environment route
     * @param {number} data.dirReadTime Timestamp at which directory was last read
     * @param {string[]} data.cachedHashes Previously cached hashes
     */
    requestDirectoryContent(data) {
        if (data.cachedHashes) {
            return window.ipcModule.scanDirectoryForChanges(data);
        }

        return window.ipcModule.getDirectoryContents({id: data.id, path: data.path})
            .then(result => {
                const {directory, files} = result;
                EnvDispatcher.updateFiles(data.id, files.concat([directory]));
                EnvDispatcher.setDirectoryContent(data.id, directory, _.map(files, f => f.hash));
                return null;
            });
    }

    _requestBatchThumbnails() {
        const newDenque = new Denque();
        const envId = this.lastThumbRequestEnvId;
        const requestQueue = this.thumbRequestQueue;
        this.thumbRequestQueue = newDenque;

        window.ipcModule.requestFileThumbnails({id: envId, paths: requestQueue.toArray()});
    }

    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {string} data.path Relative path of the file (from environment root)
     */
    requestFileThumbnail(data) {
        this.lastThumbRequestEnvId = data.id;
        this.thumbRequestQueue.push(data.path);
        this._debounceRequestBatchThumbnails();
    }

    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {string[]} data.entityIds Entity IDs for each file details will be fetched
     */
    requestEntityFiles(data) {
        const chunks = _.chunk(data.entityIds, 75);
        const promises = chunks.map(ch => window.ipcModule.getEntityFiles({id: data.id, entityIds: ch}));
        return Promise.all(promises)
            .then(chunks => {
                const entityFiles = _.flattenDeep(chunks);
                const newFileQueue = new Denque();
                const badHashQueue = new Denque();
                for (let i = 0; i < entityFiles.length; ++i) {
                    const file = entityFiles[i];
                    if (_.isNumber(file)) {
                        const badEntityIds = data.entityIds[i];
                        if (file === FileErrorStatus.FileDoesntExist) {
                            console.warn(`Encountered FileDoesntExist code, entity ID: ${badEntityIds}`);
                        } else if (file === FileErrorStatus.EntityDoesntExist) {
                            console.warn(`Encountered EntityDoesntExist code, entity ID: ${badEntityIds}`);
                        } else {
                            console.warn(`Encountered unknown FileErrorStatus code: ${file}`);
                        }
                    } else {
                        newFileQueue.push(file);
                    }
                }

                if (badHashQueue.length > 0) {
                    EnvDispatcher.removeFiles(data.id, badHashQueue.toArray());
                }
                EnvDispatcher.updateFiles(data.id, newFileQueue.toArray());
                return null;
            });
    }

    isLocalClient() {
        return this.store.getState().client.localClient;
    }

    // noinspection JSMethodCanBeStatic
    isElectron() {
        return navigator.userAgent.includes('Electron/');
    }

}
