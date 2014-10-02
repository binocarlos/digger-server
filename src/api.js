var EventEmitter = require('events').EventEmitter
var Ship = require('./streams/ship')
var Stream = require('./streams/stream')
var Select = require('./streams/select')
var Warehouse = require('./streams/warehouse')
var ConvertContract = require('./convertcontract')
var utils = require('digger-utils')

module.exports = function(){

	var api = new EventEmitter()

	// we trigger the api by the first part of the url
	// a request is passed
	//
	// /ship -> packaged contract
	// /stream -> streaming contract
	// /select -> selector resolving
	// /warehouse -> REST api for data
	//

	var shipper = Ship(api)
	var streamer = Stream(api)
	var selector = Select(api)
	var warehouse = Warehouse()


	shipper.on('request', function(req){
		api.emit('request', 'ship', req)
	})

	streamer.on('request', function(req){
		api.emit('request', 'stream', req)
	})

	selector.on('request', function(req){
		api.emit('request', 'select', req)
	})

	warehouse.on('request', function(req){
		api.emit('request', 'warehouse', req)
	})

	var methods = {
		'ship':shipper,
		'stream':streamer,
		'select':selector,
		'warehouse':warehouse
	}

	api.getHandler = function(req){
		if(req.url.indexOf(utils.urls.base)==0){
			req.url = req.url.substr(utils.urls.base.length)
		}
		var method = req.url.split('/')[1]
		var fn = methods[method] || methods.warehouse
		return fn.handler(req)
	}

	api.convert = ConvertContract(api)
	api.warehouse = methods.warehouse

	return api
}
