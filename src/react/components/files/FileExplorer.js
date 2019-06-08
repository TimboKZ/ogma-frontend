/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import _ from 'lodash';
import path from 'path';
import React from 'react';
import Fuse from 'fuse.js';
import Promise from 'bluebird';
import equal from 'fast-deep-equal';
import {connect} from 'react-redux';
import * as PropTypes from 'prop-types';
import {createSelector} from 'reselect';
import {NotificationManager} from 'react-notifications';
import {ContextMenuWrapper} from 'react-context-menu-wrapper';

import FileList from './FileList';
import Util from '../../../util/Util';
import FilePreview from './FilePreview';
import FileStatusBar from './FileStatusBar';
import TagContextMenu from '../TagContextMenu';
import {createDeepEqualSelector} from '../../../redux/Selector';
import {EnvSummaryPropType, ExplorerOptions, ExplorerOptionsDefaults, KeyCode} from '../../../util/typedef';

const FuseOptions = {
    id: 'hash',
    keys: ['base'],
    threshold: 0.4,
};

class FileExplorer extends React.Component {

    static propTypes = {
        // Props used in redux.connect
        path: PropTypes.string,
        summary: EnvSummaryPropType.isRequired,
        fileHashes: PropTypes.arrayOf(PropTypes.string),

        // Props provided by redux.connect
        slimFiles: PropTypes.arrayOf(PropTypes.object),
        badHashes: PropTypes.arrayOf(PropTypes.string).isRequired,

        // Props passed by parent
        changePath: PropTypes.func,
        showPreview: PropTypes.bool,
        contextMenuId: PropTypes.string,
    };

    static defaultProps = {
        showPreview: false,
    };

    constructor(props) {
        super(props);
        this.summary = props.summary;

        this.state = {
            filter: '',
            selection: {},
            contextFileHash: null,
            options: {...ExplorerOptionsDefaults},

            showPreview: props.showPreview,
        };
    }

    static sortFiles(slimFiles, options) {
        return slimFiles ? Util.sortFiles(slimFiles, options).map(f => f.hash) : null;
    };

    static combineHashes(sortedHashes, filteredHashes) {
        if (sortedHashes === filteredHashes) return filteredHashes;

        const filteredMap = {};
        for (const hash of filteredHashes) filteredMap[hash] = true;

        const fileHashes = new Array(sortedHashes.length);
        let j = 0;
        for (let i = 0; i < sortedHashes.length; ++i) {
            const hash = sortedHashes[i];
            if (filteredMap[hash]) {
                fileHashes[j++] = hash;
            }
        }
        return fileHashes.slice(0, j);
    }

    static getDerivedStateFromProps(props, state) {
        const {slimFiles} = props;

        if (slimFiles !== state.slimFiles) {
            const sortedHashes = FileExplorer.sortFiles(slimFiles, state.options);
            let fuse = null;
            let filteredHashes = sortedHashes;
            if (slimFiles && state.filter) {
                let fuse = new Fuse(slimFiles, FuseOptions);
                filteredHashes = fuse.search(state.filter);
            }
            return {
                fuse,
                slimFiles,
                sortedHashes,
                filteredHashes,
                fileHashes: FileExplorer.combineHashes(sortedHashes, filteredHashes),
            };
        }
        return null;
    }

    componentDidMount() {
        const {path, badHashes} = this.props;
        const {slimFiles} = this.state;
        const dm = window.dataManager;
        if (path) {
            const selection = {};
            this.setState({selection});
            Promise.resolve()
                .then(() => dm.requestDirectoryContent({id: this.summary.id, path, wasCached: !!slimFiles}))
                .catch(window.handleError);
        }

        if (badHashes && badHashes.length !== 0) {
            Promise.resolve()
                .then(() => dm.getEntityFiles({id: this.summary.id, hashes: badHashes}))
                .catch(window.handleError);
        }

        document.addEventListener('keydown', this.handleKeydown);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeydown);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {path, slimFiles, badHashes} = this.props;

