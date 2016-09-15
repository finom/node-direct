const path = require('path');
const pathExists = require('path-exists');
const freshUp = require('fresh-up');

const {
    ext = '.srv.js',
    root = process.cwd(),
    standalone
} = require('minimist')(process.argv.slice(2));

module.exports = (req, res, next) => {
    let filePath;

    if (standalone) {
        const potentialIndexFile = path.resolve(root, `.${req.path}`, `./index${ext}`);

        if (req.path.endsWith(ext)) {
            filePath = path.resolve(root, `.${req.path}`);
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
        return res.status(500).send(`<pre>${e.stack}</pre>`);
    }

    freshUp(require.resolve(filePath));

    return undefined;
};
