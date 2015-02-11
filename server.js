'use strict';

const Promise = require('bluebird');
global.Promise = Promise;

const http = require('http');
const https = require('https');
const fs = require('fs');
const debug = require('debug')('grm:init');

const koa = require('koa');

const config = require('./config.json');

const app = koa();

debug('configuring app');

require('./src/server/load')(app, config);

const httpServer = http.createServer(app.callback());
const httpPort = config.port || 3000;
httpServer.listen(httpPort, function () {
    debug(`app listening on HTTP port ${httpPort}`);
});

if (config.ssl) {
    const httpsServer = https.createServer({
        key: fs.readFileSync(config.ssl.key),
        cert: fs.readFileSync(config.ssl.cert)
    }, app.callback());
    const httpsPort = config.ssl.port || 3001;
    httpsServer.listen(httpsPort, function () {
        debug(`app listening on HTTPS port ${httpsPort}`);
    });
}
