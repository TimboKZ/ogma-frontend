/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import _ from 'lodash';
import {createReducer} from 'redux-starter-kit';

import {ActionTypes} from './Action';

export const tagIdArrayReducer = createReducer([], {
    [ActionTypes.SetAllTags]: (state, action) => {
        const tags = action.payload;
        const tagIds = new Array(tags.length);
        for (let i = 0; i < tags.length; ++i) tagIds[i] = tags[i].id;
        return tagIds;
    },
    [ActionTypes.UpdateTags]: (state, action) => {
        const tags = action.payload;
        const newTagIds = new Array(tags.length);
        for (let i = 0; i < tags.length; ++i) {
            const tag = tags[i];
            newTagIds[i] = tag.id;
        }
        return _.union(state, newTagIds);
    },
});

