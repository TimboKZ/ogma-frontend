/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import _ from 'lodash';

import {ActionTypes} from './Action';
import {envBaseReducer} from './EnvBaseReducer';
import {createSimpleReducer, DefaultReducerFunction} from './SimpleReducer';

const ogmaAppReducer = createSimpleReducer({
    client: {
        id: null,
        localClient: false,
    },
    connectionMap: {},

    settings: {
        forceWebViewBehaviour: false,
    },

    envIds: [],
    envMap: {},
}, {
    [ActionTypes.SetClientDetails]: (state, action) => {
        const client = {...state.client, ...action.payload};
        return {...state, client};
    },
    [ActionTypes.SetClientList]: (state, action) => {
        const clients = action.payload;
        const connectionMap = {};
        for (const client of clients) connectionMap[client.id] = client;
        return {...state, connectionMap};
    },
    [ActionTypes.AddConnection]: (state, action) => {
        const client = action.payload;
        const connectionMap = {...state.connectionMap};
        connectionMap[client.id] = client;
        return {...state, connectionMap};
    },
    [ActionTypes.RemoveConnection]: (state, action) => {
        const clientId = action.payload;
        const connectionMap = {...state.connectionMap};
        delete connectionMap[clientId];
        return {...state, connectionMap};
    },
    [ActionTypes.SetSummaries]: (state, action) => {
        const newSummaries = action.payload;
        const {envMap: oldEnvMap} = state;
        const envIds = _.map(newSummaries, s => s.id);
        const envMap = {};
        for (const summary of newSummaries) {
            const newAction = {type: ActionTypes.UpdateSummary, envId: summary.id, payload: summary};
            envMap[summary.id] = envBaseReducer(oldEnvMap[summary.id], newAction);
        }
        return {...state, envIds, envMap};
    },
    [ActionTypes.CloseEnvironment]: (state, action) => {
        const envId = action.payload;
        const envIds = [...state.envIds];
        const envMap = {...state.envMap};
        const index = envIds.indexOf(envId);
        if (index > -1) envIds.splice(index, 1);
        delete envMap[envId];
        return {...state, envIds, envMap};
    },
    [DefaultReducerFunction]: (state, action) => {
        if (action.envId) {
            // Environment specific action
            const {envId} = action;
            const envMap = {...state.envMap};
            envMap[envId] = envBaseReducer(state.envMap[envId], action);
            return {...state, envMap};
        } else if (window.isDevelopment && action.type !== '@@INIT') {
            console.warn(`[Redux] Non-global action called without 'envId': ${action.type}`);
        }
        return state;
    },
});

export default ogmaAppReducer;
