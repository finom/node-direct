#!/usr/bin/env node
const express = require('express');
const fileExists = require('file-exists');
const bodyParser = require('body-parser');
const fs = require('fs');
const { port = 8123 } = require('minimist')(process.argv.slice(2));

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('*', (req, res) => {
    const filePath = req.get('X-Requested-File-Path');

    if (!filePath) {
        return res.status(500).send('Server did not provide file path');
    }

    if (!fileExists(filePath)) {
        return res.status(500).send('Cannot find such file on the server');
    }

    try {
        require(filePath)(req, res); // eslint-disable-line global-require
    } catch (e) {
        return res.status(500).send(`<pre>${e.stack}</pre>`);
    }

    fs.watchFile(filePath, () => {
        delete require.cache[filePath];
        fs.unwatchFile(filePath);
    });

    return undefined;
});

app.listen(port, () => {
    console.log(`node-direct listening on port ${port}!`);
});
