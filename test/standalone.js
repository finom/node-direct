const { spawn } = require('child_process');
const expect = require('expect.js');
const request = require('request');

const port = 8099;
const direct = spawn('node', ['../src', '--port', port, '--standalone'], {
    cwd: __dirname
});

console.log(`Standalone mode test is started on port ${port}...`);

direct.stdout.on('data', (data) => {
    let reqCount = 0;

    console.log(`stdout: ${data}`);

    request(`http://localhost:${port}/srv/foo.srv.js`, (error, response, body) => {
        expect(error).to.be(null);
        expect(response.statusCode).to.be(200);
        expect(body).to.be('foo');

        reqCount += 1;
    });

    request(`http://localhost:${port}/srv/bar`, (error, response, body) => {
        expect(error).to.be(null);
        expect(response.statusCode).to.be(200);
        expect(body).to.be('bar');

        reqCount += 1;
    });

    request(`http://localhost:${port}/srv/baz.html`, (error, response, body) => {
        expect(error).to.be(null);
        expect(response.statusCode).to.be(200);
        expect(body.trim()).to.be('baz');

        reqCount += 1;
    });

    setTimeout(() => {
        expect(reqCount).to.be(3);
        direct.kill();
    }, 500);
});

direct.stderr.on('data', (data) => {
    throw Error(data);
});

direct.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});
