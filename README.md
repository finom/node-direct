# node-direct [![npm version](https://badge.fury.io/js/node-direct.svg)](https://badge.fury.io/js/node-direct)

> A NodeJS server which allows to run server-side JavaScript files directly (server must be powered by Nginx).

If your VPS contains many application and you don't want to set up NodeJS server for every application, you on the right way. **node-direct** allows to run JavaScript on a server just like **.php** files. The tool creates one NodeJS server per many websites and executes JavaScript files when **example.com/foo/bar.srv.js** paths are requested. **.srv.js** extension is configurable.

You know how to set up and run PHP script. You just need to upload it and run like this: *example.com/foo.php*. But what about NodeJS? You must define routes, run every app on its own port, dance around deploying, make sure that all instances work after server reload... It's OK if you do big application but when you have only server-side utilities (like proxy) they just don't worth all these actions.

Install:
```sh
npm install -g node-direct
```

Run:
```sh
node-direct --port=8000
```


## Nginx configuration

All the magic mostly happens on Nginx side (the project itself is extremely small). You'll need to configure it to handle requests to **.srv.js** files for every website config.

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
```

## Usage
**node-direct** is powered by [Express](http://expressjs.com/). Every **.srv.js** file should export a function which accepts ``request`` and ``responce`` objects created by Express.

```js
module.exports = function(req, res) {
    res.send('it works!');
}
```


## Run node-direct on startup (Linux)

You can add cron job to run the server on startup. To modify crontab run ``crontab -e``. Add the job to the end of this file:

```
@reboot <path_to_node> <path_to_installed_module> [<flags>]
```

- ``path_to_node`` - absolute path to NoseJS binary (run ``which node`` to get the path)
- ``path_to_installed_module`` - absolute path to installed node-direct (there is no direct way to get it, you'll need to use Google to figure out the path)
- ``flags`` - flags you want to use

Example:
```
@reboot /usr/local/bin/node /usr/local/lib/node_modules/node-direct/index.js --port=8123
```
