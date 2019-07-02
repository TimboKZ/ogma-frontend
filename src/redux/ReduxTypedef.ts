/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

// Redux state typedefs
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
export type TagMap = {
    [id: string]: Tag,
}

export type EnvState = {
    summary: EnvSummary,
    tagIds: string[],
    tagMap: TagMap,
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
export type ReduxAction = {
    type: string,
    envId?: string,
    payload?: any,
}
export type ReduxHandler<S> = (state: S, action: ReduxAction) => S;
export type ReduxHandlerMap<S> = { [type: string]: ReduxHandler<S> };

// Redux selector types
export type BaseSelector<P, R> = (state: AppState, props: P) => R;
