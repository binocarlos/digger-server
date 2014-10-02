var EventEmitter = require('events').EventEmitter
var tools = require('../tools')

// the front-end stream handler
// the contract lives the in header
module.exports = function(api){

	var streamWarehouse = new EventEmitter()

	streamWarehouse.handler = function(req){

		streamWarehouse.emit('request', req)
		
		var contract = req.headers['x-digger-contract']

		if(typeof(contract)==='string'){
			contract = JSON.parse(contract)
		}

		tools.recurseStreamContract(contract)

		return req.pipe(api.convert(contract))
	}

	return streamWarehouse
}