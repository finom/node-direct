const express = require('express');
const { port = 8123 } = require('minimist')(process.argv.slice(2));
const fileExists = require('file-exists');

const app = express();

app.get('*', function(req, res) {
    const filePath = req.get('X-Requested-File-Path');

    if(!filePath) {
        return res.status(500).send('Server did not provide file path');
    }

    if(!fileExists(filePath)) {
        return res.status(500).send('Cannot find such file on the server');
    }

    try {
        require(filePath)(req, res);
    } catch (e) {
        return res.status(500).send(`<pre>${e.stack}</pre>`);
    }
});

app.listen(port, () => {
    console.log(`node-direct listening on port ${port}!`);
});
