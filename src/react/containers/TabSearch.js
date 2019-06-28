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
import Util from '../../util/Util';
import Tabs from '../components/Tabs';
import Icon from '../components/Icon';
import TagGroup from '../components/TagGroup';
import FileExplorer from '../components/files/FileExplorer';
import {createShallowEqualObjectSelector} from '../../redux/Selector';

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
        /** @type {EnvSummary} */
        this.summary = props.summary;

        this.state = {
            tagFilter: props.tagFilter,
            ...this.extractGoodHashesAndLoadingList(),
        };
        this.debouncedTagFilterDispatch = _.debounce(tagFilter =>
            window.dataManager.dispatch(ReduxActions.TabSearchChangeTagFilter, this.summary.id, tagFilter), 100);
    }

    componentDidMount() {
        const {entitiesToBeLoaded} = this.state;
        if (entitiesToBeLoaded.length !== 0) {
            window.dataManager.requestEntityFiles({id: this.summary.id, entityIds: entitiesToBeLoaded})
                .catch(window.handleError);
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        /** @type {string[]} */
        const {entitiesToBeLoaded} = this.state;
        if (!Util.shallowEqual(entitiesToBeLoaded, prevState.entitiesToBeLoaded) && entitiesToBeLoaded.length !== 0) {
            window.dataManager.requestEntityFiles({id: this.summary.id, entityIds: entitiesToBeLoaded})
                .catch(window.handleError);
        }

        if (!Util.shallowEqual(this.props, prevProps)) {
            this.setState({...this.extractGoodHashesAndLoadingList()});
        }
    }

    /**
     * @returns {{goodHashes: string[], entitiesToBeLoaded: string[]}}
     */
    extractGoodHashesAndLoadingList() {
        const {entityMap, fileMap, selectedTagsMap, tagSearchCondition} = this.props;
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
        const goodHashes = relevantEntityIds.map(id => entityMap[id].hash);
        const badIndices = _.keys(_.pickBy(goodHashes, h => !fileMap[h]));

        _.pullAt(goodHashes, badIndices);
        const entitiesToBeLoaded = _.at(relevantEntityIds, badIndices);
        // noinspection JSValidateTypes
        return {goodHashes, entitiesToBeLoaded};
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
        const {tagIds, selectedTagsMap} = this.props;
        const {goodHashes, entitiesToBeLoaded} = this.state;
        const [selectedTags, availableTags] = _.partition(tagIds, id => !!selectedTagsMap[id]);

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

            <FileExplorer summary={this.summary} fileHashes={goodHashes} loadingCount={entitiesToBeLoaded.length}
                          changePath={this.changePath} contextMenuId={MenuIds.TabSearch}/>
        </React.Fragment>;
    };

}

const getEntityMap = (state, props) => state.envMap[props.summary.id].entityMap;
const getFileMap = (state, props) => state.envMap[props.summary.id].fileMap;
const getShallowEntityMap = createShallowEqualObjectSelector(getEntityMap, data => data);
const getShallowFileMap = createShallowEqualObjectSelector(getFileMap, data => data);
export default connect((state, ownProps) => {
    const {tagIds, tabSearch} = state.envMap[ownProps.summary.id];
    return {
        tagIds,
        entityMap: getShallowEntityMap(state, ownProps),
        fileMap: getShallowFileMap(state, ownProps),
        ...tabSearch,
    };
})(TabSearch);
