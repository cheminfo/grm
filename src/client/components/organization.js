'use strict';

import React from 'react';
import Repo from './repository';

export default React.createClass({
    render() {
        var repos = this.props.repos.map(function (repo) {
            return <Repo key={repo.fullName} data={repo} />;
        });
        return <div>
            <h3>{this.props.name}</h3>
            <div>{repos}</div>
        </div>;
    }
});
