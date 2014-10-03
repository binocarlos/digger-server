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
digger.warehouse(supplier)

// access control
digger.access(function(path, user, mode, next){
	next()	
})

// create a HTTP server to host it
var server = http.createServer(digger.handler())

server.listen(80)
```

## notes

The digger server accepts HTTP requests that have been converted to JSON objects.

A digger `req` is a read-stream in object mode with the following properties:

```js
{
	method:'get',
	headers:{
		'x-digger-selector':'folder.red'
	},
	url:'/apples'
}
```

#### raw requests

You can convert raw HTTP requests using [digger-http](https://github.com/binocarlos/digger-http).

#### endpoints

Here are the notable endpoints:

 * POST /digger/ship - callback based contracts
 * POST /digger/stream - stream based contracts
 * POST /digger/select - selector resolving
 * * /* - warehouse

The first 3 are used for contract resolving - a contract is a complicated multi-step selector / append / save / delete request.

#### ship

The ship endpoint accepts a contract as its POST data and expects the body of each contract to be present.

#### stream

The stream endpoint accepts a contract in its x-digger-contract header and will stream the requests input to that contract.

#### select

This creates selector streams for each of the selector stages and pipes them accordingly.

The input is not JSON packets but context paths.

#### warehouse

This is the REST controller back to the storage engine - you can call standard HTTP on this (for example to load a single container just GET its url)

## licence
MIT