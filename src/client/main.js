'use strict';

import React from 'react';
import agent from 'superagent';
import View from './view';

export default React.createClass({
    getInitialState() {
        return {
            loading: true,
            user: '',
            repos: []
        };
    },
    componentWillMount() {
        this.load();
    },
    load() {
        agent.get('/repos').end(this.gotRepos);
    },
    gotRepos(res) {
        let data = res.body;
        let repos = {};
        data.repos.forEach(function (repo) {
            let owner = repo.owner.login;
            if (!repos[owner]) repos[owner] = [];
            repos[owner].push(repo);
        });
        var orgs = [];
        for(var i in repos) {
            orgs.push({
                name: i,
                repos: repos[i]
            });
        }
        this.setState({
            loading: false,
            repos: orgs,
            user: data.user
        });
    },
    render() {
        if (this.state.loading) {
            return <div>loading...</div>;
        } else {
            return <View user={this.state.user} repos={this.state.repos} />;
        }
    }
});
