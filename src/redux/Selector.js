/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import deepEqual from 'fast-deep-equal';
import {createSelectorCreator, defaultMemoize} from 'reselect';

import Util from '../util/Util';

export const createDeepEqualSelector = createSelectorCreator(
    defaultMemoize,
    deepEqual,
);

export const createShallowEqualObjectSelector = createSelectorCreator(
    defaultMemoize,
    Util.shallowEqual,
);
