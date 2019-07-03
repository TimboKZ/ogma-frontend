/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import _ from 'lodash';
import React from 'react';
import {Helmet} from 'react-helmet';
import {connect} from 'react-redux';
import * as PropTypes from 'prop-types';

import Icon from '../components/Icon';
import {EnvSummaryPropType} from '../../util/typedef';
import {createShallowEqualObjectSelector} from '../../redux/Selector';
import {AppState, BaseSelector, EnvSummary, Tag, TagMap} from '../../redux/ReduxTypedef';

type TabManageSinksProps = {
    // Props used in redux.connect
    summary: EnvSummary,

    // Props provided by redux.connect
    tagIds: string[],
    tagMap: TagMap,
}

type TabManageSinksState = {
    selectedTag?: Tag,
    hasUnsavedChanges: boolean,
}

class TabManageSinks extends React.Component<TabManageSinksProps, TabManageSinksState> {

    static propTypes = {
        // Props used in redux.connect
        summary: EnvSummaryPropType.isRequired,

        // Props provided by redux.connect
        tagIds: PropTypes.arrayOf(PropTypes.string).isRequired,
        tagMap: PropTypes.object.isRequired,
    };

    summary: EnvSummary;

    constructor(props: TabManageSinksProps) {
        super(props);
        this.summary = props.summary;
    }

    render() {
        return <React.Fragment>
            <Helmet><title>Sinks</title></Helmet>
            <div className="columns env-manage-tags">
                <div className="column">
                    <div className="field has-addons">
                        <p className="control">
                            <button className="button is-static"><Icon name="search"/></button>
                        </p>
                        <p className="control is-expanded">
                            {/*<input className="input" type="text" placeholder="Search tags" value={tagFilter}*/}
                            {/*       onChange={event => this.handleTagFilterChange(event.target.value)}/>*/}
                        </p>
                    </div>
                </div>
            </div>
        </React.Fragment>;
    };

}

const getTagMap: BaseSelector<any, TagMap> = (state, props) => state.envMap[props.summary.id].tagMap;
const getShallowTagMap = createShallowEqualObjectSelector(getTagMap, data => data);
const getTagEntityCount: BaseSelector<any, { [tagId: string]: number }> = (state, props) => {
    const tagEntityMap = state.envMap[props.summary.id].tagEntityMap;
    const tagEntityCount: { [tagId: string]: number } = {};
    for (const tagId in tagEntityMap) {
        tagEntityCount[tagId] = tagEntityMap[tagId].length;
    }
    return tagEntityCount;
};
const getShallowTagEntityCount = createShallowEqualObjectSelector(getTagEntityCount, data => data);
const getTagIds: BaseSelector<any, string[]> = (state, props) => state.envMap[props.summary.id].tagIds;
const getSortedTagIds = createShallowEqualObjectSelector(getTagIds, getShallowTagEntityCount, (tagIds, tagEntityCount) => {
    return _.orderBy(tagIds, id => tagEntityCount[id], 'desc');
});
export default connect((state: AppState, ownProps: any) => {
    return {
        tagIds: getSortedTagIds(state, ownProps),
        tagMap: getShallowTagMap(state, ownProps),
    };
})(TabManageSinks);
