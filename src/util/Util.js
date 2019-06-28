/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import md5 from 'md5';
import _ from 'lodash';
import Promise from 'bluebird';
import deepEqual from 'fast-deep-equal';
import {detailedDiff} from 'deep-object-diff';

import {ExplorerOptions, SortOrder} from './typedef';

export default class Util {

    static deepClone(object) {
        return JSON.parse(JSON.stringify(object));
    }

    static loadImage(url) {
        return new Promise((resolve, reject) => {
            let img = new Image();
            img.addEventListener('load', e => resolve(img));
            img.addEventListener('error', () => {
                reject(new Error(`Failed to load image from URL: ${url}`));
            });
            img.src = url;
        });
    }

    static loadScript(url) {
        return new Promise((resolve, reject) => {
            try {
                const script = document.createElement('script');
                script.onload = resolve;
                script.onerror = () => reject(new Error(`Could not download script from "${url}".`));
                script.src = url;
                document.head.appendChild(script);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * @param {string} string
     * @param {number} length
     * @param {string} ellipsis
     * @returns {string}
     */
    static truncate(string, length, ellipsis = '...') {
        if (string.length < length + 5) return string;
        else return `${string.substring(0, length)}${ellipsis}`;
    }

    /**
     * @param {string} string
     * @returns {string}
     */
    static getMd5(string) {
        return md5(string);
    }

    /**
     * @param {string} nixPath
     * @returns {string}
     */
    static getFileHash(nixPath) {
        return Util.getMd5(nixPath).substring(0, 12);
    }

    /**
     * @param {any[]} array
     * @param {function(any): string} keyFunc
     */
    static arrayToObject(array, keyFunc) {
        const obj = {};
        for (const elem of array) {
            obj[keyFunc(elem)] = elem;
        }
        return obj;
    }

    static shallowEqual(a, b) {
        const allKeys = _.union(Object.keys(a), Object.keys(b));
        for (const key of allKeys) {
            if (a[key] !== b[key]) return false;
        }
        return true;
    }

    static getShallowDiffKeys(a, b) {
        const allKeys = _.union(Object.keys(a), Object.keys(b));
        return allKeys.filter(key => a[key] !== b[key]);
    }

    static printShallowObjectDiffs(a, b, id = '', keys = null) {
        if (!keys) keys = Util.getShallowDiffKeys(a, b);
        keys.map(key => {
            const diff = detailedDiff(a[key], b[key]);
            console.log(
                id,
                'Changed property:', key,
                'updated:', diff.updated,
                'added:', diff.added,
                'deleted:', diff.deleted,
            )
            ;
            return null;
        });
    }

    static getDeepDiffKeys(a, b) {
        const allKeys = _.union(Object.keys(a), Object.keys(b));
        return allKeys.filter(key => !deepEqual(a[key], b[key]));
    }

    static printDeepObjectDiffs(a, b, id = '', keys = null) {
        if (!keys) keys = Util.getDeepDiffKeys(a, b);
        keys.map(key => {
            const diff = detailedDiff(a[key], b[key]);
            console.log(
                id,
                'Changed property:', key,
                'updated:', diff.updated,
                'added:', diff.added,
                'deleted:', diff.deleted,
            )
            ;
            return null;
        });
    }

    static sortFiles(unsortedFiles, options) {
        let files = unsortedFiles;
        if (!options[ExplorerOptions.ShowHidden]) {
            files = _.filter(files, f => !f.base.startsWith('.'));
        }
        const compare = (fileA, fileB) => {
            if (options[ExplorerOptions.FoldersFirst]) {
                if (fileA.isDir && !fileB.isDir) return -1;
                if (!fileA.isDir && fileB.isDir) return 1;
            }

            if (options[ExplorerOptions.SortOrder] === SortOrder.NameAsc) {
                return fileA.base.localeCompare(fileB.base);
            } else {
                return fileA.base.localeCompare(fileB.base) * -1;
            }
        };
        files.sort(compare);
        return files;
    };

}
