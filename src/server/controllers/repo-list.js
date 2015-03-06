'use strict';

const mongo = require('../util/mongo');

const fields = {
    _id: 0,
    owner: 1,
    name: 1,
    active: 1
};

module.exports = function*() {
    var allRepos =  yield mongo.collection('repos').find().fields(fields);
    if (allRepos.length === 0 || this.query.force) {
        var githubRepos = yield this.github.getRepositories(true);
        allRepos = yield updateMongo(githubRepos);
    }
    this.body = allRepos;
};

function*updateMongo(repos) {
    var coll = mongo.collection('repos');
    var results = new Array(repos.length);
    for (var i = 0; i < repos.length; i++) {
        var repo = repos[i];
        var owner = repo.owner.login;
        var name = repo.name;
        var result = yield coll.findOne({
            owner: owner,
            name: name
        }).fields(fields);
        if (!result) {
            result = {
                owner: owner,
                name: name,
                active: false
            };
            yield coll.insert(result);
        }
        results[i] = result;
    }
    return results;
}
