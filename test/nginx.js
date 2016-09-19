const { spawn } = require('child_process');
const expect = require('expect.js');
const request = require('request');
const path = require('path');

const port = 8098;
const direct = spawn('node', ['../src', '--port', port], {
    cwd: __dirname
});

console.log(`nginx mode test is started on port ${port}...`);

direct.stdout.on('data', (data) => {
    let reqCount = 0;

    console.log(`stdout: ${data}`);

    request({
        url: `http://localhost:${port}/foobarbaz`,
        headers: {
            'X-Requested-File-Path': path.resolve(__dirname, 'srv/foo.srv.js')
        }
    }, (error, response, body) => {
        expect(error).to.be(null);
        expect(response.statusCode).to.be(200);
        expect(body).to.be('foo');

        reqCount += 1;
    });

    setTimeout(() => {
        expect(reqCount).to.be(1);
        direct.kill();
    }, 500);
});

direct.stderr.on('data', (data) => {
    throw Error(data);
});

direct.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});
