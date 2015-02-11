'use strict';

const Octokat = require('octokat');

module.exports = function (OAuthToken) {
    return new EnhancedOctokat({
        token: OAuthToken,
        acceptHeader: 'application/vnd.github.moondragon+json'
    });
};

function EnhancedOctokat(options) {
    this.octokat = new Octokat(options);
    this.repositories = null;
    this.user = null;
}

EnhancedOctokat.prototype.getRepositories = function (force) {
    if (this.repositories && !force) {
        return Promise.resolve(this.repositories);
    }
    let repos = [];
    let self = this;
    return this.octokat.user.repos.fetch().then(continueFetch);
    function continueFetch (currentResult) {
        repos = repos.concat(currentResult);
        if (currentResult.nextPage) {
            return currentResult.nextPage().then(continueFetch);
        } else {
            self.repositories = repos;
            return repos;
        }
    }
};

EnhancedOctokat.prototype.getUser = function () {
    if (this.user) {
        return Promise.resolve(this.user);
    }
    let self = this;
    return this.octokat.user.fetch().then(function (user) {
        self.user = user;
        return user;
    });
};
