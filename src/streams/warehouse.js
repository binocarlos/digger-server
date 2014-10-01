var through = require('through2')
var Router = require('routes')
var Selector = require('digger-selector')
var from = require('from2-array')
/*

	wrap an object with get,post,put and delete keys into a handler function
	
*/
module.exports = function wrapsupplier(supplier){
	return function(req){

		if(typeof(supplier)=='function'){
			return supplier(req)
		}

		// Expect no input
		if(req.method=='get'){
			var query = req.query || {}
			var queryselector = query.selector || query.s
			var headerselector = req.headers['x-digger-selector']

			var selector = queryselector || headerselector
			var feedurl = ''

			if(selector){
				if(typeof(selector)==='string'){
					selector = Selector(selector)
					if(selector && selector.phases && selector.phases.length>0){
						selector = selector.phases[0][0]
					}
				}
				feedurl = req.url
			}
			else{
				selector = {
					diggerid:req.url
				}
				feedurl = ''
			}

			req.headers['x-digger-selector'] = selector
			req.headers['x-digger-laststep'] = true

			var queryStreamFn = supplier.select(req)
			return queryStreamFn(feedurl)
		}
		else if(req.method=='post'){
			if(req.url.indexOf('/_select/')==0){
				req.url = req.url.substr('/_select'.length)
				var selector = req.headers['x-digger-selector']

				// supplier select returns function(path) which returns a stream
				return supplier.select(req)
			}
			else{
				return supplier.append(req)	
			}
			
		}
		else if(req.method=='put'){
			return supplier.save(req)	
		}
		else if(req.method=='delete'){
			return supplier.remove(req)	
		}
	}
}