        if (path !== prevProps.path) {
            const selection = {};
            this.setState({selection});
            window.dataManager.requestDirectoryContent({id: this.summary.id, path, wasCached: !!slimFiles})
                .catch(window.handleError);
        }

        if (!equal(badHashes, prevProps.badHashes) && badHashes.length !== 0) {
            window.dataManager.getEntityFiles({id: this.summary.id, hashes: badHashes})
                .catch(window.handleError);
        }
    }

    handleKeydown = event => {
        const {path: currPath, changePath} = this.props;
        const {fileHashes, selection: oldSelection} = this.state;

        const tagName = event.target.tagName.toUpperCase();
        const isInInput = tagName === 'INPUT' || tagName === 'TEXTAREA';
        if (isInInput) return;

        switch (event.keyCode) {
            case KeyCode.A:
                if (event.ctrlKey) {
                    event.preventDefault();
                    const selection = {};
                    if (_.size(oldSelection) !== fileHashes.length) {
                        for (const hash of fileHashes) selection[hash] = true;
                    }
                    this.setState({selection});
                }
                break;
            case KeyCode.Backspace:
                if (changePath && currPath !== '/') changePath(path.dirname(currPath));
                break;
            default:
            // Do nothing
        }
    };

    handleFilterChange = filter => {
        if (filter === this.state.filter) return;

        this.setState(prevState => {
            const {slimFiles, sortedHashes} = prevState;
            let filteredHashes = sortedHashes;
            if (filter) {
                let {fuse} = prevState;
                if (!fuse && slimFiles) fuse = new Fuse(slimFiles, FuseOptions);
                filteredHashes = fuse ? fuse.search(filter) : sortedHashes;
            }
            return {
                filter,
                filteredHashes,
                fileHashes: FileExplorer.combineHashes(sortedHashes, filteredHashes),
            };
        });
    };

    handleSortChange = sort => {
        if (sort === this.state.options[ExplorerOptions.SortOrder]) return;
        this.setState(prevState => {
            const options = {...prevState.options, [ExplorerOptions.SortOrder]: sort};
            const sortedHashes = FileExplorer.sortFiles(prevState.slimFiles, options);
            return {
                options,
                sortedHashes,
                fileHashes: FileExplorer.combineHashes(sortedHashes, prevState.filteredHashes),
            };
        });
    };

    handleViewChange = view => {
        if (view === this.state.options[ExplorerOptions.FileView]) return;
        this.setState(prevState => ({options: {...prevState.options, [ExplorerOptions.FileView]: view}}));
    };

    handlePreviewToggle = () => {
        this.setState(prevState => ({showPreview: !prevState.showPreview}));
    };

    handleSingleClick = (file, event, displayIndex) => {
        const {fileHashes} = this.state;

        const hash = file.hash;

        const triggeredByKeyboard = event.detail === 0;
        const multiSelection = event.ctrlKey || triggeredByKeyboard;
        const shiftKey = event.shiftKey;
        this.setState(prevState => {
            const oldSel = prevState.selection;
            const oldSelSize = _.size(oldSel);

            let selection = {};
            const rangeSelection = prevState.lastSelectionIndex !== -1 ? shiftKey : false;
            if (rangeSelection) {
                let a = prevState.lastSelectionIndex;
                let b = displayIndex;
                if (a > b) {
                    const temp = b;
                    b = a;
                    a = temp;
                }
                for (let i = a; i < b + 1; ++i) {
                    selection[fileHashes[i]] = true;
                }
            } else {
                if (multiSelection) selection = oldSel;
                if (oldSel[hash] && oldSelSize <= 1) {
                    delete selection[hash];
                } else {
                    selection[hash] = !selection[hash];
                }
            }

            const updateSelectionIndex = (prevState.lastSelectionIndex === -1) || !(multiSelection || shiftKey);
            let newSelectionIndex = updateSelectionIndex ? displayIndex : prevState.lastSelectionIndex;
            return {selection, lastSelectionIndex: newSelectionIndex};
        });
    };

    handleDoubleClick = file => {
        const {changePath} = this.props;
        if (file.isDir) {
            if (changePath) changePath(file.nixPath);
        } else {
            if (window.dataManager.isLocalClient()) {
                Promise.resolve()
                    .then(() => window.ipcModule.openFile({id: this.summary.id, path: file.nixPath}))
                    .catch(window.handleError);
            } else {
                NotificationManager.warning('Opening files in the browser is not supported yet.');
            }
        }
    };

    handleContextMenuShow = hash => {
        this.setState(prevState => {
            const newState = {contextFileHash: hash};

            const oldSel = prevState.selection;
            const oldSelSize = _.size(oldSel);
            if (oldSelSize <= 1) {
                newState.selection = {};
                newState.selection[hash] = true;
            }

            return newState;
        });
    };

    render() {
        const {badHashes, contextMenuId, changePath} = this.props;
        const {filter, slimFiles, fileHashes, selection, options, showPreview, contextFileHash} = this.state;

        const fileListComp = <FileList summary={this.summary} fileHashes={fileHashes} badHashes={badHashes}
                                       selection={selection} contextMenuId={contextMenuId}
                                       view={options[ExplorerOptions.FileView]}
                                       showExtensions={options[ExplorerOptions.ShowExtensions]}
                                       collapseLongNames={options[ExplorerOptions.CollapseLongNames]}
                                       handleSingleClick={this.handleSingleClick}
                                       handleDoubleClick={this.handleDoubleClick}/>;
        const filePreviewComp = <FilePreview/>;

        const fileCount = fileHashes ? fileHashes.length : -1;
        const hiddenCount = (slimFiles ? slimFiles.length : -1) - fileCount;
        const selectionSize = _.size(selection);
        const loadingCount = badHashes.length;

        return <div className="file-explorer">
            <FileStatusBar filter={filter} onFilerChange={this.handleFilterChange}
                           fileCount={fileCount} hiddenCount={hiddenCount}
                           selectionSize={selectionSize} loadingCount={loadingCount}
                           sort={options[ExplorerOptions.SortOrder]} onSortChange={this.handleSortChange}
                           view={options[ExplorerOptions.FileView]} onViewChange={this.handleViewChange}
                           showPreview={showPreview} onPreviewToggle={this.handlePreviewToggle}/>
            {fileListComp}
            {showPreview && filePreviewComp}

            <ContextMenuWrapper id={contextMenuId} hideOnSelfClick={false} onShow={this.handleContextMenuShow}>
                <TagContextMenu id={contextMenuId} fileHash={contextFileHash} changePath={changePath}
                                summary={this.summary} selection={selection}
                                confirmDeletions={options[ExplorerOptions.ConfirmDeletions]}/>
            </ContextMenuWrapper>
        </div>;
    };

}

