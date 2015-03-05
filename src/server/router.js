'use strict';

const Router = require('koa-router');

const repoManager = require('./controllers/repo-manager');
const mongo = require('./util/mongo');

module.exports = function (app) {

    let router = new Router();

    router.get('/username', function*() {
        var user = yield this.github.getUser();
        this.body = user.login;
    });

    router.get('/repos', function*() {
        var ghRepos = yield this.github.getRepositories();
        var mongoRepos = yield mongo.collection('repos').find();
        var repos = {};
        for (let i = 0; i < mongoRepos.length; i++) {
            let repo = mongoRepos[i];
            if (!repos[repo.owner]) repos[repo.owner] = [];
            repos[repo.owner].push({
                local: true,
                repo: repo
            });
        }
        loop1: for (let i = 0; i < ghRepos.length; i++) {
            let repo = ghRepos[i];
            let owner = repo.owner.login;
            if (!repos[owner]) repos[owner] = [];
            var arr = repos[owner];
            for (let j = 0; j < arr.length; j++) {
                if (arr[j].repo.name === repo.name) {
                    continue loop1;
                }
            }
            arr.push({
                local: false,
                repo: {
                    owner: owner,
                    name: repo.name
                }
            });
        }
        this.body = repos;
    });

    router.all('/repo/:owner/:repo', repoManager);

    app.use(router.middleware());

};
