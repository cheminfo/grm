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
        var repos = this.props.repos;
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
                        <label><input type="checkbox" onClick={this.switchVisible} /> show all repositories</label>
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
