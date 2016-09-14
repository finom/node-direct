# node-direct [![npm version](https://badge.fury.io/js/node-direct.svg)](https://badge.fury.io/js/node-direct)

**in development**

> A NodeJS server which allows to run server-side JavaScript files directly.

If your VPS contains many application and you don't want to set up NodeJS server for every application, you on the right way. **node-direct** allows to run JavaScript on a server just like PHP files. The tool creates one NodeJS server per many websites and executes JavaScript files when **/foo/bar.srv.js** paths are requested.

You know how to run PHP files: *example.com/foo.php* but now you can run JavaScript files the same way: *example.com/bar.srv.js* or even *example.com/* when *index.srv.js* name is used.

```
npm install -g node-direct
node-direct --port=8000
```


## Nginx configuration

All the magic mostly happens on Nginx server. You'll need to configure it to handle requests to **.srv.js** files for every website.

```
location ~ \.srv\.js$ {
    root <path_to_website_files>;
    proxy_pass http://localhost:<port>;
    proxy_set_header X-Requested-File-Path $document_root$uri;
}
```

- ``path_to_website_files`` - where static files are located.
- ``port`` - a port of node-direct server

Example:
```
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

## Todo
- ``--bodyparser`` flag
