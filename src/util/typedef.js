/**
 * @author v1ndic4te
 * @copyright 2018
 * @licence GPL-3.0
 */

import React from 'react';
import * as PropTypes from 'prop-types';

/**
 * @typedef {object} HelloResponse
 * @property {boolean} localClient
 */

/**
 * @typedef {object} ReduxAction
 * @property {string} type
 * @property {string} [envId]
 * @property {*} data
 */
export const ReduxActions = {
    SetClientDetails: 'set-client-details',
    SetConnectionList: 'set-conn-list',
    AddConnection: 'add-conn',
    RemoveConnection: 'remove-conn',

    UpdateSummaries: 'update-summaries',
    UpdateSummary: 'update-summary',

    SetAllTags: 'set-all-tags',
    AddNewTags: 'add-new-tags',
    TagFiles: 'tag-files',
    UntagFiles: 'untag-files',

    SetAllEntities: 'set-all-entities',
    UpdateEntities: 'update-entities',

    SetDirectoryContent: 'set-dir-contents',
    SetMultipleFileDetails: 'set-multi-file-details',
    AddMultipleFiles: 'add-files',
    RemoveMultipleFiles: 'remove-files',
    UpdateThumbStates: 'update-thumb-state',

    UpdateEnvSubRoute: 'update-sub-route',

    TabBrowseChangePath: 'browse-change-path',
    TabSearchChangeTagSelection: 'search-change-selection',
    TabSearchChangeTagSearchCondition: 'search-change-tag-cond',
    TabSearchChangeTagFilter: 'search-change-tag-filter',
};

export const IndexRoutePath = '/';

export const BulmaSizes = ['small', 'medium', 'large'];

export const EnvironmentContext = React.createContext(null);

export const EnvRoutePaths = {
    browse: '/browse',
    search: '/search',
    tags: '/tags',
    configure: '/configure',
};
export const DefaultEnvRoutePath = EnvRoutePaths.browse;

export const EnvSummaryPropType = PropTypes.shape({
    id: PropTypes.string,
    path: PropTypes.string,
    slug: PropTypes.string,
    name: PropTypes.string,
    icon: PropTypes.string,
    color: PropTypes.string,
});

export const MenuIds = {
    TabBrowse: 'browse-menu',
    TabSearch: 'search',
};

/**
 * @enum {number} FileView
 */
export const FileView = {
    List: 0,
    MediumThumb: 1,
    LargeThumb: 2,
    EnumMax: 3, // Used in for loops and such
};
export const DefaultFileView = FileView.MediumThumb;
export const FileViewToClass = view => {
    let className = '';
    if (view === FileView.List) className = 'view-list';
    else {
        className = 'view-thumb ';
        if (view === FileView.MediumThumb) className += 'medium-thumb';
        if (view === FileView.LargeThumb) className += 'large-thumb';
    }
    return className;
};

export const SortOrder = {
    NameAsc: 'name-asc',
    NameDesc: 'name-desc',
};

export const ExplorerOptions = {
    SortOrder: 'sort-order',
    FileView: 'file-view',
    ShowPreview: 'show-preview',
    CollapseLongNames: 'collapse-names',
    FoldersFirst: 'folders-first',
    ShowExtensions: 'show-exts',
    ShowHidden: 'show-hidden',
    ConfirmDeletions: 'confirm-deletions',
};

export const ExplorerOptionsThatAffectSort = [
    ExplorerOptions.SortOrder,
    ExplorerOptions.FoldersFirst,
    ExplorerOptions.ShowHidden,
];

export const ExplorerOptionsDefaults = {
    [ExplorerOptions.SortOrder]: SortOrder.NameAsc,
    [ExplorerOptions.FileView]: FileView.MediumThumb,
    [ExplorerOptions.ShowPreview]: false,
    [ExplorerOptions.CollapseLongNames]: false,
    [ExplorerOptions.FoldersFirst]: true,
    [ExplorerOptions.ShowExtensions]: true,
    [ExplorerOptions.ShowHidden]: true,
    [ExplorerOptions.ConfirmDeletions]: true,
};

export const TagSearchCondition = {
    All: 1,
    Any: 2,
};
export const DefaultTagSearchCondition = TagSearchCondition.All;

export const FilePropType = PropTypes.shape({
    hash: PropTypes.string,
    nixPath: PropTypes.string,
    base: PropTypes.string,
    ext: PropTypes.string,
    name: PropTypes.string,
    isDir: PropTypes.boolean,
    thumb: PropTypes.number,
    entityId: PropTypes.string,
    tagIds: PropTypes.arrayOf(PropTypes.string),
});

export const KeyCode = {
    Backspace: 8,
    Enter: 13,
    Esc: 27,
    ArrowUp: 38,
    ArrowDown: 40,
    A: 65,
    C: 67,
};

export * from '../../../shared/typedef';

