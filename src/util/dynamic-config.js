'use strict';

const fs = require('mz/fs');
const path = require('path');
const dataFolder = path.resolve(__dirname, '../../data');
const configFile = path.join(dataFolder, 'config.json');

module.exports = function () {
    return function*(next) {
        if (!this.config) {
            this.config = new Config();
            if (!(yield fs.exists(dataFolder))) {
                yield fs.mkdir(dataFolder);
            }
            if (yield fs.exists(configFile)) {
                var data = yield fs.readFile(configFile, 'utf-8');
                this.config.data = JSON.parse(data);
            } else {
                yield this.config.save();
            }
            this.app.context.config = this.config;
        }
        this.state.data = this.config.data;
        yield next;
    };
};

function Config() {
    this.data = {
        repos: [],
        watched: [],
        user: ''
    };
}

Config.prototype.save = function () {
    return fs.writeFile(configFile, JSON.stringify(this.data));
};
