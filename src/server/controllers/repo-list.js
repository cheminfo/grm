'use strict';

const db = require('../db');

module.exports = function*() {
  let allRepos = db.getAll();
  if (allRepos.length === 0 || this.query.force) {
    let githubRepos = yield this.github.getRepositories(true);
    allRepos = yield updateDb(githubRepos);
  }
  this.body = allRepos;
};

function* updateDb(repos) {
  for (let i = 0; i < repos.length; i++) {
    let repo = repos[i];
    let owner = repo.owner.login;
    let name = repo.name;
    db.addRepo(owner, name);
  }
  db.save();
  return db.getAll();
}
