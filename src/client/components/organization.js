'use strict';

var React = require('react');

var Repo = require('./repository');

module.exports = React.createClass({
    render: function () {
        var repos = this.props.repos.map(function (repo) {
            return <Repo key={repo.fullName} data={repo} />;
        });
        return <div>
            <h3>{this.props.name}</h3>
            <div>{repos}</div>
        </div>;
    }
});
