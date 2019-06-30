/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import _ from 'lodash';

import {ActionTypes} from './Action';
import {envBaseReducer} from './EnvBaseReducer';

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
        const {envMap: oldEnvMap} = state;
        const envIds = _.map(newSummaries, s => s.id);
        const envMap = {};
        for (const summary of newSummaries) {
            const newAction = {type: ActionTypes.UpdateSummary, envId: summary.id, payload: summary};
            envMap[summary.id] = envBaseReducer(oldEnvMap[summary.id], newAction);
        }
        return {...state, envIds, envMap};
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
