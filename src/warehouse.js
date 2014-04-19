var through = require('through2');
var Router = require('routes');
var router = new Router();

// the main gateway to the backend databases
module.exports = function(api){

	function warehouse(req, res){

		req.url = req.url.substr('/warehouse'.length)

  	var match = router.match(req.url);

  	if(match){
  		return match.fn(req, res)
  	}
  	else if(warehouse.baseWarehouse){
  		return warehouse.baseWarehouse(req, res)
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

		if(route){
			router.addRoute(route, fn)
		}
		else{
			warehouse.baseWarehouse = fn;
		}
	}

	return warehouse
}