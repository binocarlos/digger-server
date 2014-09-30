var Ship = require('./streams/ship')
var Stream = require('./streams/stream')
var Select = require('./streams/select')
var Warehouse = require('./streams/warehouse')
var ConvertContract = require('./convertcontract')

module.exports = function(server){

	// we trigger the api by the first part of the url
	// a request is passed
	//
	// /ship -> packaged contract
	// /stream -> streaming contract
	// /select -> selector resolving
	// /warehouse -> REST api for data
	//
	var methods = {
		'ship':Ship(api),
		'stream':Stream(api),
		'select':Select(api),
		'warehouse':Warehouse(api)
	}

	function api(req){
		var method = req.url.split('/')[1]
		var fn = methods[method] || methods.warehouse
		return fn(req)
	}

	api.server = server
	api.convert = ConvertContract(api)
	api.methods = methods
	api.warehouse = methods.warehouse
	api.use = api.warehouse.use.bind(api.warehouse)

	return api
}
