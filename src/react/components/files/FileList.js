/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';
import c from 'classnames';
import * as PropTypes from 'prop-types';

import Icon from '../Icon';
import FileEntry from './FileEntry';
import {EnvSummaryPropType, FileViewToClass} from '../../../util/typedef';

// const FileViewConfigs = {
//     [FileView.MediumThumb]: {columnWidth: 256, rowHeight: 156},
//     [FileView.LargeThumb]: {columnWidth: 406, rowHeight: 306},
// };

class FileList extends React.Component {

    static propTypes = {
        // Props passed by parent
        view: PropTypes.number.isRequired,
        summary: EnvSummaryPropType.isRequired,
        fileHashes: PropTypes.arrayOf(PropTypes.string),
        badHashes: PropTypes.arrayOf(PropTypes.string).isRequired,
        selection: PropTypes.object.isRequired,
        contextMenuId: PropTypes.string,
        showExtensions: PropTypes.bool.isRequired,
        collapseLongNames: PropTypes.bool.isRequired,
        handleSingleClick: PropTypes.func.isRequired,
        handleDoubleClick: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);
        this.summary = props.summary;
    }

    renderFiles() {
        const {
            fileHashes, badHashes, showExtensions, collapseLongNames, selection, contextMenuId,
            handleSingleClick, handleDoubleClick, view,
        } = this.props;

        const empty = fileHashes && fileHashes.length === 0;
        const loading = !fileHashes || (empty && badHashes.length > 0);

        if (loading) return <div className="file-list-text"><Icon name="cog" animation={true}/> Loading...</div>;
        else if (empty) return <div className="file-list-text">No files to show.</div>;

        const comps = new Array(fileHashes.length);
        for (let i = 0; i < comps.length; ++i) {
            const hash = fileHashes[i];
            comps[i] = <FileEntry key={hash} hash={hash} summary={this.summary} displayIndex={i} view={view}
                                  showExtension={showExtensions} collapseLongNames={collapseLongNames}
                                  selected={!!selection[hash]} contextMenuId={contextMenuId}
                                  onSingleClick={handleSingleClick} onDoubleClick={handleDoubleClick}/>;
        }
        return comps;
    }

    render() {
        const {view} = this.props;

        const className = c({
            'file-list': true,
            [FileViewToClass(view)]: true,
        });
        return <div className={className}>
            {this.renderFiles()}
        </div>;
    };

}

export default FileList;
