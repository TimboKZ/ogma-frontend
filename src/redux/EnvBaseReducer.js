/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

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
    return action.payload;
};

const summaryReducer = (state = {}, action) => {
    if (action.type !== ReduxActions.UpdateSummary) return state;
    return action.payload;
};

export const envMiscReducer = createReducer({}, {
    [ReduxActions.RemoveMultipleFiles]: (state, action) => {
        // Delete entity when file is deleted
        const deletedHashes = action.payload;
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
