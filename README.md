# node-direct [![npm version](https://badge.fury.io/js/node-direct.svg)](https://badge.fury.io/js/node-direct)

> A tool which allows to run server-side JavaScript files directly

If your VPS contains many application and you don't want to set up NodeJS server for every application, you're in the right place. **node-direct** allows to run JavaScript on a server just like **.php** files. The tool initializes one NodeJS instance per many websites and executes JavaScript files when URLs like **example.com/foo/bar.srv.js** are requested. **.srv.js** extension is configurable.

You know how to set up and run PHP script. You just need to upload it and run like this: *example.com/foo.php*. But what about NodeJS? You must define routes, run every app on its own port, dance around deploying, make sure that all instances work after server reload... It's OK if you do a big application but when you have only small server-side utilities (like ajax proxy) they just don't worth all these actions.

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

```js
module.exports = function(req, res) {
    const someModule = require('some-module');
    res.send('it works!');
}
```
Check out Express documentation for more info.

You can use local **package.json** and require any modules by **.srv.js** files placed at **node_modules** as you usually do. There is an example of potential file structure of an app.
```
/package.json - a package file with dependencies and devDependencies used by server files
/index.html - main HTML file
/js/app.js - client-side JavaScript app
/css/style.css - styles
/node_modules/ - things installed by "npm install"
/foo/index.srv.js - some API which allows to make requests to /foo/
/bar/index.srv.js - some dynamic HTML page returned when /bar/ is requested
```

### Flags
#### Common
- ``--port`` - a port of node-direct server (8123 by default)

#### Standalone mode
The standalone mode creates static HTTP server which doesn't require Nginx for its work. It can be used for development purposes on your local machine.
- ``--standalone`` - turns on standalone mode
- ``--root`` - a root of static files (``process.cwd()`` by default)
- ``--ext`` - an extension of runnable JS files (**.srv.js** by default)

```sh
node-direct --port=8000 --standalone --root=./foo/bar --ext=.serverside.js
```


## Running node-direct on startup (Ubuntu)

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

## Troubleshooting

As you know NodeJS caches files values returned by ``require`` function. When you call ``require('foo')`` twice or more it returns the same object. **node-direct** clears cache when **.srv.js** file is replaced (eg. you upload another version of such file) and you don't have to reload **node-direct** every time when the file is changed. A problem can appear there when you require other modules by **.srv.js** files.
```js
// foo.srv.js
module.exports = function(req, res) {
    const bar = require('./bar');
    // ...
}
```

When you change **foo.srv.js** it is reloaded as expected but when you change **./bar** its value returned by ``require`` remains the same. The tool could hot-reload all requested modules but this would make side-effects which may cause unpredictable behavior in other modules. To handle this issue and update module cache you need to define watcher and remove cache when the file is changed.

In example below you do want to hot reload **./bar** when it's changed but you don't want to update **./baz**.

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
