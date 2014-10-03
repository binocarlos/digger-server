var from = require('from2-array')
var streamworks = require('streamworks')
var tools = require('./tools')
var utils = require('digger-utils')

// turn a JSON object describing a contract into a single stream
// if a contract is not merge or pipe and has a body - the body
// will become the input stream for that contract (and not the main input)
module.exports = function(api){
	return function factory(req){
		// create a streamworks
		if(req.url==utils.urls.merge || req.url==utils.urls.pipe){
			var streams = req.body.map(function(c){
				c.headers = c.headers || {}
				c.headers['x-digger-user'] = req.headers['x-digger-user']
				return factory(c)
			})

			if(req.url.indexOf(utils.urls.base)==0){
				req.url = req.url.substr(utils.urls.base.length)
			}
			
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

			// we are gonna hook up the pipe
			var stream = api.getHandler(req, true)

			// create a fake pipe with the source data ignoring the input
			if(body){
				var piped = streamworks.pipe({
					objectMode:true
				},[
					from.obj(body),
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