var through = require('through2')
var Router = require('routes')
var Selector = require('digger-selector')

function apiwrapper(api){
	return function(req){
		var handler = api[req.method]
		if(!handler){
			throw new Error('no handler found for method: ' + req.method + ' ' + req.url)	
		}

		// process selector strings
		if(req.method=='get'){
			var query = req.query || {}
			var queryselector = query.selector || query.s
			var headerselector = req.headers['x-digger-selector']

			var selector = queryselector || headerselector

			if(typeof(selector)==='string'){
				selector = Selector(selector)
				if(selector && selector.phases && selector.phases.length>0){
					selector = selector.phases[0][0]
				}
			}

			req.headers['x-digger-selector'] = selector
		}
		
		return handler(req)
	}
}

// the main gateway to the backend databases
// we match warehouses by their path
// the warehouse is just a function
// it accepts a req and returns a duplex stream
module.exports = function(api){

	var router = new Router();

	function warehouse(req){
		//req.url = req.url.substr('/warehouse'.length)

  	var match = router.match(req.url);

  	if(match){
  		return match.fn(req)
  	}
  	else{
  		return 'warehouse not found: ' + req.url
  	}
	}

	// turn a route into the warehouse it would match
	warehouse.resolve = function(route){
		var match = router.match(route || '/')
		return match ? match.route : '/'
	}

	warehouse.use = function(route, fn){
		if(!fn){
			fn = route;
			route = null;
		}

		if(typeof(fn)!=='function'){
			fn = apiwrapper(fn)
		}

		if(!route){
			route = '/*'
		}

		router.addRoute(route, fn)
	}

	return warehouse
}