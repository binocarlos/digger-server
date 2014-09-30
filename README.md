digger-server
=============

![Build status](https://api.travis-ci.org/binocarlos/digger-server.png)

Warehouse routing for [digger-client](https://github.com/diggerio/digger-client) requests.

## install

```
$ npm install digger-server
```

## usage

Make a [digger-level](https://github.com/diggerio/digger-level) supplier and mount it.

```js
var level = require('level');
var diggerserver = require('digger-server')
var diggerlevel = require('digger-level')

// create a new leveldb - this can also be a sub-level
var leveldb = level('/tmp/digger')

// create a level digger supplier
var supplier = diggerlevel(leveldb)

// create a digger server to mount our level supplier
var digger = diggerserver()

// mount the level supplier onto the server
digger.use(supplier)

// create a HTTP server to host it
var server = http.createServer(digger.handler())

server.listen(80)
```

## licence
MIT