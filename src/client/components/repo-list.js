'use strict';

import React from 'react';

import Repo from './repository';

export default React.createClass({
    render() {
        var l = this.props.repos.length;
        var repos = new Array(l);
        for (let i = 0; i < l; i++) {
            var repo = this.props.repos[i];
            repos[i] = (
                <Repo visible={this.props.visible} key={repo.name} repo={repo} />
            );
        }
        return (
            <div>
                <tr><td colSpan="4"><h3>{this.props.owner}</h3></td></tr>
                {repos}
            </div>
        );
    }
});
