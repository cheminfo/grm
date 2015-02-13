'use strict';

const Router = require('koa-router');
const Git = require('./util/git');

module.exports = function (app) {

    let router = new Router();

    router.get('/user', function*() {
        if (!this.config.data.user) {
            let user = yield this.github.getUser();
            this.config.data.user = {
                name: user.login
            };
            this.config.save();
        }
        this.body = {
            name: this.config.data.user
        };
    });

    router.get('/repos', function*() {
        let user = yield this.github.getUser();
        let repos = yield this.github.getRepositories(!!this.query.force);
        this.config.data.user = {
            name: user.login
        };
        this.config.data.repos = repos;
        this.config.save();
        this.body = {
            user: this.config.data.user,
            repos: this.config.data.repos
        };
    });

    router.get('/repo/:org/:repo', function*() {
        let git = new Git(encodeURIComponent(this.params.org), encodeURIComponent(this.params.repo), this.token);
        try {
            yield git.build();
        } catch(e) {
            return this.body = `Impossible to pull ${this.params.org}/${this.params.repo}`;
        }
        this.body = 'OK';
    });

    app.use(router.middleware());

};
