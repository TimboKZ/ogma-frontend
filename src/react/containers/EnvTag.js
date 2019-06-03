/**
 * @author v1ndic4te
 * @copyright 2018
 * @licence GPL-3.0
 */

import _ from 'lodash';
import path from 'path';
import upath from 'upath';
import React from 'react';
import PropTypes from 'prop-types';
import equal from 'fast-deep-equal';
import {ContextMenuWrapper, hideAllContextMenus, prepareContextMenuHandlers} from 'react-context-menu-wrapper';

import Util from '../../util/Util';
import Icon from '../components/Icon';
import ModalUtil from '../../util/ModalUtil';
import Checkbox from '../components/Checkbox';
import FileEntry from '../components/FileEntry';
import Breadcrumbs from '../components/Breadcrumbs';
import {BackendEvents, KeyCode} from '../../typedef';
import TagContextMenu from '../components/TagContextMenu';

const Options = {
    CollapseLong: 'collapse-long',
    FoldersFirst: 'folders-first',
    ShowExtensions: 'show-exts',
    ShowHidden: 'show-hidden',
};

const TagContextMenuId = 'tag-context-menu';

export default class EnvTag extends React.Component {

    static propTypes = {
        envSummary: PropTypes.object.isRequired,
        history: PropTypes.any,
    };

    constructor(props) {
        super(props);

        const summary = this.props.envSummary;
        const uriHash = this.props.location.hash.slice(1);
        const initPath = decodeURI(uriHash) || '/';
        this.state = {
            summary,
            rootDirName: upath.basename(summary.path),

            files: [],
            fileMap: {},
            selection: {},
            path: initPath,
            contextFile: null,
            levelUpDisabled: true,

            optionState: {
                [Options.CollapseLong]: false,
                [Options.FoldersFirst]: true,
                [Options.ShowExtensions]: true,
                [Options.ShowHidden]: true,
            },
        };
        this.state.breadcrumbs = this.pathToBreadcrumbs(this.state.path);

        this.optionCheckboxes = [
            {id: Options.CollapseLong, name: 'Collapse long names'},
            {id: Options.FoldersFirst, name: 'Show folders first'},
            {id: Options.ShowExtensions, name: 'Show extensions'},
            {id: Options.ShowHidden, name: 'Show hidden files'},
        ];
        this.optionButtons = [
            {icon: 'sync-alt', name: 'Refresh directory', callback: () => null},
            {icon: 'folder-minus', name: 'Clear file cache', callback: () => null},
        ];
    }

