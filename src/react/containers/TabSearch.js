/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import _ from 'lodash';
import React from 'react';
import {Helmet} from 'react-helmet';
import {connect} from 'react-redux';
import * as PropTypes from 'prop-types';

import {
    EnvSummaryPropType,
    MenuIds,
    ReduxActions,
    TagSearchCondition,
} from '../../util/typedef';
import Tabs from '../components/Tabs';
import Icon from '../components/Icon';
import TagGroup from '../components/TagGroup';
import FileExplorer from '../components/files/FileExplorer';

const SearchConditionOptions = [
    {id: TagSearchCondition.All, name: 'All'},
    {id: TagSearchCondition.Any, name: 'Any'},
];

class TabSearch extends React.Component {

    static propTypes = {
        // Props used in redux.connect
        summary: EnvSummaryPropType.isRequired,

        // Props provided by redux.connect
        tagIds: PropTypes.arrayOf(PropTypes.string).isRequired,
        entityMap: PropTypes.object.isRequired,
        fileMap: PropTypes.object.isRequired,
        selectedTagsMap: PropTypes.object.isRequired,
        tagFilter: PropTypes.string.isRequired,
        tagSearchCondition: PropTypes.number.isRequired,
    };

    constructor(props) {
        super(props);
        this.summary = props.summary;

        this.state = {
            selection: {},
            contextFileHash: null,
            tagFilter: props.tagFilter,
        };
        this.debouncedTagFilterDispatch = _.debounce(tagFilter =>
            window.dataManager.dispatch(ReduxActions.TabSearchChangeTagFilter, this.summary.id, tagFilter), 100);
    }

    selectTag = tagId => {
        const actionData = {tagId, selected: true};
        window.dataManager.dispatch(ReduxActions.TabSearchChangeTagSelection, this.summary.id, actionData);
    };

    deselectTag = tagId => {
        const actionData = {tagId, selected: false};
        window.dataManager.dispatch(ReduxActions.TabSearchChangeTagSelection, this.summary.id, actionData);
    };

    handleTagFilterChange = tagFilter => {
        this.setState({tagFilter});
        this.debouncedTagFilterDispatch(tagFilter);
    };

    handleTagSearchConditionChange = conditionId => {
        window.dataManager.dispatch(ReduxActions.TabSearchChangeTagSearchCondition, this.summary.id, conditionId);
    };

    renderAvailableTags(availableTags) {
        const {tagFilter: propTagFilter} = this.props;
        const {tagFilter} = this.state;

        return <div className="env-search-available">
            <div className="title is-size-6">Available tags:</div>
            <div className="field has-addons">
                <p className="control">
                    <button className="button is-static"><Icon name="search"/></button>
                </p>
                <p className="control is-expanded">
                    <input className="input" type="text" placeholder="Search tags" value={tagFilter}
                           onChange={event => this.handleTagFilterChange(event.target.value)}/>
                </p>
            </div>
            <TagGroup tagIds={availableTags} summary={this.summary} onClick={this.selectTag}
                      showPlaceHolderOnEmpty={true} nameFilter={propTagFilter}/>
        </div>;
    }

    renderSelectedTags(selectedTags) {
        const {tagSearchCondition} = this.props;

        return <div className="env-search-selected">
            <div className="title is-size-6">
                Selected tags (require
                <div style={{display: 'inline-block'}}>
                    <Tabs options={SearchConditionOptions} className="is-toggle" activeOption={tagSearchCondition}
                          onOptionChange={this.handleTagSearchConditionChange}/>
                </div>
                ):
            </div>
            <TagGroup tagIds={selectedTags} summary={this.summary} onClick={this.deselectTag}
                      showPlaceHolderOnEmpty={true}/>
        </div>;
    }

    render() {
        const {tagIds, entityMap, fileMap, selectedTagsMap, tagSearchCondition} = this.props;
        const [selectedTags, availableTags] = _.partition(tagIds, id => !!selectedTagsMap[id]);
        const selectedTagCount = _.size(selectedTagsMap);

        let relevantEntityIds;
        if (selectedTagCount === 0) {
            relevantEntityIds = Object.keys(entityMap);
        } else {
            const entities = Object.values(entityMap);
            let relevantEntities;
            if (tagSearchCondition === TagSearchCondition.Any) {
                relevantEntities = entities.filter(e => e.tagIds.some(id => !!selectedTagsMap[id]));
            } else if (tagSearchCondition === TagSearchCondition.All) {
                const selectedTagIds = Object.keys(selectedTagsMap);
                relevantEntities = entities.filter(e => _.intersection(e.tagIds, selectedTagIds).length === selectedTagCount);
            } else {
                console.warn('Unknown "tagSearchCondition" specified in TabSearch!');
            }
            relevantEntityIds = relevantEntities.map(e => e.id);
        }
        const hashes = relevantEntityIds.map(id => entityMap[id].hash);
        const [goodHashes, badHashes] = _.partition(hashes, h => !!fileMap[h]);

        return <React.Fragment>
            <Helmet><title>Search</title></Helmet>

            <div className="columns env-search-top">
                <div className="column">
                    {this.renderAvailableTags(availableTags)}
                </div>
                <div className="is-divider-vertical"/>
                <div className="column">
                    {this.renderSelectedTags(selectedTags)}
                </div>
            </div>

            <FileExplorer summary={this.summary} fileHashes={hashes} changePath={this.changePath}
                          contextMenuId={MenuIds.TabSearch}/>
        </React.Fragment>;
    };

}

export default connect((state, ownProps) => {
    const {tagIds, entityMap, fileMap, tabSearch} = state.envMap[ownProps.summary.id];
    return {
        tagIds,
        entityMap,
        fileMap,
        ...tabSearch,
    };
})(TabSearch);
