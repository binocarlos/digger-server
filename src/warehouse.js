var through = require('through2');
var Router = require('routes');
var router = new Router();

function apiwrapper(api){
	return function(req){
		var handler = api[req.method]
		if(!handler){
			throw new Error('no handler found for method: ' + req.method + ' ' + req.url)
		}
		return handler(req)
	}
}

// the main gateway to the backend databases
// we match warehouses by their path
// the warehouse is just a function
// it accepts a req and returns a duplex stream
module.exports = function(api){

	function warehouse(req){
		req.url = req.url.substr('/warehouse'.length)

  	var match = router.match(req.url);

  	if(match){
  		return match.fn(req)
  	}
  	else if(warehouse.baseWarehouse){
  		return warehouse.baseWarehouse(req)
  	}
  	else{
  		return through.obj(function(chunk, enc, cb){
				cb('warehouse not found: ' + req.url)
			})
  	}
	}

	warehouse.use = function(route, fn){
		if(!fn){
			fn = route;
			route = null;
		}

		if(typeof(fn)!=='function'){
			fn = apiwrapper(fn)
		}

		if(route){
			router.addRoute(route, fn)
		}
		else{
			warehouse.baseWarehouse = fn
		}
	}

	return warehouse
}