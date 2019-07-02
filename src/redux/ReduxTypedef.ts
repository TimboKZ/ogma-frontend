/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import {Action} from 'redux';

export type EnvSummary = {
    id: string,
    path: string,
    slug: string,
    name: string,
    icon: string,
    color: string,
}
export type Tag = {
    id: string,
    name: string,
    color: string,
}

export enum TagFieldNames {
    Id = 'id',
    Name = 'name',
    Color = 'color',
}

export type TagMap = {
    [id: string]: Tag,
}

export type Entity = {
    id: string,
    hash: string,
    isDir: boolean,
    tagIds: string[],
}
export type EntityMap = {
    [id: string]: Entity,
}

export type TagEntityMap = {
    [tagId: string]: string[],
}

export type File = {
    hash: string,
    nixPath: string,
    base: string,
    ext: string,
    name: string,
    isDir: boolean,
    entityId?: string,
    thumbName?: string,
    thumbState?: number,
    readTime: number,
}
export type FileMap = {
    [hash: string]: File,
}

export type TabBrowse = {
    path: string,
}
export type TabSearch = {
    selectedTagsMap: { [tagId: string]: boolean },
    tagFilter: string,
    tagSearchCondition: number,
}

export type EnvState = {
    summary: EnvSummary,
    subRoute: string,
    tagIds: string[],
    tagMap: TagMap,
    entityMap: EntityMap,
    tagEntityMap: TagEntityMap,
    fileMap: FileMap,
    tabBrowse: TabBrowse,
    tabSearch: TabSearch,
}
export type EnvMap = {
    [id: string]: EnvState,
}

export type Client = {
    id: string,
    localClient: boolean,
};
export type ClientMap = { [id: string]: Client };
export type Settings = {
    forceWebViewBehaviour: boolean,
};

export type AppState = {
    client: Client,
    connectionMap: ClientMap,
    settings: Settings,
    envIds: string[],
    envMap: EnvMap,
}

// Redux actions
export type ReduxAction = Action & {
    envId?: string,
    payload?: any,
}
export type ReduxHandler<S> = (state: S, action: ReduxAction) => S;
export type ReduxHandlerMap<S> = { [type: string]: ReduxHandler<S> };

// Redux selector types
export type BaseSelector<P, R> = (state: AppState, props: P) => R;
