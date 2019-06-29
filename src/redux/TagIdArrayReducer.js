/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import _ from 'lodash';
import {createReducer} from 'redux-starter-kit';

import {ReduxActions} from '../util/typedef';

export const tagIdArrayReducer = createReducer([], {
    [ReduxActions.SetAllTags]: (state, action) => {
        const tags = action.data;
        const tagIds = new Array(tags.length);
        for (let i = 0; i < tags.length; ++i) tagIds[i] = tags[i].id;
        return tagIds;
    },
    [ReduxActions.AddNewTags]: (state, action) => {
        const tags = action.data;
        const newTagIds = new Array(tags.length);
        for (let i = 0; i < tags.length; ++i) {
            const tag = tags[i];
            newTagIds[i] = tag.id;
        }
        return _.union(state, newTagIds);
    },
});