const getFileMap = (state, props) => state.envMap[props.summary.id].fileMap;
const getData = (_, props) => ({path: props.path, fileHashes: props.fileHashes});
const getFileHashes = createSelector([getFileMap, getData], (fileMap, data) => {
    const {path, fileHashes} = data;
    if (path === null || path === undefined) return fileHashes;

    const dirFile = fileMap[Util.getFileHash(path)];
    if (dirFile) return dirFile.fileHashes;
    return null;
});
const getSlimFiles = createSelector([getFileMap, getFileHashes], (fileMap, fileHashes) => {
    let slimFiles = null;
    let badHashes = [];
    if (fileHashes) {
        const files = fileHashes.map(h => fileMap[h]);
        const badIndices = _.keys(_.pickBy(files, f => !f));
        badHashes = _.at(fileHashes, badIndices);

        _.pullAt(files, badIndices);
        slimFiles = files.map(f => ({
            hash: f.hash,
            base: f.base,
            isDir: f.isDir,
        }));
    }
    return {slimFiles, badHashes};
});
const getSlimFilesDeep = createDeepEqualSelector([getSlimFiles], data => data);

export default connect((state, ownProps) => {
    return {...getSlimFilesDeep(state, ownProps)};
})(FileExplorer);
// })(withPropChecker(FileExplorer, () => 'Expl'));
