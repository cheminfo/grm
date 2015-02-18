'use strict';

import React from 'react';

import Repo from './repository';

export default React.createClass({
    render() {
        var repos = [];
        for (let i = 0; i < this.props.repos.length; i++) {
            var repo = this.props.repos[i];
            if (this.props.visible || repo.local) {
                repos.push(
                    <Repo key={repo.repo.name} local={repo.local} data={repo.repo} />
                );
            }
        }
        return (
            <div>
                <h3>{this.props.owner}</h3>
                <div>{repos.length ? repos : 'No repo to show'}</div>
            </div>
        );
    }
});
