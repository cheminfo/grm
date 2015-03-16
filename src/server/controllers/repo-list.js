'use strict';

const mongo = require('../util/mongo');

const fields = {
    _id: 0,
    owner: 1,
    name: 1,
    active: 1
};

module.exports = function*() {
    let allRepos =  yield mongo.collection('repos').find().fields(fields);
    if (allRepos.length === 0 || this.query.force) {
        let githubRepos = yield this.github.getRepositories(true);
        allRepos = yield updateMongo(githubRepos);
    }
    this.body = allRepos;
};

function*updateMongo(repos) {
    let coll = mongo.collection('repos');
    let results = new Array(repos.length);
    for (let i = 0; i < repos.length; i++) {
        let repo = repos[i];
        let owner = repo.owner.login;
        let name = repo.name;
        let result = yield coll.findOne({
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
