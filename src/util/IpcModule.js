/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import _ from 'lodash';
import Promise from 'bluebird';
import {cyan, green, magenta, red} from 'chalk';

import SharedUtil from './SharedUtil';
import {BackendEvents} from './typedef';

let Util = null;
let electron = null;
let uaParser = null;

export default class IpcModule {

    /**
     * @param {object} data
     * @param {object} data.socket
     * @param {Logger} [data.logger] For server mode
     * @param {OgmaCore} [data.ogmaCore] For server mode
     * @param {string[]} [data.localIps] For server mode
     * @param {function(data: *)} [data.eventHandler] For client mode
     * @param {function(error: string)} [data.errorHandler] For client mode
     */
    constructor(data) {
        this.socket = data.socket;
        this.logger = data.logger;

        this.requestId = 0;
        this.timeout = 5000;

        this.serverMethods = Object.getOwnPropertyNames(IpcModule.prototype);
        this.serverMethods = _.filter(this.serverMethods, m => !(m.startsWith('_') || m === 'constructor'));

        this.callbackMap = {};

        this.eventHandler = data.eventHandler;
        this.errorHandler = data.errorHandler;
        this._setupClientSocket();
    }

    _setupServerSocket() {
        // Broadcast selected events to clients
        const that = this;
        this.emitter.addListener('*', function (...args) {
            const eventName = this.event;
            // if (!ForwardedEventsMap[eventName]) return;
            that.socket.sockets.emit('ipc-forward-event', {name: eventName, args});
        });

        // Process messages from clients
        this.socket.on('connection', socket => {
            const client = this._prepareClientDetails(socket);
            this._addClient(client);

            const addressString = `${client.ip}, ${client.userAgent.browser.name} on ${client.userAgent.os.name}`;
            this.logger.info(`${green('Connected')}: ${cyan(client.id)} from <${magenta(addressString)}>`);
            socket.on('disconnect', () => {
                this._removeClient(client);
                this.logger.info(`${red('Disconnected')}: ${cyan(client.id)} from <${magenta(addressString)}>`);
            });

            socket.on('ipc-call', (data, callback) => {
                this.requestCount++;
                // TODO: Log request here with `setTimeout`.

                Promise.resolve()
                    .then(() => this[data.name](data.data, client))
                    .then(result => {
                        // Trigger the callback
                        callback({result});

                        // Print connection information
                        const connSummary = `[IPC request] ${client.id} -> ${cyan(data.name)}`;
                        const resultString = `${magenta('result')}: ${SharedUtil.toHumanReadableType(result)}`;
                        if (data.data) {
                            const dataString = `${magenta('data')}: ${JSON.stringify(data.data)}`;
                            this.logger.debug(`${connSummary}, ${dataString}, ${resultString}`);
                        } else {
                            this.logger.debug(`${connSummary}, ${resultString}`);
                        }

                    })
                    .catch(error => {
                        callback({error: error.message});
                        this.logger.error('An error occurred while processing socket action:', {
                            name: data.name,
                            data: data.data,
                        }, '\n', error);
                    });
            });
        });
    }

    /**
     * @param {object} socket
     * @returns {ClientDetails}
     * @private
     */
    _prepareClientDetails(socket) {
        const id = Util.getShortId();
        let ip = socket.client.request.headers['x-forwarded-for']
            || socket.client.conn.remoteAddress
            || socket.conn.remoteAddress
            || socket.request.connection.remoteAddress;
        let localClient = false;
        const userAgent = uaParser(socket.handshake.headers['user-agent']);

        // Determine if connection comes from a local client
        if (ip === '::1') {
            ip = 'local';
            localClient = true;
        } else if (ip.startsWith('::ffff:')) {
            ip = ip.substring(7);
            if (this.localIpTrie.has(ip)) {
                localClient = true;
            }
        } else {
            // TODO: Need to support IPv6...
        }

        return {
            id,
            ip,
            localClient,
            userAgent,
            socket,
        };
    }

