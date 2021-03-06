'use strict';

const mkdirp = require('mkdirp');
const path = require('path');

const config = require('../../config.json');

if (!config.oauth) throw new Error('config.oauth is missing');
if (!config.dir || !config.dir.cdn || !config.dir.git)
  throw new Error('config.dir.cdn and config.dir.git are mandatory');

config.dir.cdn = path.resolve(config.dir.cdn);
config.dir.git = path.resolve(config.dir.git);

mkdirp.sync(config.dir.cdn);
mkdirp.sync(config.dir.git);

module.exports = config;
