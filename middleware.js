'use strict';

var path = require('path');
var pathExists = require('path-exists');
var freshUp = require('fresh-up');

var _require = require('minimist')(process.argv.slice(2));

var _require$ext = _require.ext;
var ext = _require$ext === undefined ? '.srv.js' : _require$ext;
var _require$root = _require.root;
var root = _require$root === undefined ? process.cwd() : _require$root;
var standalone = _require.standalone;


module.exports = function (req, res, next) {
    var filePath = void 0;

    if (standalone) {
        var potentialIndexFile = path.resolve(root, '.' + req.path, './index' + ext);

        if (req.path.endsWith(ext)) {
            filePath = path.resolve(root, '.' + req.path);
        } else if (pathExists.sync(potentialIndexFile)) {
            filePath = potentialIndexFile;
        } else {
            return next();
        }
    } else {
        filePath = req.get('X-Requested-File-Path');

        if (!filePath) {
            return res.status(500).send('Server did not provide file path via X-Requested-File-Path header');
        }
    }

    if (!pathExists.sync(filePath)) {
        return res.status(404).send('Cannot find such file on the server');
    }

    try {
        require(filePath)(req, res);
    } catch (e) {
        return res.status(500).send('<pre>' + e.stack + '</pre>');
    }

    freshUp(require.resolve(filePath));

    return undefined;
};