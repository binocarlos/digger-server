var EventEmitter = require('events').EventEmitter
var util = require('digger-utils')
var Api = require('./api')
var through = require('through2')

function Server(supplier){
	EventEmitter.call(this)
	this.api = Api(supplier)
}

util.inherits(Server, EventEmitter)

// main api entry point
// req & res should be in object mode
Server.prototype.reception = function(req, res){
	var self = this;
	
	var stream = self.api(req)

	if(!stream || typeof(stream)=='string'){
		stream = stream || 'no stream returned'
		res.emit('error', stream)
		return
	}

	stream.pipe(through.obj(function(chunk, enc, cb){
		// we can put server level filters here
		this.push(chunk)
		cb()
	})).pipe(res)
}

Server.prototype.handler = function(){
	return this.reception.bind(this)
}

module.exports = function(supplier){
	return new Server(supplier)
}