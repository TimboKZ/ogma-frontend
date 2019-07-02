/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import {ReduxHandler, ReduxHandlerMap} from "./ReduxTypedef";

export const DefaultReducerFunction: string = '__default';

export const createSimpleReducer = <S extends {}>(initialState: S, handlers: ReduxHandlerMap<S>): ReduxHandler<S> => {
    return (state = initialState, action) => {
        if (handlers.hasOwnProperty(action.type)) {
            return handlers[action.type](state, action);
        } else if (handlers.hasOwnProperty(DefaultReducerFunction)) {
            return handlers[DefaultReducerFunction](state, action);
        } else {
            return state;
        }
    };
};
