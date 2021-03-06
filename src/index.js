var EventEmitter = require('events').EventEmitter
var util = require('digger-utils')
var Api = require('./api')
var through = require('through2')

function Server(){
	var self = this;
	EventEmitter.call(this)
	this.api = Api()
	this.api.on('request', function(type, req){
		self.emit('request', type, req)
	})

	this.api.on('event', function(type, name, data){
		self.emit('event', type, name, data)
	})
}

util.inherits(Server, EventEmitter)

// main api entry point
// req & res should be in object mode
Server.prototype.reception = function(req, res){
	var self = this;

	this.emit('reception', req)

	req.headers['x-base-request'] = true
	var stream = self.api.getHandler(req)

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

Server.prototype.warehouse = function(supplier){
	this.api.setWarehouse(supplier)
	return this
}

Server.prototype.access = function(fn){
	this.api.setAccess(fn)
	return this
}

module.exports = function(supplier){
	return new Server(supplier)
}