    _addClient(client) {
        this.clientMap[client.id] = client;
        this.emitter.emit(BackendEvents.AddConnection, {
            id: client.id,
            ip: client.ip,
            localClient: client.localClient,
            userAgent: client.userAgent,
        });
    }

    _removeClient(client) {
        delete this.clientMap[client.id];
        this.emitter.emit(BackendEvents.RemoveConnection, client.id);
    }

    // noinspection JSMethodCanBeStatic
    _parseMessage(messageString) {
        if (typeof messageString !== 'string') {
            throw new Error(`Received non-string data over websocket: ${messageString}`);
        }
        const parts = messageString.split('@', 2);
        const dataString = parts.length >= 2 && !!parts[1] ? parts[1] : null;
        const hasError = dataString && dataString.length >= 1 && dataString.charAt(0) === '!';
        let data;
        let error;
        if (hasError) error = dataString.substring(1);
        else if (dataString) data = JSON.parse(dataString);

        const headerParts = parts[0].split('#', 2);
        const hasId = headerParts.length >= 2;
        const id = hasId ? headerParts[0] : null;
        const name = hasId ? headerParts[1] : headerParts[0];

        return {id, name, data, error};
    }

    _sendMessageWithCallback(name, data = null, callback = null) {
        const requestId = ++this.requestId;
        let string = `${requestId}#${name}`;
        if (data) string += `@${JSON.stringify(data)}`;
        if (callback) this.callbackMap[requestId] = callback;
        this.socket.send(string);
    }

    _setupClientSocket() {
        // Process incoming messages
        this.socket.addEventListener('message', event => {
            const data = this._parseMessage(event.data);
            console.log('[IPC] Received message:',data);
            if (data.id) {
                const callback = this.callbackMap[data.id];
                delete this.callbackMap[data.id];
                if (callback) callback(data);
            } else if (data.name === 'ipc-forward-event') this.eventHandler(data);
        });

        // Forward method calls to backend
        for (const methodName of this.serverMethods) {
            this[methodName] = methodData => new Promise((resolve, reject) => {

                this.requestCount++;
                const requestId = this.requestCount;
                const prefix = `[IPC Req #${requestId}]`;
                const timeout = setTimeout(() => {
                    console.warn(`${prefix} ${methodName} timed out! Data:`, methodData);
                }, this.timeout);

                this._sendMessageWithCallback(methodName, methodData, response => {
                    clearTimeout(timeout);
                    if (response.error) reject(this.errorHandler(response.error));
                    else resolve(response.data);
                });
            });
        }
    }

    // noinspection JSUnusedGlobalSymbols,JSMethodCanBeStatic
    /**
     * @param {object} [data]
     * @param {object} [client]
     * @returns {ConnectionDetails}
     */
    getClientDetails(data = null, client) {
        return {
            id: client.id,
            localClient: client.localClient,
        };
    }

