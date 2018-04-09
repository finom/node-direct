#!/usr/bin/env node
const cluster = require('cluster');

if (cluster.isMaster) {
    cluster.fork();
    cluster.on('exit', () => {
        console.log('node-direct is crashed. Restarting...');
        cluster.fork();
    });
}

if (cluster.isWorker) {
    const express = require('express');
    const bodyParser = require('body-parser');
    const {
        port = 8123,
        root = process.cwd(),
        standalone
    } = require('minimist')(process.argv.slice(2));
    const middleware = require('./middleware');

    const app = express();

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(middleware);

    if (standalone) {
        app.use(express.static(root));
    }

    app.listen(port, () => {
        console.log(`node-direct listening on port ${port}!`);
    });
}
