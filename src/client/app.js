'use strict';

var $ = require('jquery');
var agent = require('superagent');

var $head = $('#head');
var $content = $('#content');

agent
    .get('/user')
    .end(function (res) {
        $head.html(res.body.name);
    });

agent
    .get('/repos')
    .end(function (res) {
        console.log(res.body);
    });
