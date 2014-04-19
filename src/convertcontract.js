var from = require('from')
var streamworks = require('streamworks')
var tools = require('./tools')

// turn a JSON object describing a contract into a single stream
// if a contract is not merge or pipe and has a body - the body
// will become the input stream for that contract (and not the main input)
module.exports = function(api){
	return function factory(req, res){

		// create a streamworks
		if(req.url=='/merge' || req.url=='/pipe'){
			var streams = req.body.map(function(c){
				return factory(c)
			})

			var method = req.url.substr(1)
			return streamworks[method].apply(null, [{
				objectMode:true
			},streams])
		}
		// create an api stream
		else{

			var stream = api(req)

			// create a fake pipe with the source data ignoring the input
			if(req.body && req.body.length>0){
				var piped = streamworks.pipe({
					objectMode:true
				},[
					from(req.body),
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