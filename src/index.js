var EventEmitter = require('events').EventEmitter
var util = require('digger-utils')
var api = require('./api')

function Server(db){
	EventEmitter.call(this)
	this._db = db
	this._middleware = []
}

util.inherits(Server, EventEmitter)

// main api entry point
// req should be converted already by the transport
Server.prototype.reception = function(req, res){
	api(req).pipe(res)
}

module.exports = function(leveldb){
	if(!leveldb){
		throw new Error('db required')
	}
	return new Server(leveldb)
}