var EventEmitter = require('events').EventEmitter
var util = require('digger-utils')
var api = require('./api')

function Server(){
	EventEmitter.call(this)
}

util.inherits(Server, EventEmitter)

// main api entry point
// req should be converted already by the transport
Server.prototype.reception = function(req, res){
	api(req).pipe(res)
}

Server.prototype.use = function(route, warehouse){
	api.warehouses.use(route, warehouse)
}

module.exports = function(){
	return new Server()
}