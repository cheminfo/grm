'use strict';

const child_process = require('mz/child_process');
const fs = require('mz/fs');
const mkdirp = require('mkdirp-then');
const path = require('path');
const co = require('co');

const debug = require('debug')('grm:git');

const config = require('../../../config.json');
const dataFolder = path.resolve(config.dir.git);

function Git(org, repo, OAuthToken) {
    this.org = org;
    this.repo = repo;
    this.orgDir = path.join(dataFolder, this.org);
    this.repoDir = path.join(this.orgDir, this.repo);

    this.gitUrl =
        `https://${OAuthToken}:@github.com/${this.org}/${this.repo}.git`;
    // the ':' is important to specify an empty password. Otherwise we risk to
    // trigger a prompt if the repository doesn't exist.
    this.execOptions = {
        cwd: this.repoDir
    };

    this.tasks = {};
}

function*initRepo() {
    let exist = yield fs.exists(path.join(this.repoDir, '.git'));
    if (!exist) {
        debug(`Repo ${this.org}/${this.repo} does not exist, cloning`);
        yield mkdirp(this.orgDir);
        yield child_process.execFile('git', ['clone', this.gitUrl], {cwd: this.orgDir});
        debug('clone successful');
    }
}
Git.prototype.init = makeTask('init', initRepo, true);

function*pullRepo(reset) {
    yield this.init();
    debug('pulling from GitHub');
    if (reset) {
        yield child_process.execFile('git', ['reset', '--hard', 'origin/master'], this.execOptions);
    }
    yield child_process.execFile('git', ['pull'], this.execOptions);
}
Git.prototype.pull = makeTask('pull', pullRepo);

function*doBuild() {
    yield this.pull();
    debug('building project');
    yield child_process.execFile('npm', ['update'], this.execOptions);
    yield child_process.execFile('npm', ['run', 'build'], this.execOptions);
    debug('build finished, getting list of files');
    try {
        let buildDir = path.join(this.repoDir, 'dist');
        let buildFiles = yield fs.readdir(buildDir);
        return buildFiles.map(function (file) {
            return {
                name: file,
                path: path.join(buildDir, file)
            };
        });
    } catch (e) {
        return [];
    }
}
Git.prototype.build = makeTask('build', doBuild);

function*doPublish(files, message) {
    debug(`publishing : ${message}`);
    yield child_process.execFile('git', ['add'].concat(files), this.execOptions);
    yield child_process.execFile('git', ['commit', '-m', message], this.execOptions);
    yield child_process.execFile('git', ['push'], this.execOptions);
    debug('publish finished');
}
Git.prototype.publish = makeTask('publish', doPublish);

function*doNpmPublish() {
    try {
        debug('getting npm authors');
        var authors = yield child_process.execFile('npm', ['author', 'ls'], this.execOptions);
        var isAdmin = authors[0].includes('cheminfo-bot');
        if (isAdmin) {
            debug(`publishing on NPM`);
            yield child_process.execFile('npm', ['publish'], this.execOptions);
        } else {
            debug('cheminfo-bot is not an admin')
        }
    } catch (e) {
        throw new Error('NPM publish failed');
    }
}
Git.prototype.npmPublish = makeTask('npmPublish', doNpmPublish);

function*doReadPkg() {
    yield this.pull(true);
    debug('reading package files');
    let result = {
        node: null,
        bower: null
    };
    let packageNode = path.join(this.repoDir, 'package.json');
    if (yield fs.exists(packageNode)) {
        result.node = JSON.parse(yield fs.readFile(packageNode, 'utf-8'));
        debug('found package.json');
    }
    let packageBower = path.join(this.repoDir, 'bower.json');
    if (yield fs.exists(packageBower)) {
        result.bower = JSON.parse(yield fs.readFile(packageBower, 'utf-8'));
        debug('found bower.json');
    }
    return result;
}
Git.prototype.readPkg = makeTask('readPkg', doReadPkg);

function*doWritePkg(pkg) {
    debug('writing package files');
    if (pkg.node) {
        yield fs.writeFile(path.join(this.repoDir, 'package.json'), JSON.stringify(pkg.node, null, '  '));
    }
    if (pkg.bower) {
        yield fs.writeFile(path.join(this.repoDir, 'bower.json'), JSON.stringify(pkg.bower, null, '  '));
    }
}
Git.prototype.writePkg = makeTask('writePkg', doWritePkg);

Git.prototype.task = function (name, executor, onlyOnce, args) {
    let task = this.tasks[name];
    if (task) {
        if (task === true) {
            return Promise.resolve();
        } else {
            return task;
        }
    } else {
        let self = this;
        this.tasks[name] = executor.apply(this, args).then(function (result) {
            self.tasks[name] = !!onlyOnce;
            return result;
        }, function (e) {
            self.tasks[name] = false;
            throw e;
        });
        return this.tasks[name];
    }
};

function makeTask(name, executor, onlyOnce) {
    executor = co.wrap(executor);
    return function () {
        return this.task(name, executor, onlyOnce, arguments);
    };
}

module.exports = Git;
