'use strict';

const serve = require('koa-static');
const swig = require('koa-swig-render');
const mount = require('koa-mount');
const debug = require('debug')('grm:init');

const github = require('./util/github-api');
const dynamicConfig = require('./util/dynamic-config');
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

    app.use(dynamicConfig());

    app.use(function*(next) {
        if (!this.config.data.user) {
            var user = yield this.github.getUser();
            this.config.data.user = user.login;
            this.config.save();
        }
        yield next;
    });

    router(app);

};
