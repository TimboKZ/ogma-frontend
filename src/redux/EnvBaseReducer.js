/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import {combineReducers} from 'redux';
import reduceReducers from 'reduce-reducers';

import {ActionTypes} from './Action';
import {tagMapReducer} from './TagMapReducer';
import {fileMapReducer} from './FileMapReducer';
import {entityMapReducer} from './EntityMapReducer';
import {createSimpleReducer} from './SimpleReducer';
import {DefaultEnvRoutePath} from '../util/typedef';
import {tagIdArrayReducer} from './TagIdArrayReducer';
import {tabBrowseReducer, tabSearchReducer} from './TabReducer';

const subRouteReducer = (state = DefaultEnvRoutePath, action) => {
    if (action.type !== ActionTypes.UpdateSubRoute) return state;
    return action.payload;
};

const summaryReducer = (state = {}, action) => {
    if (action.type !== ActionTypes.UpdateSummary) return state;
    return action.payload;
};

export const envMiscReducer = createSimpleReducer({}, {
    [ActionTypes.RemoveEntities]: (state, action) => {
        const entityIds = action.payload;
        let {entityMap, fileMap} = state;
        entityMap = {...entityMap};
        for (let i = 0; i < entityIds.length; ++i) {
            const entityId = entityIds[i];
            const entity = entityMap[entityId];
            delete entityMap[entityId];
            if (entity && fileMap[entity.hash]) {
                fileMap = {...fileMap};
                fileMap[entity.hash] = {
                    ...fileMap[entity.hash],
                    entityId: null,
                };
            }
        }
        return {...state, entityMap, fileMap};
    },
    [ActionTypes.RemoveFiles]: (state, action) => {
        // Delete entity when file is deleted
        const deletedHashes = action.payload;
        let {entityMap, fileMap} = state;
        entityMap = {...entityMap};
        for (const fileHash of deletedHashes) {
            const file = fileMap[fileHash];
            if (!file) continue;
            if (file.entityId) delete entityMap[file.entityId];
        }
        return {...state, entityMap};
    },
});

const envNewReducer = combineReducers({
    summary: summaryReducer,
    subRoute: subRouteReducer,
    tagIds: tagIdArrayReducer,
    tagMap: tagMapReducer,
    entityMap: entityMapReducer,
    fileMap: fileMapReducer,
    tabBrowse: tabBrowseReducer,
    tabSearch: tabSearchReducer,
});

export const envBaseReducer = reduceReducers({}, envNewReducer, envMiscReducer);
