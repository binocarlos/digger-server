digger-server
=============

![Build status](https://api.travis-ci.org/binocarlos/digger-server.png)

LevelDB backed digger warehouse

## install

```
$ npm install digger-server
```

## usage

You create a digger database by passing in an existing [leveldb](https://github.com/rvagg/node-levelup) - this can also be a [sub-level](https://github.com/dominictarr/level-sublevel)

You can either use the api directly or mount a HTTP handler.

```js
var Digger = require('digger-server')
var Level = require('level-digger')

var http = require('http')

var digger = Server(leveldb);

digger.use()


var level = require('level');
var leveldb = level('/tmp/diggertest');


var server = http.createServer(diggerdb.httpHandler());

server.listen(80, function(){
	console.log('digger server listening');
})
```

## api

The REST api is a front-end for the JavaScript api.

In almost all cases - the JavaScript api represents HTTP requests.

#### `diggerdb

## licence
MIT