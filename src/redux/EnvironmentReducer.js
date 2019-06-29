/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import _ from 'lodash';
import {createReducer} from 'redux-starter-kit';

import {ReduxActions} from '../util/typedef';
import Util from '../util/Util';

export const environmentReducer = createReducer({}, {
    [ReduxActions.UpdateSummary]: (state, action) => {
        return {...state, summary: action.data};
    },

    [ReduxActions.SetAllTags]: (state, action) => {
        const tags = action.data;
        const tagIds = new Array(tags.length);
        const tagMap = {};
        for (let i = 0; i < tags.length; ++i) {
            const tag = tags[i];
            tagIds[i] = tag.id;
            tagMap[tag.id] = tag;
        }
        return {...state, tagIds, tagMap};
    },
    [ReduxActions.AddNewTags]: (state, action) => {
        const tags = action.data;
        const newTagIds = new Array(tags.length);
        const tagMap = {...state.tagMap};
        for (let i = 0; i < tags.length; ++i) {
            const tag = tags[i];
            newTagIds[i] = tag.id;
            tagMap[tag.id] = tag;
        }
        return {...state, tagIds: _.union(state.tagIds, newTagIds), tagMap};
    },
    [ReduxActions.TagFiles]: (state, action) => {
        const {entities: slimEntities, tagIds} = action.data;
        let {fileMap, entityMap} = state;
        fileMap = {...fileMap};
        entityMap = {...entityMap};
        for (let i = 0; i < slimEntities.length; ++i) {
            const slimEntity = slimEntities[i];
            const oldEntity = entityMap[slimEntity.id];
            const oldTagIds = oldEntity ? oldEntity.tagIds : null;
            entityMap[slimEntity.id] = {
                ...oldEntity,
                ...slimEntity,
                tagIds: _.union(oldTagIds, tagIds),
            };
            const oldFile = fileMap[slimEntity.hash];
            if (!oldFile) continue;
            fileMap[slimEntity.hash] = {
                ...oldFile,
                entityId: slimEntity.id,
            };
        }
        return {...state, fileMap, entityMap};
    },
    [ReduxActions.UntagFiles]: (state, action) => {
        const {entityIds, tagIds} = action.data;
        const entityMap = {...state.entityMap};
        for (let i = 0; i < entityIds.length; ++i) {
            const entityId = entityIds[i];
            const entity = entityMap[entityId];
            if (!entity) return;
            entityMap[entityId] = {
                ...entity,
                tagIds: _.difference(entity.tagIds, tagIds),
            };
        }
        return {...state, entityMap};
    },

    [ReduxActions.SetAllEntities]: (state, action) => {
        const entities = action.data;
        // Uncomment if we'll need entityIDs in the future
        const entityMap = {};
        for (let i = 0; i < entities.length; ++i) {
            const entity = entities[i];
            entityMap[entity.id] = entity;
        }
        return {...state, entityMap};
    },
    [ReduxActions.UpdateEntities]: (state, action) => {
        const partialSlimEntities = action.data;
        const entityMap = {...state.entityMap};
        for (let i = 0; i < partialSlimEntities.length; ++i) {
            const entity = partialSlimEntities[i];
            entityMap[entity.id] = {
                ...entityMap[entity.id],
                ...entity,
            };
        }
        return {...state, entityMap};
    },

    [ReduxActions.SetDirectoryContent]: (state, action) => {
        const {directory: dir, fileHashes} = action.data;
        const fileMap = {...state.fileMap};
        const oldDir = fileMap[dir.hash];
        fileMap[dir.hash] = {
            ...oldDir,
            fileHashes: fileHashes,
        };
        return {...state, fileMap};
    },
    [ReduxActions.OverwriteMultipleFileDetails]: (state, action) => {
        const files = action.data;
        let {fileMap, entityMap} = state;
        fileMap = {...fileMap};
        entityMap = {...entityMap};
        const dirHashMap = {};
        for (const file of files) {
            const oldFile = fileMap[file.hash];
            fileMap[file.hash] = {
                ...oldFile,
                ...file,
            };

            // Delete tag IDs from file since this data belongs in entity map
            delete fileMap[file.hash]['tagIds'];

            // Update entity info
            if (!oldFile || file.entityId !== oldFile.entityId) {
                if (oldFile) delete entityMap[oldFile.entityId];
                if (file.entityId) {
                    entityMap[file.entityId] = {
                        ...entityMap[file.entityId],
                        id: file.entityId,
                        hash: file.hash,
                        tagIds: file.tagIds,
                    };
                }
            }

            // Record for which directories new files are created
            if (!oldFile) {
                const nixPath = file.nixPath;
                const dirPath = nixPath.substring(0, nixPath.length - file.base.length - 1);
                const dirHash = Util.getFileHash(dirPath === '' ? '/' : dirPath);
                if (dirHashMap[dirHash]) dirHashMap[dirHash].push(file.hash);
                else dirHashMap[dirHash] = [file.hash];
            }
        }

        // Update list of child hashes for relevant directories
        for (const dirHash in dirHashMap) {
            if (!dirHashMap.hasOwnProperty(dirHash)) continue;
            const directory = fileMap[dirHash];
            if (!directory) continue;
            const fileHashes = directory.fileHashes;
            if (!fileHashes) continue;

            fileMap[dirHash] = {
                ...directory,
                fileHashes: _.union(fileHashes, dirHashMap[dirHash]),
            };
        }

        return {...state, fileMap, entityMap};
    },
    [ReduxActions.RemoveMultipleFiles]: (state, action) => {
        const deletedHashes = action.data;
        let {fileMap, entityMap} = state;
        fileMap = {...fileMap};
        entityMap = {...entityMap};

        const dirHashMap = {};
        for (const fileHash of deletedHashes) {
            const file = fileMap[fileHash];
            if (file) {
                const nixPath = file.nixPath;
                const dirPath = nixPath.substring(0, nixPath.length - file.base.length - 1);
                const dirHash = Util.getFileHash(dirPath === '' ? '/' : dirPath);

                if (dirHashMap[dirHash]) dirHashMap[dirHash].push(fileHash);
                else dirHashMap[dirHash] = [fileHash];

                if (file.entityId) {
                    delete entityMap[file.entityId];
                }
            }
            delete fileMap[fileHash];
        }

        for (const dirHash in dirHashMap) {
            if (!dirHashMap.hasOwnProperty(dirHash)) continue;
            const directory = fileMap[dirHash];
            if (!directory) continue;
            const fileHashes = directory.fileHashes;
            if (!fileHashes) continue;

            fileMap[dirHash] = {
                ...directory,
                fileHashes: _.difference(fileHashes, dirHashMap[dirHash]),
            };
        }

        return {...state, fileMap};
    },
    [ReduxActions.UpdateThumbStates]: (state, action) => {
        const {thumbs, thumbState} = action.data;
        const fileMap = {...state.fileMap};

        for (const thumb of thumbs) {
            const {hash, thumbName} = thumb;
            const file = fileMap[hash];
            if (file) fileMap[hash] = {...file, thumbName, thumbState};
        }
        return {...state, fileMap};
    },

    [ReduxActions.UpdateEnvSubRoute]: (state, action) => {
        return {...state, subRoute: action.data};
    },
    [ReduxActions.TabBrowseChangePath]: (state, action) => {
        const newPath = action.data;
        return {...state, tabBrowse: {...state.tabBrowse, path: newPath}};
    },
    [ReduxActions.TabSearchChangeTagSelection]: (state, action) => {
        const {tagId, selected} = action.data;
        const {tabSearch} = state;
        const selectedTagsMap = {...tabSearch.selectedTagsMap};
        if (selected) selectedTagsMap[tagId] = true;
        else delete selectedTagsMap[tagId];
        return {...state, tabSearch: {...tabSearch, selectedTagsMap}};
    },
    [ReduxActions.TabSearchChangeTagSearchCondition]: (state, action) => {
        const tagSearchCondition = action.data;
        const {tabSearch} = state;
        return {...state, tabSearch: {...tabSearch, tagSearchCondition}};
    },
    [ReduxActions.TabSearchChangeTagFilter]: (state, action) => {
        const tagFilter = action.data;
        const {tabSearch} = state;
        return {...state, tabSearch: {...tabSearch, tagFilter}};
    },
});

