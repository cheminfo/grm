'use strict';

const semver = require('semver');
const fs = require('mz/fs');
const agent = require('superagent');
const debug = require('debug')('grm:repo');
const path = require('path');
const mkdirp = require('mkdirp-then');

const config = require('../../../config.json');
const cdnDir = path.resolve(config.dir.cdn);

const Git = require('../util/git');
const mongo = require('../util/mongo');

var gitCache = {};

// /repo/:owner/:repo
module.exports = function*() {
    var owner = this.state.owner = this.params.owner;
    var repo = this.state.repo = this.params.repo;
    this.state.fullName = `${owner}/${repo}`;

    this.state.mongoRepo = mongo.collection('repos');

    var action = this.query.action;
    if (!action) {
        this.status = 400;
        return this.body = 'Action required';
    }
    switch (action) {
        case 'status':
            this.body = yield getStatus.call(this);
            break;
        case 'enable':
            this.body = yield enable.call(this);
            break;
        case 'publish':
            this.body = yield publish.call(this);
            break;
        case 'npm':
            this.body = yield npmPublish.call(this);
            break;
        default:
            this.status = 400;
            this.body = 'Unknown action: ' + action;
    }

};

function*getStatus() {
    var status = yield this.state.mongoRepo.findOne({
        owner: this.state.owner,
        name: this.state.repo
    });
    if (status.active) {
        var git = getGit.call(this);
        var pkg = yield git.readPkg();
        status.version = pkg.node.version;
    }
    return status;
}

function*enable() {
    var status = yield getStatus.call(this);
    if (!status.active) {
        // make sure that the repo is cloned
        var git = getGit.call(this);
        var pkg = yield git.readPkg();
        if (!pkg.node) {
            this.throw('No node version number');
        }
        status.version = pkg.node.version;
    }
    // invert the status
    status.active = !status.active;
    debug(`switching repo ${this.state.owner}/${this.state.repo} : ${status.active}`);
    yield this.state.mongoRepo.findOne({
        owner: this.state.owner,
        name: this.state.repo
    }).set('active', status.active);
    return status;
}

function*publish() {
    debug('start publishing');
    var git = getGit.call(this);
    if (!this.query.bump) {
        this.status = 400;
        return 'Bump info is needed';
    }
    // Get current version number
    var pkg = yield git.readPkg();
    var toAdd = ['package.json'];
    if (!pkg.node) {
        this.status = 500;
        return 'No package.json';
    }

    var currentVersion = semver(pkg.node.version);
    // Bumping version
    currentVersion.inc(this.query.bump);
    var version = currentVersion.version;

    pkg.node.version = version;
    if (pkg.bower) {
        pkg.bower.version = version;
        toAdd.push('bower.json');
    }

    yield git.writePkg(pkg);
    var buildFiles = yield git.build();

    toAdd.push('dist/*');

    var releaseMessage = `Release v${version}`;
    yield git.publish(toAdd, releaseMessage);

    // TODO add support for npm-publish
    // need to check if the name is not taken
    //yield git.npmPublish();

    var repo = this.github.getRepo(this.state.owner, this.state.repo);
    debug('creating release');
    var releaseInfo = yield repo.releases.create({
        tag_name: `v${version}`,
        name: releaseMessage,
        prerelease: this.query.bump.startsWith('pre')
    });

    var uploadURL = releaseInfo.upload.url;
    var cdnDir2 = path.join(cdnDir, pkg.node.name, version);
    yield mkdirp(cdnDir2);

    debug(`uploading ${buildFiles.length} files:`, buildFiles);
    for (var i = 0; i < buildFiles.length; i++) {
        var name = buildFiles[i].name;
        debug(`uploading file ${i} with name ${name}`);
        var file = yield fs.readFile(buildFiles[i].path);
        try {
            yield releaseInfo.upload(name, 'application/javascript', file);
        } catch (e) {
            console.error(e.json);
            console.error(`could not send ${name}`);
        }
        yield fs.writeFile(path.join(cdnDir2, name), file);
    }
    return yield getStatus.call(this);
}

function*npmPublish() {
    debug('start npm publish');
    var git = getGit.call(this);
    yield git.npmPublish();
}

function getGit() {
    return gitCache[this.state.fullName] || (gitCache[this.state.fullName] = new Git(encodeURIComponent(this.state.owner), encodeURIComponent(this.state.repo), this.token));
}
