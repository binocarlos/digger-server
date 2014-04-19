var from = require('from')
var streamworks = require('streamworks')
var tools = require('./tools')
var api = require('./api')

// turn a JSON object describing a contract into a single stream
// if a contract is not merge or pipe and has a body - the body
// will become the input stream for that contract (and not the main input)
var factory = module.exports = function(req){

	// create a streamworks
	if(req.url=='/merge' || req.url=='/pipe'){
		var streams = req.body.map(function(c){
			return factory(c)
		})

		var method = req.url.substr(1)
		return streamworks[method](streams)
	}
	// create an api stream
	else{

		var fn = api(req.url)
		var stream = fn(req, res)

		// create a fake pipe with the source data ignoring the input
		if(req.body && req.body.length>0){
			return streamworks.pipe([
				from(req.body),
				stream
			])
		}
		else{
			return stream;
		}
		
	}
}