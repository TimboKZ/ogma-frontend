/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import {createReducer} from 'redux-starter-kit';

import {ReduxActions} from '../util/typedef';

export const tagMapReducer = createReducer({}, {
    [ReduxActions.SetAllTags]: (state, action) => {
        const tags = action.payload;
        const tagMap = {};
        for (let i = 0; i < tags.length; ++i) {
            const tag = tags[i];
            tagMap[tag.id] = tag;
        }
        return tagMap;
    },
    [ReduxActions.AddNewTags]: (state, action) => {
        const tags = action.payload;
        const tagMap = {...state};
        for (let i = 0; i < tags.length; ++i) {
            const tag = tags[i];
            tagMap[tag.id] = tag;
        }
        return tagMap;
    },
});

