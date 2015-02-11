'use strict';

const Router = require('koa-router');

module.exports = function (app) {

    let router = new Router();

    router.get('/', function*() {
        this.state.repos = yield this.github.getRepositories();
        yield this.render('index');
    });

    app.use(router.middleware());

};