    // noinspection JSUnusedGlobalSymbols
    getClientList() {
        const clients = Object.values(this.clientMap);
        return clients.map(client => ({
            id: client.id,
            ip: client.ip,
            localClient: client.localClient,
            userAgent: client.userAgent,
        }));
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @returns {Promise<EnvSummary[]>}
     */
    getSummaries() {
        // noinspection JSValidateTypes
        return this.envManager.getSummaries();
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     */
    getAllTags(data) {
        return this.envManager.getEnvironment({id: data.id}).getAllTags();
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {DBTag} data.tag New tag definition
     */
    updateTag(data) {
        return this.envManager.getEnvironment({id: data.id}).updateTag(data);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {string} data.tagId ID of the tag to delete
     */
    removeTag(data) {
        return this.envManager.getEnvironment({id: data.id}).removeTag(data);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {string[]} data.tagNames Names of tags to add
     * @param {string[]} data.paths Array of relative paths of the file (from environment root)
     */
    addTagsToFiles(data) {
        return this.envManager.getEnvironment(data).addTagsToFiles(data);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {string[]} data.tagIds IDs of tags to remove
     * @param {string[]} data.entityIds Array of entity IDs from which to remove tags
     */
    removeTagsFromFiles(data) {
        return this.envManager.getEnvironment(data).removeTagsFromFiles(data);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     */
    getAllEntities(data) {
        return this.envManager.getEnvironment(data).getAllEntities();
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {string[]} data.entityIds Entity IDs for each file details will be fetched.
     * @returns {Promise.<(FileDetails||FileErrorStatus)[]>}
     */
    getEntityFiles(data) {
        return this.envManager.getEnvironment(data).getEntityFiles(data);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id
     * @param {string} [data.slug]
     * @param {string} [data.name]
     * @param {string} [data.icon]
     * @param {string} [data.color]
     */
    setEnvProperty(data) {
        return this.envManager.getEnvironment(data).setProperty(data);
    }

    // noinspection JSUnusedGlobalSymbols
    createEnvironment(_, client) {
        if (!client.localClient) {
            throw new Error('Only local clients can create new environment!');
        }
        return this.envManager.createEnvironment();
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id
     */
    closeEnvironment(data) {
        return this.envManager.closeEnvironment(data);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {string} data.path Relative path of the directory (from environment root)
     */
    getDirectoryContents(data) {
        return this.envManager.getEnvironment(data).getDirectoryContents(data);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {RelPath} data.path Path relative to environment root
     * @param {string[]} data.cachedHashes Hashes that are assumed to be in this directory
     * @param {number} data.dirReadTime Time (in seconds) when the directory was initially read
     * @returns {Promise.<FileDetails>} Directory details
     */
    scanDirectoryForChanges(data) {
        return this.envManager.getEnvironment(data).scanDirectoryForChanges(data);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {string} data.path Relative path of the file (from environment root)
     * @param {ClientDetails} [client]
     */
    openFile(data, client) {
        if (!client.localClient) throw new Error('Only local clients can open files natively!');
        return this.envManager.getEnvironment(data).openFile(data);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {string} data.path Relative path of the file (from environment root)
     * @param {ClientDetails} [client]
     */
    openInExplorer(data, client) {
        if (!client.localClient) throw new Error('Only local clients can open files in explorer!');
        return this.envManager.getEnvironment(data).openInExplorer(data);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     */
    getSinkTreeSnapshot(data) {
        return this.envManager.getEnvironment(data).getSinkTreeSnapshot();
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {string[]} data.paths Paths to files that will be sorted to sinks.
     */
    moveFilesToSink(data) {
        return this.envManager.getEnvironment(data).moveFilesToSinks(data);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {string} data.path Path to the new folder.
     */
    createFolder(data) {
        return this.envManager.getEnvironment(data).createFolder(data);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {string} data.oldPath Current path to the file, relative to environment root.
     * @param {string} data.newPath New path to the file, relative to environment root.
     * @param {boolean} [data.overwrite=false] Whether to overwrite if the new file already exists
     */
    renameFile(data) {
        return this.envManager.getEnvironment(data).renameFile(data);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {string[]} data.paths Array of relative paths of the file (from environment root)
     */
    removeFiles(data) {
        return this.envManager.getEnvironment(data).removeFiles(data);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {string[]} data.paths Array of relative paths to files (from environment root)
     */
    requestFileThumbnails(data) {
        return this.envManager.getEnvironment(data).requestThumbnails(data);
    }

    // noinspection JSUnusedGlobalSymbols,JSMethodCanBeStatic
    /**
     * @param {object} data
     * @param {string} data.link
     * @param {ClientDetails} [client]
     */
    openExternalLink(data, client) {
        if (!client.localClient) throw new Error('Only local clients can open external links!');
        electron.shell.openExternal(data.link);
    }
}
