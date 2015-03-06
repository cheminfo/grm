'use strict';

import React from 'react';
import RepoList from './components/repo-list';

export default React.createClass({
    getInitialState() {
        return {
            visible: false
        };
    },
    switchVisible() {
        this.setState({
            visible: !this.state.visible
        });
    },
    render() {
        var allRepos = this.props.repos;
        var repos = {};
        for (let i = 0; i < allRepos.length; i++) {
            let repo = allRepos[i];
            if (!repos[repo.owner]) repos[repo.owner] = [];
            repos[repo.owner].push(repo);
        }
        var owners = Object.keys(repos);
        if (owners.length === 0) {
            return (
                <div>
                    No repository found
                </div>
            );
        } else {
            return (
                <div>
                    <div>
                        <label><input type="checkbox" onChange={this.switchVisible} /> show all repositories</label>
                    </div>
                    {owners.map(function (owner) {
                        return (
                            <RepoList visible={this.state.visible} key={owner} owner={owner} repos={repos[owner]} />
                        );
                    }, this)}
                </div>
            );
        }
    }
});
