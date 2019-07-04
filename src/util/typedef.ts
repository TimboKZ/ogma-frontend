/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import {EnhancedStore} from 'redux-starter-kit';

import IpcModule from '../../../shared/IpcModule';
import BackendTypedef from '../../../shared/typedef';
import {AppState, ReduxAction} from '../redux/ReduxTypedef';
import {EventEmitter2} from 'eventemitter2';

declare global {
    // noinspection JSUnusedGlobalSymbols
    interface Window {
        ipcModule: IpcModule,
        isDevelopment: boolean;
        proxyEmitter: EventEmitter2,
        store: EnhancedStore<AppState, ReduxAction>,

        handleError: (error: Error) => void,
    }
}

export const IndexRoutePath = '/';

export const BulmaSizes = ['small', 'medium', 'large'];

export const EnvironmentContext = React.createContext(null);

export const EnvRoutePaths = {
    browse: '/browse',
    search: '/search',
    tags: '/tags',
    sinks: '/sinks',
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
export enum FileView {
    List = 0,
    MediumThumb = 1,
    LargeThumb = 2,
    EnumMax = 3, // Used in for loops and such
}

export const DefaultFileView = FileView.MediumThumb;
export const FileViewToClass = (view: FileView) => {
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
    isDir: PropTypes.bool,
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

// Reexporting parts of backend typedef
export const BackendEvents: { [name: string]: string } = BackendTypedef.BackendEvents;
export const EnvProperty = BackendTypedef.EnvProperty;

export const Colors = BackendTypedef.Colors;
export const ColorsLight = BackendTypedef.ColorsLight;
export const ColorsDark = BackendTypedef.ColorsDark;

export const FileErrorStatus = BackendTypedef.FileErrorStatus;
export const ThumbnailState = BackendTypedef.ThumbnailState;

export const VideoExtensions = BackendTypedef.VideoExtensions;
export const ImageExtensions = BackendTypedef.ImageExtensions;
export const AudioExtensions = BackendTypedef.AudioExtensions;


