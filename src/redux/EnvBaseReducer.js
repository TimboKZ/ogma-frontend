/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import _ from 'lodash';
import {combineReducers} from 'redux';
import reduceReducers from 'reduce-reducers';
import {createReducer} from 'redux-starter-kit';

import {tagMapReducer} from './TagMapReducer';
import {fileMapReducer} from './FileMapReducer';
import {entityMapReducer} from './EntityMapReducer';
import {tagIdArrayReducer} from './TagIdArrayReducer';
import {tabBrowseReducer, tabSearchReducer} from './TabReducer';
import {ReduxActions, DefaultEnvRoutePath} from '../util/typedef';

const subRouteReducer = (state = DefaultEnvRoutePath, action) => {
    if (action.type !== ReduxActions.UpdateEnvSubRoute) return state;
    return action.data;
};

const summaryReducer = (state = {}, action) => {
    if (action.type !== ReduxActions.UpdateSummary) return state;
    return action.data;
};

export const envMiscReducer = createReducer({}, {
    [ReduxActions.OverwriteMultipleFileDetails]: (state, action) => {
        // Update entity info based on file changes
        const files = action.data;
        let {fileMap, entityMap} = state;
        entityMap = {...entityMap};
        for (const file of files) {
            const oldFile = fileMap[file.hash];
            if (!oldFile || file.entityId !== oldFile.entityId) {
                if (oldFile) delete entityMap[oldFile.entityId];
                if (file.entityId) {
                    entityMap[file.entityId] = {
                        ...entityMap[file.entityId],
                        id: file.entityId,
                        hash: file.hash,
                        tagIds: file.tagIds,
                    };
                }
            }
        }
        return {...state, entityMap};
    },
    [ReduxActions.RemoveMultipleFiles]: (state, action) => {
        // Delete entity when file is deleted
        const deletedHashes = action.data;
        let {fileMap, entityMap} = state;
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
// export const envBaseReducer = (state = {}, action) => {
//     state = envBaseReducer(state, action);
//     return {
//         ...state,
//         ...envNewReducer({
//             subRoute: state.subRoute,
//             tagIds: state.tagIds,
//             tagMap: state.tagMap,
//             entityMap: state.entityMap,
//             fileMap: state.fileMap,
//             tabBrowse: state.tabBrowse,
//             tabSearch: state.tabSearch,
//         }, action),
//     };
// };
