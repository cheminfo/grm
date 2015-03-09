'use strict';

import React from 'react';
import agent from 'superagent';

import Username from './components/username';
import View from './view';

export default React.createClass({
    getInitialState() {
        return {
            username: '',
            repos: []
        };
    },
    componentWillMount() {
        agent.get('username').end(res => {
            this.setState({
                username: res.text
            });
        });
        this.loadRepos(false);
    },
    loadRepos(force) {
        var url = 'repos';
        if (force) {
            url += '?force=true';
        }
        agent.get(url).end(res => {
            this.setState({
                repos: res.body
            });
        });
    },
    render() {
        return (
            <div>
                <Username name={this.state.username} />
                <View repos={this.state.repos} reload={this.loadRepos.bind(this, true)} />
            </div>
        );
    }
});
