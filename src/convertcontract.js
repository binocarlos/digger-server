var from = require('from2')
var streamworks = require('streamworks')
var tools = require('./tools')

// turn a JSON object describing a contract into a single stream
// if a contract is not merge or pipe and has a body - the body
// will become the input stream for that contract (and not the main input)
module.exports = function(api){
	return function factory(req){
		// create a streamworks
		if(req.url=='/merge' || req.url=='/pipe'){
			var streams = req.body.map(function(c){
				return factory(c)
			})

			var method = req.url.substr(1)
			return streamworks[method].apply(null, [true,streams])
		}
		// create an api stream
		else{

			var body = null;

			if(req.body && req.body.length>0){
				body = [].concat(req.body)
			}

			delete(req.body)

			var stream = api(req)

			// create a fake pipe with the source data ignoring the input
			if(body){
				var piped = streamworks.pipe({
					objectMode:true
				},[
					from.obj(function(size, next){
						if (body.length <= 0) return this.push(null)
				    var chunk = body.shift()
				    next(null, chunk)
					}),
					stream
				])
				piped._api = stream._api
				return piped
			}
			else{
				return stream
			}
			
		}
	}
}