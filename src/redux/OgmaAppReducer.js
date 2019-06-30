/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import _ from 'lodash';

import {ActionTypes} from './Action';
import {envBaseReducer} from './EnvBaseReducer';
import {DefaultEnvRoutePath, DefaultTagSearchCondition} from '../util/typedef';

const initialGlobalState = {
    client: {
        id: null,
        localClient: false,
    },
    connectionMap: {},
    envIds: [],
    envMap: {},
};

/**
 * @param {object} state
 * @param {ReduxAction} action
 * @returns {object}
 */
const ogmaAppReducer = (state = initialGlobalState, action) => {
    const {type, payload} = action;

    if (type === ActionTypes.SetClientDetails) {
        return {
            ...state,
            client: {
                ...state.client,
                ...payload,
            },
        };
    } else if (type === ActionTypes.SetClientList) {
        const connectionMap = {};
        for (const conn of payload) {
            connectionMap[conn.id] = conn;
        }
        return {
            ...state,
            connectionMap,
        };
    } else if (type === ActionTypes.AddConnection) {
        const connectionMap = {...state.connectionMap};
        connectionMap[payload.id] = payload;
        return {
            ...state,
            connectionMap,
        };
    } else if (type === ActionTypes.RemoveConnection) {
        const connectionMap = {...state.connectionMap};
        delete connectionMap[payload];
        return {
            ...state,
            connectionMap,
        };
    } else if (type === ActionTypes.UpdateSummaries) {
        const newSummaries = payload;
        const newEnvIds = _.map(newSummaries, s => s.id);
        const newEnvMap = {};
        for (let i = 0; i < newSummaries.length; ++i) {
            const summary = newSummaries[i];
            const oldEnv = state.envMap[summary.id];
            const env = oldEnv ? {...oldEnv} : {
                subRoute: DefaultEnvRoutePath,
                tagIds: [],
                tagMap: {},
                entityMap: {},
                fileMap: {},
                tabBrowse: {path: '/'},
                tabSearch: {selectedTagsMap: {}, tagFilter: '', tagSearchCondition: DefaultTagSearchCondition},
            };
            env.summary = summary;
            newEnvMap[summary.id] = env;
        }

        return {
            ...state,
            envIds: newEnvIds,
            envMap: newEnvMap,
        };
    } else if (action.envId) {
        // Environment specific action
        const {envId} = action;
        const envMap = {...state.envMap};
        envMap[envId] = envBaseReducer(state.envMap[envId], action);
        return {...state, envMap};
    } else if (window.isDevelopment && type !== '@@INIT') {
        console.warn(`[Redux] Non-global action called without 'envId': ${type}`);
    }
    return state;
};

export default ogmaAppReducer;
