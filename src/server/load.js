'use strict';

const serve = require('koa-static');
const send = require('koa-send');
const mount = require('koa-mount');
const debug = require('debug')('grm:init');
const path = require('path');

const github = require('./util/github-api');
const dynamicConfig = require('./util/dynamic-config');
const router = require('./router');

const index = path.resolve(__dirname, '../client/index.html');

module.exports = function (app, config) {

    debug('installing middlewares');

    app.use(function*(next) {
        if (this.path === '/') {
            yield send(this, index);
        } else {
            yield next;
        }
    });

    app.use(mount('/assets',
        serve(path.resolve(__dirname, '../client/assets'))
    ));

    app.context.token = config.oauth;
    app.context.github = github(config.oauth);

    app.use(dynamicConfig());

    router(app);

};
