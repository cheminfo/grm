'use strict';

const child_process = require('mz/child_process');
const fs = require('mz/fs');
const mkdirp = require('mkdirp-then');
const path = require('path');

const dataFolder = path.resolve(__dirname, '../../../data');

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

function initRepo() {
    var self = this;
    return fs.exists(path.join(self.repoDir, '.git')).then(function (exist) {
        if (!exist) {
            return mkdirp(self.repoDir).then(function () {
                return child_process
                    .execFile('git', ['init'], self.execOptions);
            });
        }
    });
}
Git.prototype.init = makeTask('init', initRepo, true);

function pullRepo() {
    var self = this;
    return this.init().then(function () {
        return child_process
            .execFile('git', ['pull', self.gitUrl], self.execOptions);
    });
}
Git.prototype.pull = makeTask('pull', pullRepo);

function doBuild() {
    var self = this;
    return this.pull().then(function () {
        return child_process.execFile('npm', ['update'], self.execOptions)
            .then(function () {
                return child_process
                    .execFile('npm', ['run', 'build'], self.execOptions);
            });
    });
}
Git.prototype.build = makeTask('build', doBuild);

Git.prototype.task = function (name, executor, onlyOnce) {
    var task = this.tasks[name];
    if (task) {
        if (task === true) {
            return Promise.resolve();
        } else {
            return task;
        }
    } else {
        var self = this;
        this.tasks[name] = executor.call(this).then(function (result) {
            self.tasks[name] = !!onlyOnce;
            return result;
        });
        return this.tasks[name];
    }
};

function makeTask(name, executor, onlyOnce) {
    return function () {
        return this.task(name, executor, onlyOnce);
    };
}

module.exports = Git;
