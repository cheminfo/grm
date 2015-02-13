'use strict';

const React = require('react');
const agent = require('superagent');

const View = require('./view');

module.exports = React.createClass({
    getInitialState: function () {
        return {
            loading: true,
            user: '',
            repos: []
        };
    },
    componentWillMount: function () {
        this.load();
    },
    load: function () {
        agent.get('/repos').end(this.gotRepos);
    },
    gotRepos: function (res) {
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
    render: function () {
        if (this.state.loading) {
            return <div>loading...</div>;
        } else {
            return <View user={this.state.user} repos={this.state.repos} />;
        }
    }
});
