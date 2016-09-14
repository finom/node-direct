# node-direct

**in development**

> A server which allows to run JavaScript files directly.

If a server contains many application and you don't want to set up NodeJS server for every application, you on the right way. **node-direct** allows to run JavaScript on a server just like PHP files. The tool creates one server per many websites and executes JavaScript files on the server when ** *.srv.js ** paths are requested.

You know how to run PHP files: *example.com/foo.php* but now you can run JavaScript files the same way: *example.com/bar.srv.js*.

```
npm install -g node-direct
node-direct --port=8000
```


## Nginx configuration

All the magic mostly happens on Nginx server. You'll need to configure it to handle requests to **.srv.js** files for every website.

```
location ~ \.srv\.js$ {
    root <path_to_website_files>;
    index index.srv.js;
    proxy_pass http://localhost:<port>;
    proxy_set_header X-Requested-File-Path $document_root$uri;
}
```

``path_to_website_files`` - where website static is located.
``port`` - a port of node-direct server

Example:
```
# Serve static files
location / {
    root /var/web/example.com/public;
    index index.html index.htm;
}

location ~ \.srv\.js$ {
    root /var/web/example.com/public;
    index index.srv.js;
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
