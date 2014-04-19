var EventEmitter = require('events').EventEmitter;
var utils = require('digger-utils');

function Server(db){
	EventEmitter.call(this);
	this._db = db;
	this._middleware = [];
}

utils.inherits(Server, EventEmitter);

var api = {
	'/ship':require('./streams/ship'),
	'/stream':function(req, res){

	},
	'/merge':function(req, res){
		
	},
	'/pipe':function(req, res){
		
	},
	'/select':function(req, res){

	},
	'/data':function(req, res){

	}
}

// main api entry point
// req should be converted already by the transport
Server.prototype.reception = function(req, res){
	var streamfn = api[req.url] || api['/data'];

	streamfn(req, req, res);
}

module.exports = function(leveldb){
	if(!leveldb){
		throw new Error('db required');
	}
	return new Server(leveldb);
}