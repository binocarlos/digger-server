var Ship = require('./streams/ship')
var Stream = require('./streams/stream')
var Select = require('./streams/select')
var Warehouse = require('./streams/warehouse')
var ConvertContract = require('./convertcontract')
var utils = require('digger-utils')

module.exports = function(supplier){

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
		'warehouse':Warehouse(supplier)
	}

	function api(req){
		if(req.url.indexOf(utils.urls.base)==0){
			req.url = req.url.substr(utils.urls.base.length)
		}
		var method = req.url.split('/')[1]
		var fn = methods[method] || methods.warehouse
		return fn(req)
	}

	api.convert = ConvertContract(api)

	return api
}
