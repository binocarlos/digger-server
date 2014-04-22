var EventEmitter = require('events').EventEmitter
var util = require('digger-utils')
var Api = require('./api')
var through = require('through2')

function Server(){
	EventEmitter.call(this)
	this.api = Api(this)
}

util.inherits(Server, EventEmitter)

// main api entry point
// req should be converted already by the transport
Server.prototype.reception = function(req, res){
/*
	console.log('-------------------------------------------');
	console.log('reception');
	console.dir(req.method);
	console.dir(req.url);
	console.dir(req.headers);*/
	this.api(req).pipe(through.obj(function(chunk, enc, cb){
		//console.log('-------------------------------------------');
		//console.log('RES');
		//console.dir(chunk);
		this.push(chunk)
		cb()
	})).pipe(res)
}

Server.prototype.use = function(route, warehouse){
	this.api.warehouse.use(route, warehouse)
}

module.exports = function(){
	return new Server()
}