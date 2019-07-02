/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import React from 'react';
import {Helmet} from 'react-helmet';
import {connect} from 'react-redux';
import * as PropTypes from 'prop-types';

import {EnvSummaryPropType} from '../../util/typedef';
import {createShallowEqualObjectSelector} from '../../redux/Selector';
import {AppState, BaseSelector, EnvSummary, TagMap} from '../../redux/ReduxTypedef';

type TabManageTagsProps = {
    summary: EnvSummary,

    tagIds: string[],
    tagMap: TagMap,
}

type TabManageTagsState = {}

class TabManageTags extends React.Component<TabManageTagsProps, TabManageTagsState> {

    static propTypes = {
        // Props used in redux.connect
        summary: EnvSummaryPropType.isRequired,

        // Props provided by redux.connect
        tagIds: PropTypes.arrayOf(PropTypes.string).isRequired,
        tagMap: PropTypes.object.isRequired,
    };

    summary: EnvSummary;

    constructor(props: TabManageTagsProps) {
        super(props);
        /** @type {EnvSummary} */
        this.summary = props.summary;

        this.state = {};
    }

    render() {
        return <React.Fragment>
            <Helmet><title>Tags</title></Helmet>
            <div>
                <div className="title">MANAGE THEM TAGS!</div>
            </div>
        </React.Fragment>;
    };

}

const getTagMap: BaseSelector<any, TagMap> = (state, props) => state.envMap[props.summary.id].tagMap;
const getShallowTagMap = createShallowEqualObjectSelector(getTagMap, data => data);
export default connect((state: AppState, ownProps: any) => {
    const {tagIds} = state.envMap[ownProps.summary.id];
    return {
        tagIds,
        tagMap: getShallowTagMap(state, ownProps),
    };
})(TabManageTags);
