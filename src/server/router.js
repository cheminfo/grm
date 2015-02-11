'use strict';

const Router = require('koa-router');

module.exports = function (app) {

    let router = new Router();

    router.get('/user', function*() {
        if (!this.config.data.user) {
            let user = yield this.github.getUser();
            this.config.data.user = {
                name: user.login,

            };
            this.config.save();
        }
        this.body = {
            name: this.config.data.user
        };
    });

    router.get('/repos', function*() {
        this.config.data.repos = yield this.github.getRepositories(!!this.query.force);
        this.config.save();
        this.body = this.config.data.repos;
    });

    app.use(router.middleware());

};
