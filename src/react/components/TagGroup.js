/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import React from 'react';
import c from 'classnames';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {EnvironmentContext, EnvSummaryPropType} from '../../util/typedef';

class TagGroup extends React.Component {

    // noinspection JSUnusedGlobalSymbols
    static contextType = EnvironmentContext;

    static propTypes = {
        // Props used in redux.connect
        entityId: PropTypes.string,
        summary: EnvSummaryPropType.isRequired,
        tagIds: PropTypes.arrayOf(PropTypes.string),
        nameFilter: PropTypes.string,

        // Props provided by redux.connect
        tags: PropTypes.arrayOf(PropTypes.object).isRequired,
        hiddenTagCount: PropTypes.number,

        // Props passed by parent
        onClick: PropTypes.func,
        showEllipsis: PropTypes.bool,
        showPlaceHolderOnEmpty: PropTypes.bool,
    };

    static defaultProps = {
        showEllipsis: false,
        showPlaceHolderOnEmpty: false,
    };

    constructor(props) {
        super(props);
        this.summary = this.context;
    }

    renderTags() {
        const {tags, onClick, showEllipsis, showPlaceHolderOnEmpty, hiddenTagCount} = this.props;
        if (hiddenTagCount === 0 && (!tags || tags.length === 0)) {
            if (!showPlaceHolderOnEmpty) return;
            return <div className="tag-group-tag tag-group-tag-empty">Nothing to show</div>;
        }

        const badClassName = c({
            'tag-group-tag': true,
            'tag-group-tag-bad': true,
        });

        const hiddenClassName = c({
            'tag-group-tag': true,
            'tag-group-tag-hidden': true,
        });

        const className = c({
            'tag-group-tag': true,
            'text-ellipsis': showEllipsis,
            'clickable': !!onClick,
        });

        const comps = new Array(tags.length);
        for (let i = 0; i < tags.length; ++i) {
            const tag = tags[i];
            if (!tag) {
                comps[i] = <div key={`bad-tag-${i}`} className={badClassName}>Bad tag!</div>;
                continue;
            }
            const style = {background: tag.color};
            const title = showEllipsis ? tag.name : null;
            const clickFunc = onClick ? () => onClick(tag.id) : null;
            const HtmlTagToUse = onClick ? 'button' : 'div';
            comps[i] = <HtmlTagToUse key={tag.id} className={className} style={style}
                            title={title} onClick={clickFunc}>
                {tag.name}
            </HtmlTagToUse>;
        }

        if (hiddenTagCount > 0) {
            comps.push(<div key={`hidden-tag-count`} className={hiddenClassName}>
                ({hiddenTagCount} tag{hiddenTagCount !== 1 ? 's' : ''} hidden)
            </div>);
        }

        return comps;
    }

    render() {
        return <div className="tag-group">{this.renderTags()}</div>;
    };

}

export default connect((state, ownProps) => {
    const {summary, tagIds, entityId, nameFilter} = ownProps;
    const {tagMap, entityMap} = state.envMap[summary.id];
    let finalTagIds;
    if (tagIds) {
        finalTagIds = tagIds;
    } else {
        const entity = entityMap[entityId];
        if (entity) finalTagIds = entity.tagIds;
    }
    let tags = finalTagIds ? finalTagIds.map(tagId => tagMap[tagId]) : null;
    let hiddenTagCount = 0;
    if (tags && nameFilter) {
        const fixedFilter = nameFilter.trim().toLowerCase();
        const oldLength = tags.length;
        tags = tags.filter(t => t.name.toLowerCase().indexOf(fixedFilter) !== -1);
        hiddenTagCount = oldLength - tags.length;
    }
    return {tags, hiddenTagCount};
})(TagGroup);
