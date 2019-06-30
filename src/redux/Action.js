/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

/**
 * @typedef {object} ReduxAction
 * @property {string} type
 * @property {string} [envId]
 * @property {*} payload
 */

export const ActionTypes = {
    SetClientDetails: 'set-client-details',
    SetClientList: 'set-client-list',
    AddConnection: 'add-conn',
    RemoveConnection: 'remove-conn',

    UpdateSummaries: 'update-summaries',
    UpdateSummary: 'update-summary',
    UpdateSubRoute: 'update-sub-route',

    SetAllTags: 'set-all-tags',
    UpdateTags: 'update-tags',
    TagFiles: 'tag-files',
    UntagFiles: 'untag-files',

    SetAllEntities: 'set-all-entities',
    UpdateEntities: 'update-entities',
    RemoveEntities: 'remove-entities',

    SetDirectoryContent: 'set-dir-contents',
    UpdateFiles: 'update-files',
    RemoveFiles: 'remove-files',
    UpdateThumbStates: 'update-thumb-state',

    TabBrowseChangePath: 'browse-change-path',
    TabSearchChangeTagSelection: 'search-change-selection',
    TabSearchChangeTagSearchCondition: 'search-change-tag-cond',
    TabSearchChangeTagFilter: 'search-change-tag-filter',
};


/** @returns {EnhancedStore<any, AnyAction> | EnhancedStore<S, A>} */
const getStore = () => window.store;
const dispatchAction = (...args) => {
    const type = args[0];
    let envId;
    let payload;
    if (args.length === 2) {
        payload = args[1];
    } else {
        envId = args[1];
        payload = args[2];
    }
    getStore().dispatch({type, envId, payload});
};

export class TabBrowseDispatcher {

    /**
     * @param {string} envId
     * @param {string} newPath
     */
    static changePath(envId, newPath) {
        dispatchAction(ActionTypes.TabBrowseChangePath, envId, newPath);
    }

}

export class TabSearchDispatcher {

    /**
     * @param {string} envId
     * @param {string} tagFilter
     */
    static changeTagFilter(envId, tagFilter) {
        dispatchAction(ActionTypes.TabSearchChangeTagFilter, envId, tagFilter);
    }

    /**
     * @param {string} envId
     * @param {{tagId: string, selected: boolean}} tagSelection
     */
    static changeTagSelection(envId, tagSelection) {
        dispatchAction(ActionTypes.TabSearchChangeTagSelection, envId, tagSelection);
    }

    /**
     * @param {string} envId
     * @param {number} conditionId
     */
    static changeTagSearchCondition(envId, conditionId) {
        dispatchAction(ActionTypes.TabSearchChangeTagSearchCondition, envId, conditionId);
    }

}

export class Dispatcher {

    /** @param {ClientDetails} clientDetails */
    static setClientDetails(clientDetails) {
        dispatchAction(ActionTypes.SetClientDetails, clientDetails);
    }

    /** @param {ClientDetails[]} clientList */
    static setClientList(clientList) {
        dispatchAction(ActionTypes.SetClientList, clientList);
    }

    /** @param {ClientDetails} clientDetails */
    static addConnection(clientDetails) {
        dispatchAction(ActionTypes.AddConnection, clientDetails);
    }

    /** @param {string} clientId */
    static removeConnection(clientId) {
        dispatchAction(ActionTypes.RemoveConnection, clientId);
    }

    /** @param {EnvSummary[]} summaries */
    static updateSummaries(summaries) {
        dispatchAction(ActionTypes.UpdateSummaries, summaries);
    }

}

export class EnvDispatcher {

    /**
     * @param {string} envId
     * @param {EnvSummary} summary
     */
    static updateSummary(envId, summary) {
        dispatchAction(ActionTypes.UpdateSummary, envId, summary);
    }

    /**
     * @param {string} envId
     * @param {string} subRoute
     */
    static updateSubRoute(envId, subRoute) {
        dispatchAction(ActionTypes.UpdateSubRoute, envId, subRoute);
    }

    /**
     * @param {string} envId
     * @param {DBTag[]} tags
     */
    static setAllTags(envId, tags) {
        dispatchAction(ActionTypes.SetAllTags, envId, tags);
    }

    /**
     * @param {string} envId
     * @param {DBTag[]} tags
     */
    static updateTags(envId, tags) {
        dispatchAction(ActionTypes.UpdateTags, envId, tags);
    }

    /**
     * @param {string} envId
     * @param {DBSlimEntity[]} entities
     * @param {string[]} tagIds
     */
    static tagFiles(envId, entities, tagIds) {
        dispatchAction(ActionTypes.TagFiles, envId, {entities, tagIds});
    }

    /**
     * @param {string} envId
     * @param {string[]} entityIds
     * @param {string[]} tagIds
     */
    static untagFiles(envId, entityIds, tagIds) {
        dispatchAction(ActionTypes.UntagFiles, envId, {entityIds, tagIds});
    }

    /**
     * @param {string} envId
     * @param {DBSlimEntity[]} entities
     */
    static setAllEntities(envId, entities) {
        dispatchAction(ActionTypes.SetAllEntities, envId, entities);
    }

    /**
     * @param {string} envId
     * @param {DBSlimEntity[]} entities
     */
    static updateEntities(envId, entities) {
        dispatchAction(ActionTypes.UpdateEntities, envId, entities);
    }

    /**
     * @param {string} envId
     * @param {string[]} entityIds
     */
    static removeEntities(envId, entityIds) {
        dispatchAction(ActionTypes.RemoveEntities, envId, entityIds);
    }

    /**
     * @param {string} envId
     * @param {FileDetails} dirFile
     * @param {string[]} fileHashes
     */
    static setDirectoryContent(envId, dirFile, fileHashes) {
        dispatchAction(ActionTypes.SetDirectoryContent, envId, {dirFile, fileHashes});
    }


    /**
     * @param {string} envId
     * @param {FileDetails[]} files
     */
    static updateFiles(envId, files) {
        dispatchAction(ActionTypes.UpdateFiles, envId, files);
    }

    /**
     * @param {string} envId
     * @param {string[]} hashes
     */
    static removeFiles(envId, hashes) {
        dispatchAction(ActionTypes.RemoveFiles, envId, hashes);
    }

    /**
     * @param {string} envId
     * @param {object[]} thumbs
     * @param {ThumbnailState} thumbState
     */
    static updateThumbStates(envId, thumbs, thumbState) {
        dispatchAction(ActionTypes.UpdateThumbStates, envId, {thumbs, thumbState});
    }

}


