# node-direct [![npm version](https://badge.fury.io/js/node-direct.svg)](https://badge.fury.io/js/node-direct) [![Join the chat at https://gitter.im/node-direct-chat/Lobby](https://badges.gitter.im/node-direct-chat/Lobby.svg)](https://gitter.im/node-direct-chat/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

> Run server-side JavaScript files directly

If your VPS contains a lot of applications and you don't want to set up NodeJS server for every application, you're in the right place. **node-direct** allows to run JavaScript on a server just like **.php** files are run. The tool initializes one NodeJS instance per many websites and executes JavaScript files when URLs like **example.com/foo/bar.srv.js** are requested. **.srv.js** extension is configurable.

You know how to set up and run PHP script. You just need to upload it and run like this: *example.com/foo.php*. But what about NodeJS? You must define routes, run every app on its own port, se up deployment, make sure that all instances work after server reload... It's OK if you do a big application but when you have only small server-side utilities (like ajax proxy) they just wasting your time.

Install:
```sh
npm install -g node-direct
```

## Nginx configuration

All the magic mostly happens on Nginx side (the project itself is extremely small). You'll need to configure it to handle requests to **.srv.js** files.

```nginx
location ~ \.srv\.js$ {
    root <path_to_website_files>;
    proxy_pass http://localhost:<port>;
    proxy_set_header X-Requested-File-Path $document_root$uri;
}
```

- ``path_to_website_files`` - where static files are located.
- ``port`` - a port of node-direct server

Example:
```nginx
server {
    listen 80;

    server_name example.com;

    # Serve static files
    location / {
        root /var/web/example.com/public;
        index index.srv.js index.html index.htm;
    }

    location ~ \.srv\.js$ {
        root /var/web/example.com/public;
        proxy_pass http://localhost:8123;
        proxy_set_header X-Requested-File-Path $document_root$uri;
    }
}
```

## Usage

```sh
node-direct --port=8000
```

**node-direct** is powered by [Express](http://expressjs.com/). Every **.srv.js** file should export a function which accepts ``request`` and ``responce`` objects created by Express.

Hello world:
```js
module.exports = function(req, res) {
    const someModule = require('some-module');
    res.send('Hello world!');
}
```

JSON API:
```js
module.exports = function(req, res) {
    if(req.method === 'POST') {
        req.json({
            message: 'Everything is awesome'
        });
    } else {
        req.status(400).json({
            message: 'Only POST requests are allowed'
        });
    }
}
```

HTML rendering:
```js
const fs = require('fs');
const ejs = require('ejs');
const template = ejs.compile(fs.readFileSync('./templates/index.html'));

module.exports = function(req, res) {
    res.type('html').send(template({ foo: 'bar' }));
}
```

Check out Express documentation for more info.

You can use local **package.json** and require any modules by **.srv.js** files placed at **node_modules** as you usually do. There is an example of potential file structure of an app.
```
/package.json - a package file with dependencies and devDependencies for this specific application
/index.html - main HTML file
/js/app.js - client-side JavaScript app
/css/style.css - styles
/node_modules/ - things installed by "npm install"
/foo/index.srv.js - some JSON API which allows to make requests to /foo/
/bar/index.srv.js - some dynamic HTML page returned when /bar/ is requested
```

### Flags
#### Common
- ``--port`` - a port of node-direct server (8123 by default)

#### Standalone mode
The standalone mode creates static HTTP server which doesn't require Nginx for its work. It should be used for development purposes on your local machine.
- ``--standalone`` - turns on standalone mode
- ``--root`` - a root of static files (``process.cwd()`` by default)
- ``--ext`` - an extension of runnable JS files (**.srv.js** by default)

```sh
node-direct --port=8000 --standalone --root=./foo/bar --ext=.serverside.js
```


## Running node-direct on startup (Linux)

You can add cron job to run the server on startup. To modify crontab run ``crontab -e``. Add the job to the end of the crontab file:

```
@reboot <path_to_node> <path_to_installed_module> [<flags>]
```

- ``path_to_node`` - absolute path to NodeJS binary (run ``which node`` to get the path)
- ``path_to_installed_module`` - absolute path to installed node-direct (there is no direct way to get it)
- ``flags`` - flags you want to use

Example:
```
@reboot /usr/local/bin/node /usr/local/lib/node_modules/node-direct/index.js --port=8123
```

(if you have examples how to set up startup script for another OS, feel free to make PR)

## Troubleshooting

### Automatic module reload

As you know NodeJS caches values returned by ``require`` function. When you call ``require('foo')`` twice or more it returns the same object. **node-direct** updates cache when **.srv.js** file is replaced (eg. you upload another version of such file) and you don't have to reload **node-direct** every time when the file is changed. A problem can appear there when you require other modules by **.srv.js** files.
```js
// foo.srv.js
module.exports = function(req, res) {
    const bar = require('./bar');
    // ...
}
```

When you change **foo.srv.js** it is reloaded as expected but when you change **./bar** its value returned by ``require`` remains the same. The tool could hot-reload all requested modules but this would make side-effects which may cause unpredictable behavior in other modules. To handle this issue and update module cache you need to define watcher and clear cache when the ``require``'d file is changed.

In example below you do want to hot reload **./bar** when it's changed but you don't want to update **./baz** on its change.

```js
// foo.srv.js

// for more modules you'll need to use a loop
const fs = require('fs');
const barPath = require.resolve('./bar');
const watcher = fs.watch(barPath, (eventType) => {
    if (eventType === 'change') {
        delete require.cache[barPath];
        watcher.close();
    }
});

module.exports = function(req, res) {
    const bar = require('./bar');
    const baz = require('./baz');
    // ...
}
```

If it looks too tricky check out [fresh-up](https://github.com/finom/fresh-up).

```js
// foo.srv.js

// for more modules you'll need to use a loop
const freshUp = require('fresh-up');
freshUp(require.resolve('./bar');

module.exports = function(req, res) {
    const bar = require('./bar');
    const baz = require('./baz');
    // ...
}
```


### Potential vulnerability: ``X-Requested-File-Path`` header

As you may notice, Nginx config described above passes requested file path as ``X-Requested-File-Path`` HTTP header. A hacker can use this header to run custom JavaScript files on your server. The server needs to contain some dangerous JavaScript file and the hacker needs to know its path relative to root. If you want to fix this potential vulnerability you'll need to deny an access to a port used by node-direct with firewall.  

This is how it can be made on Linux:
```
sudo ufw deny 8123
```
