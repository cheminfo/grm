'use strict';

const serve = require('koa-static');
const send = require('koa-send');
const mount = require('koa-mount');
const debug = require('debug')('grm:init');
const path = require('path');
const DB = require('mongodb-next');

const mongo = require('./util/mongo');
const github = require('./util/github-api');
const router = require('./router');

const index = path.resolve(__dirname, '../client/index.html');

module.exports = function (app, config) {
    var db = config.mongodb;
    var mongodb = DB(`mongodb://${db.host}:${db.port}/${db.db}`);
    mongo.setDB(mongodb);

    var gh = github(config.oauth);

    debug('connecting to MongoDB');

    return mongodb.connect.then(loadInfo).then(installMiddleware);

    function loadInfo() {
        debug('loading info from GitHub');
        return gh.getUser().then(function () {
            return gh.getRepositories();
        });
    }

    function installMiddleware() {
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
        app.context.github = gh;

        router(app);
    }
};
