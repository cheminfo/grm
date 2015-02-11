'use strict';

const Router = require('koa-router');

module.exports = function (app) {

    let router = new Router();

    router.get('/', function*() {
        yield this.render('index');
    });

    router.get('/repos', function*() {
        this.config.data.repos = yield this.github.getRepositories(true);
        this.config.save();
        this.body = 'repos reloaded';
    });

    app.use(router.middleware());

};
