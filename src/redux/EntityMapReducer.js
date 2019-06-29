/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import _ from 'lodash';
import {createReducer} from 'redux-starter-kit';

import Util from '../util/Util';
import {ReduxActions} from '../util/typedef';

export const entityMapReducer = createReducer({}, {
    [ReduxActions.TagFiles]: (state, action) => {
        const {entities: slimEntities, tagIds} = action.data;
        const entityMap = {...state};
        for (let i = 0; i < slimEntities.length; ++i) {
            const slimEntity = slimEntities[i];
            const oldEntity = entityMap[slimEntity.id];
            const oldTagIds = oldEntity ? oldEntity.tagIds : null;
            entityMap[slimEntity.id] = {
                ...oldEntity,
                ...slimEntity,
                tagIds: _.union(oldTagIds, tagIds),
            };
        }
        return entityMap;
    },
    [ReduxActions.UntagFiles]: (state, action) => {
        const {entityIds, tagIds} = action.data;
        const entityMap = {...state};
        for (let i = 0; i < entityIds.length; ++i) {
            const entityId = entityIds[i];
            const entity = entityMap[entityId];
            if (!entity) return;
            entityMap[entityId] = {
                ...entity,
                tagIds: _.difference(entity.tagIds, tagIds),
            };
        }
        return entityMap;
    },

    [ReduxActions.SetAllEntities]: (state, action) => {
        const entities = action.data;
        // Uncomment if we'll need entityIDs in the future
        const entityMap = {};
        for (let i = 0; i < entities.length; ++i) {
            const entity = entities[i];
            entityMap[entity.id] = entity;
        }
        return entityMap;
    },
    [ReduxActions.UpdateEntities]: (state, action) => {
        const partialSlimEntities = action.data;
        const entityMap = {...state};
        for (let i = 0; i < partialSlimEntities.length; ++i) {
            const entity = partialSlimEntities[i];
            entityMap[entity.id] = {
                ...entityMap[entity.id],
                ...entity,
            };
        }
        return entityMap;
    },
});
