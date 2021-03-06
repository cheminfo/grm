'use strict';

const fs = require('fs');
const path = require('path');

const config = require('./config');

const dbPath = path.join(config.dir.git, 'repositories.json');

let repositories;
let uptodate = false;

loadRepositories();

exports.getAll = function() {
  return repositories;
};

exports.isActive = function(owner, name) {
  var repo = repositories.find(findCallback(owner, name));
  return repo && repo.active;
};

exports.setActive = function(owner, name, state) {
  var repo = repositories.find(findCallback(owner, name));
  if (!repo) throw new Error(`repo not found: ${owner}/${name}`);
  if (repo.active !== state) {
    repo.active = state;
    uptodate = false;
  }
};

exports.addRepo = function(owner, name) {
  var index = repositories.findIndex(findCallback(owner, name));
  if (index === -1) {
    repositories.push({
      owner,
      name,
      active: false,
    });
    uptodate = false;
  }
};

exports.save = function() {
  if (!uptodate) {
    fs.writeFileSync(dbPath, JSON.stringify(repositories));
    uptodate = true;
  }
};

function findCallback(owner, name) {
  return (repo) => repo.owner === owner && repo.name === name;
}

function loadRepositories() {
  let data;
  try {
    data = fs.readFileSync(dbPath, 'utf8');
  } catch (e) {
    repositories = [];
    return;
  }
  repositories = JSON.parse(data);
  if (!Array.isArray(repositories)) {
    throw new Error('repositories.json must be an array');
  }
  sortRepositories();
  uptodate = true;
}

function sortRepositories() {
  repositories.sort(function(repoA, repoB) {
    var byOwner = repoA.owner.localeCompare(repoB.owner);
    if (byOwner === 0) {
      return repoA.name.localeCompare(repoB.name);
    } else {
      return byOwner;
    }
  });
}
