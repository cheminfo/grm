'use strict';

const semver = require('semver');
const cp = require('mz/child_process');
const fs = require('mz/fs');
const debug = require('debug')('grm:repo');
const path = require('path');
const mkdirp = require('mkdirp-then');

const config = require('../config');
const db = require('../db');
const Git = require('../util/git');

const cdnDir = config.dir.cdn;

const gitCache = {};

/* /repo/:owner/:repo */
module.exports = function*() {
  let owner = (this.state.owner = this.params.owner);
  let repo = (this.state.repo = this.params.repo);
  this.state.fullName = `${owner}/${repo}`;

  let action = this.query.action;
  if (!action) {
    this.status = 400;
    return (this.body = 'Action required');
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
    case 'head':
      this.body = yield buildHead.call(this);
      break;
    default:
      this.status = 400;
      this.body = 'Unknown action: ' + action;
  }
};

function* getStatus(forceDetails) {
  const active = db.isActive(this.state.owner, this.state.repo);
  let status = {
    owner: this.state.owner,
    name: this.state.repo,
    active: active,
  };
  if (active && (this.query.details || forceDetails)) {
    let git = getGit.call(this);
    let pkg = yield git.readPkg();
    status.version = pkg.node.version;
    status.npm = pkg.node.name;
    status.desc = pkg.node.description;
  }
  return status;
}

function* enable() {
  let status = yield getStatus.call(this);
  if (!status.active) {
    // make sure that the repo is cloned
    let git = getGit.call(this);
    let pkg = yield git.readPkg();
    if (!pkg.node) {
      this.throw('No node version number');
    }
    status.version = pkg.node.version;
    status.npm = pkg.node.name;
    status.desc = pkg.node.description;
  }
  // invert the status
  status.active = !status.active;
  debug(
    `switching repo ${this.state.owner}/${this.state.repo} : ${status.active}`,
  );
  db.setActive(this.state.owner, this.state.repo, status.active);
  db.save();
  return status;
}

function* publish() {
  debug('start publishing');
  try {
    let git = getGit.call(this);
    if (!this.query.bump) {
      this.status = 400;
      return 'Bump info is needed';
    }
    // Get current version number
    let pkg = yield git.readPkg();
    let toAdd = ['package.json'];
    if (!pkg.node) {
      this.status = 500;
      return 'No package.json';
    }

    let currentVersion = semver(pkg.node.version);
    // Bumping version
    currentVersion.inc(this.query.bump);
    let version = currentVersion.version;

    pkg.node.version = version;
    if (pkg.bower) {
      pkg.bower.version = version;
      toAdd.push('bower.json');
    }

    yield git.writePkg(pkg);

    let buildFiles = yield git.build();
    if (yield git.writePkgLock(version)) {
      toAdd.push('package-lock.json');
    }

    var distTracked = yield isDistTracked(git.repoDir);
    if (pkg.bower || distTracked) {
      try {
        yield fs.stat(path.join(git.repoDir, 'dist'));
        toAdd.push('dist/*');
      } catch (e) {
        debug('dist does not exist, not adding it');
      }
    }

    let releaseMessage = `Release v${version}`;
    yield git.publish(toAdd, releaseMessage);

    const commitID = yield git.getCurrentHEAD();

    debug('creating release');
    let repo = this.github.getRepo(this.state.owner, this.state.repo);
    let releaseInfo = yield repo.releases.create({
      tag_name: `v${version}`,
      target_commitish: commitID,
      name: `v${version}`,
      body: releaseMessage,
      draft: false,
      prerelease: this.query.bump.startsWith('pre'),
    });

    if (!buildFiles.length) {
      return yield getStatus.call(this, true);
    }
    let cdnDir2 = path.join(cdnDir, pkg.node.name, version);
    yield mkdirp(cdnDir2);

    debug(`uploading ${buildFiles.length} files:`, buildFiles);
    for (let i = 0; i < buildFiles.length; i++) {
      let name = buildFiles[i].name;
      debug(`uploading file ${i} with name ${name}`);
      let file = yield fs.readFile(buildFiles[i].path);
      try {
        yield releaseInfo.upload(name, 'application/javascript', file);
      } catch (e) {
        console.error(e.json);
        console.error(`could not send ${name}`);
      }
      yield fs.writeFile(path.join(cdnDir2, name), file);
    }
    return yield getStatus.call(this, true);
  } catch (e) {
    console.error('publish error', e.stack);
    this.status = 500;
    return e.stack;
  }
}

function* npmPublish() {
  debug('start npm publish');
  try {
    let git = getGit.call(this);
    yield git.npmPublish();
    return 'OK';
  } catch (e) {
    console.error('publish error', e.stack);
    this.status = 500;
    return e.stack;
  }
}

function* buildHead() {
  debug('building head');
  try {
    let git = getGit.call(this);

    let pkg = yield git.readPkg();
    if (!pkg.node) {
      this.status = 500;
      return 'No package.json';
    }

    let buildFiles = yield git.build();
    if (!buildFiles.length) {
      return 'OK';
    }

    let cdnDir2 = path.join(cdnDir, pkg.node.name, 'HEAD');
    yield mkdirp(cdnDir2);
    for (let i = 0; i < buildFiles.length; i++) {
      let name = buildFiles[i].name;
      let file = yield fs.readFile(buildFiles[i].path);
      yield fs.writeFile(path.join(cdnDir2, name), file);
    }
    return 'OK';
  } catch (e) {
    console.error('publish error', e.stack);
    this.status = 500;
    return e.stack;
  }
}

function getGit() {
  return (
    gitCache[this.state.fullName] ||
    (gitCache[this.state.fullName] = new Git(
      encodeURIComponent(this.state.owner),
      encodeURIComponent(this.state.repo),
      this.token,
    ))
  );
}

function* isDistTracked(repoDir) {
  let result = yield cp.execFile('git', ['status', 'dist', '--porcelain'], {
    cwd: repoDir,
  });
  result = result.toString();
  if (!result.includes('dist')) return false; // dist may be in .gitignore
  if (result.includes('?? dist/\n')) return false; // dist is completely untracked
  return true;
}
