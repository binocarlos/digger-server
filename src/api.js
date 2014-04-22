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
	function api(req){
		var method = req.url.split('/')[1]
		var fn = methods[method] || methods.warehouse
		var warehousename = method || 'warehouse'
		var stream = fn(req)
		if(!stream){
			throw new Error('no stream returned: ' + method + ' - ' + req.url)
		}
		stream._api = req.url
		return stream
	}

	var methods = {
		'ship':Ship(api),
		'select':Select(api),
		'stream':Stream(api),
		'warehouse':Warehouse(api)
	}

	api.server = server
	api.convert = ConvertContract(api)
	api.methods = methods
	api.warehouse = methods.warehouse
	api.use = api.warehouse.use.bind(api.warehouse)

	return api
}
