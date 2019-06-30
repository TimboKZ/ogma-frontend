/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import {createReducer} from 'redux-starter-kit';

import {ActionTypes} from './Action';

export const tagMapReducer = createReducer({}, {
    [ActionTypes.SetAllTags]: (state, action) => {
        const tags = action.payload;
        const tagMap = {};
        for (let i = 0; i < tags.length; ++i) {
            const tag = tags[i];
            tagMap[tag.id] = tag;
        }
        return tagMap;
    },
    [ActionTypes.UpdateTags]: (state, action) => {
        const tags = action.payload;
        const tagMap = {...state};
        for (let i = 0; i < tags.length; ++i) {
            const tag = tags[i];
            tagMap[tag.id] = {
                ...tagMap[tag.id],
                ...tag,
            };
        }
        return tagMap;
    },
});

