/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

export const DefaultReducerFunction = '__default';

export const createSimpleReducer = (initialState, handlers) => {
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
