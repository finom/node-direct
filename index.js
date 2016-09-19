#!/usr/bin/env node
'use strict';

var cluster = require('cluster');

if (cluster.isMaster) {
    cluster.fork();
    cluster.on('exit', function () {
        console.log('node-direct is crashed. Restarting...');
        cluster.fork();
    });
}

if (cluster.isWorker) {
    (function () {
        var express = require('express');
        var bodyParser = require('body-parser');

        var _require = require('minimist')(process.argv.slice(2));

        var _require$port = _require.port;
        var port = _require$port === undefined ? 8123 : _require$port;
        var _require$root = _require.root;
        var root = _require$root === undefined ? process.cwd() : _require$root;
        var standalone = _require.standalone;

        var middleware = require('./middleware');

        var app = express();

        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());
        app.use(middleware);

        if (standalone) {
            app.use(express.static(root));
        }

        app.listen(port, function () {
            console.log('node-direct listening on port ' + port + '!');
        });
    })();
}