    componentDidMount() {
        this.changePath(this.state.path);
        document.addEventListener('keydown', this.handleKeyPress, false);
        window.dataManager.subscribe(BackendEvents.EnvTagFiles, this.handleFileTagging);
        window.dataManager.subscribe(BackendEvents.EnvRemoveFiles, this.handleFileDeletion);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyPress, false);
        window.dataManager.unsubscribe(BackendEvents.EnvTagFiles, this.handleFileTagging);
        window.dataManager.unsubscribe(BackendEvents.EnvRemoveFiles, this.handleFileDeletion);
    }

    componentDidUpdate(prevProps) {
        const summary = this.props.envSummary;
        const summaryChanged = !equal(prevProps.envSummary, summary);
        if (summaryChanged) this.setState({summary});
    }

    changePath = newPath => {
        const normPath = path.normalize(newPath);
        const s = this.state.summary;
        window.ipcModule.getDirectoryContents({id: s.id, path: normPath})
            .then(files => {
                this.setState({
                    files,
                    fileMap: Util.arrayToObject(files, f => f.hash),
                    selection: {},
                    path: normPath,
                    levelUpDisabled: normPath === '/',
                    breadcrumbs: this.pathToBreadcrumbs(normPath),
                });
                this.props.history.push(`#${normPath}`);
            })
            .catch(window.handleError);
    };

    pathToBreadcrumbs(normPath) {
        const pathParts = normPath === '/' ? [] : normPath.split('/').slice(1);
        const onClick = this.changePath;
        const breadcrumbs = new Array(pathParts.length + 1);
        breadcrumbs[0] = {id: '/', title: this.state.rootDirName, onClick};

        let currPath = '';
        for (let i = 0; i < pathParts.length; ++i) {
            const part = pathParts[i];
            currPath += `/${part}`;
            breadcrumbs[i + 1] = {id: currPath, title: part, onClick};
        }
        return breadcrumbs;
    }

    handleKeyPress = event => {
        if (event.keyCode === KeyCode.Esc) {
            hideAllContextMenus();
        }
    };

    handleFileTagging = data => {
        const s = this.state.summary;
        if (data.id !== s.id) return;

        const files = this.state.files;
        const fileMap = this.state.fileMap;
        const taggedHashes = data.hashes;
        for (let i = 0; i < taggedHashes.length; ++i) {
            const file = fileMap[taggedHashes[i]];
            if (!file) continue;
            file.entityId = data.entityIds[i];
            file.tagIds = _.union(file.tagIds, data.tagIds);
        }

        this.setState({files, fileMap});
    };

    handleFileDeletion = data => {
        const s = this.state.summary;
        if (data.id !== s.id) return;

        const files = this.state.files;
        const deletedHashes = data.hashes;
        const deletedFiles = _.pullAllWith(files, deletedHashes, (f, h) => f.hash === h);
        if (deletedFiles.length === 0) return;

        const fileMap = this.state.fileMap;
        for (const delFile of deletedFiles) delete fileMap[delFile.hash];

        this.setState({
            files,
            fileMap,
            selection: {},
        });
    };

    handleCheckboxChange = (id, value) => {
        this.setState({
            optionState: {
                ...this.state.optionState,
                [id]: value,
            },
        });
    };

    handleFileClick = (file, event) => {
        const hash = file.hash;

        const mod = event.ctrlKey || event.shiftKey;
        this.setState(prevState => {
            const oldSel = prevState.selection;
            const oldSelSize = _.size(oldSel);
            const selection = mod ? oldSel : {};
            if (oldSel[hash] && oldSelSize <= 1) {
                console.log(oldSelSize);
                delete selection[hash];
            } else {
                selection[hash] = file;
            }
            return {selection};
        });
    };

    handleFileDoubleClick = file => {
        const s = this.props.envSummary;
        const relPath = path.join(this.state.path, file.base);
        if (file.isDir) {
            this.changePath(relPath);
        } else if (window.dataManager.isLocalClient()) {
            return window.ipcModule.openFile({id: s.id, path: relPath})
                .catch(window.handleError);
        } else {
            ModalUtil.showError({message: 'Opening files in the browser is not supported yet.'});
        }
    };

    handleContextMenuShow = data => {
        this.setState(prevState => {
            const newState = {contextFile: data};

            const oldSel = prevState.selection;
            const oldSelSize = _.size(oldSel);
            if (oldSelSize <= 1) {
                newState.selection = {};
                newState.selection[data.hash] = data;
            }

            return newState;
        });
    };

    renderOptionCheckboxes() {
        const checkboxes = this.optionCheckboxes;
        const comps = new Array(checkboxes.length);
        for (let i = 0; i < checkboxes.length; i++) {
            const checkbox = checkboxes[i];
            const key = `${this.props.envSummary.id}-${checkbox.id}`;
            comps[i] = <div key={key} className="dropdown-item">
                <div className="field">
                    <Checkbox id={checkbox.id} name={checkbox.name} checked={this.state.optionState[checkbox.id]}
                              onChange={this.handleCheckboxChange}/>
                </div>
            </div>;
        }
        return comps;
    }

    renderOptionButtons() {
        const buttons = this.optionButtons;
        const comps = new Array(buttons.length);
        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            const key = `${this.props.envSummary.id}-${button.name}`;
            comps[i] = <button key={key} className="dropdown-item" onClick={button.callback}>
                <Icon name={button.icon} wrapper={false}/>&nbsp;&nbsp;&nbsp;<span>{button.name}</span>
            </button>;
        }
        return comps;
    }

    renderFiles() {
        const state = this.state;
        let files = state.files;

        if (files.length === 0) {
            return <div className="file-nothing">
                No files to show.
            </div>;
        }

        if (!state.optionState[Options.ShowHidden]) {
            files = _.filter(files, f => !f.name.startsWith('.'));
        }

        const compare = (fileA, fileB) => {
            if (state.optionState[Options.FoldersFirst]) {
                if (fileA.isDir && !fileB.isDir) return -1;
                if (!fileA.isDir && fileB.isDir) return 1;
            }

            return fileA.name.localeCompare(fileB.name);
        };
        files.sort(compare);

        const comps = new Array(files.length);
        for (let i = 0; i < files.length; ++i) {
            const file = files[i];
            const handlers = prepareContextMenuHandlers({id: TagContextMenuId, data: file});
            comps[i] = <FileEntry key={file.hash} file={file} basePath={state.path} envSummary={state.summary}
                                  showExtension={state.optionState[Options.ShowExtensions]}
                                  collapseLongNames={state.optionState[Options.CollapseLong]}
                                  onSingleClick={this.handleFileClick} selected={!!state.selection[file.hash]}
                                  onDoubleClick={this.handleFileDoubleClick}
                                  handlers={handlers}/>;
        }

        return comps;
    }

    render() {
        const state = this.state;

        return <div>

            <div className="level env-tag-top-bar">
                <div className="level-left">
                    <div className="level-item">
                        <button className="button" disabled={state.levelUpDisabled}
                                onClick={() => this.changePath(path.join(state.path, '..'))}>
                            <Icon name="level-up-alt"/>
                        </button>
                    </div>
                    <div className="level-item breadcrumbs-level-item">
                        <Breadcrumbs options={state.breadcrumbs}/>
                    </div>
                </div>
                <div className="level-right">
                    <div className="level-item">
                        <div className="dropdown is-right is-hoverable">
                            <div className="dropdown-trigger">
                                <button className="button" aria-haspopup="true" aria-controls="dropdown-menu">
                                    <span>Options</span><Icon name="angle-down"/>
                                </button>
                            </div>
                            <div className="dropdown-menu" id="dropdown-menu" role="menu">
                                <div className="dropdown-content">
                                    {this.renderOptionCheckboxes()}
                                    <hr className="dropdown-divider"/>
                                    {this.renderOptionButtons()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="file-explorer">
                {this.renderFiles()}
            </div>

            <ContextMenuWrapper id={TagContextMenuId} hideOnSelfClick={false} onShow={this.handleContextMenuShow}>
                <TagContextMenu id={TagContextMenuId} file={state.contextFile} changePath={this.changePath}
                                envSummary={state.summary} selection={state.selection}/>
            </ContextMenuWrapper>

            {/*<br/>*/}
            {/*<TagContextMenu id={TagContextMenuId} file={state.contextFile} changePath={this.changePath}*/}
            {/*                envSummary={state.summary} selection={state.selection}/>*/}

        </div>;
    }

}
