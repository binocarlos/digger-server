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

	shipper.on('event', function(name, data){
		api.emit('event', 'ship', name, data)
	})

	streamer.on('request', function(req){
		api.emit('request', 'stream', req)
	})

	streamer.on('event', function(name, data){
		api.emit('event', 'stream', name, data)
	})

	selector.on('request', function(req){
		api.emit('request', 'select', req)
	})

	selector.on('event', function(name, data){
		api.emit('event', 'select', name, data)
	})

	warehouse.on('request', function(req){
		api.emit('request', 'warehouse', req)
	})

	warehouse.on('event', function(name, data){
		api.emit('event', 'warehouse', name, data)
	})

	var methods = {
		'ship':shipper,
		'stream':streamer,
		'select':selector
	}

	var supplier
	var accessfn

	api.setWarehouse = function(supplier){
		warehouse.setSupplier(supplier)
	}

	api.setAccess = function(fn){
		warehouse.setAccess(fn)
	}

	api.getSelectStreamFactory = function(req){
		return warehouse.getSelectStreamFactory(req)
	}

	api.getReadAccessStream = function(req){
		return warehouse.getReadAccessStream(req)
	}

	api.getHandler = function(req){
		if(req.url.indexOf(utils.urls.base)==0){
			req.url = req.url.substr(utils.urls.base.length)
		}
		var method = req.url.split('/')[1]
		var fn = methods[method] || warehouse
		return fn.handler(req)
	}

	api.convert = ConvertContract(api)
	api.warehouse = warehouse

	return api
}
