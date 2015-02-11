'use strict';

const serve = require('koa-static');
const swig = require('koa-swig-render');
const mount = require('koa-mount');
const debug = require('debug')('grm:init');

const github = require('./util/github-api');
const router = require('./router');

module.exports = function (app, config) {

    debug('installing middlewares');

    app.use(mount('/public', serve(__dirname + '/public')));

    app.use(swig({
        root: __dirname + '/views',
        autoescape: true,
        cache: false,
        ext: 'html'
    }));

    app.context.github = github(config.oauth);

    app.use(function*(next) {
        this.state.user = yield this.github.getUser();
        yield next;
    });

    router(app);

};
