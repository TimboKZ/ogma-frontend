/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import {createReducer} from 'redux-starter-kit';

import {DefaultTagSearchCondition, ReduxActions} from '../util/typedef';

export const tabBrowseReducer = createReducer({path: '/'}, {
    [ReduxActions.TabBrowseChangePath]: (state, action) => {
        state.path = action.payload;
    },
});

export const tabSearchReducer = createReducer({
    selectedTagsMap: {},
    tagFilter: '',
    tagSearchCondition: DefaultTagSearchCondition,
}, {
    [ReduxActions.TabSearchChangeTagSelection]: (state, action) => {
        const {tagId, selected} = action.payload;
        const selectedTagsMap = {...state.selectedTagsMap};
        if (selected) selectedTagsMap[tagId] = true;
        else delete selectedTagsMap[tagId];
        return {...state, selectedTagsMap};
    },
    [ReduxActions.TabSearchChangeTagSearchCondition]: (state, action) => {
        state.tagSearchCondition = action.payload;
    },
    [ReduxActions.TabSearchChangeTagFilter]: (state, action) => {
        state.tagFilter = action.payload;
    },
});
