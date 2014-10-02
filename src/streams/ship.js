var concat = require('concat-stream');
var through = require('through2');
var EventEmitter = require('events').EventEmitter

// the front-end ship handler
// the contract is the body
module.exports = function(api){

	var shipper = new EventEmitter()
	shipper.handler = function(req){

		shipper.emit('request', req)
		
		var res = through.obj()
		
		// collect the contract which is the body of the request
		req.pipe(concat(function(contract){

			// now we have the contract as POJO we can turn it into a stream
			// and pipe the output to the res
			api.convert(contract[0]).pipe(res)

		}))

		return res
	}

	return shipper
}