'use strict';

const React = require('react');

const Org = require('./components/organization');

module.exports = React.createClass({
    render: function () {
        var repos = this.props.repos;
        var orgs = repos.map(function (org) {
            return <Org key={org.name} name={org.name} repos={org.repos} />;
        });
        return (
            <div>
                <h2>Hello {this.props.user.name} !</h2>
                <div>{orgs}</div>
            </div>
        );
    }
});
