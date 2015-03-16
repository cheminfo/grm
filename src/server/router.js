'use strict';

const Router = require('koa-router');

const repoManager = require('./controllers/repo-manager');
const repoList = require('./controllers/repo-list');

module.exports = function (app) {

    let router = new Router();

    router.get('/username', function*() {
        let user = yield this.github.getUser();
        this.body = user.login;
    });

    router.get('/repos', repoList);

    router.get('/repo/:owner/:repo', repoManager);

    app.use(router.middleware());

};
