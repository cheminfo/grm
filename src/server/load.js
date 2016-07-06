'use strict';

const serve = require('koa-static');
const send = require('koa-send');
const mount = require('koa-mount');
const debug = require('debug')('grm:init');
const path = require('path');

const config = require('config');
const github = require('./util/github-api');
const router = require('./router');

module.exports = function (app) {
    const gh = github(config.oauth);

    debug('installing middlewares');

    app.use(function*(next) {
        if (this.path === '/') {
            yield send(this, 'index.html', {root: __dirname + '/../client'});
        } else {
            yield next;
        }
    });

    app.use(mount('/assets',
        serve(path.resolve(__dirname, '../client/assets'))
    ));

    app.context.token = config.oauth;
    app.context.github = gh;

    router(app);
};
