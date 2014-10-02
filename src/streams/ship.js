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
		req
			.pipe(through.obj(function(chunk, enc, next){
				shipper.emit('event', 'input', chunk)
				this.push(chunk)
				next()
			}))
			.pipe(concat(function(contract){

				contract[0].headers['x-digger-user'] = req.headers['x-digger-user']

				// now we have the contract as POJO we can turn it into a stream
				// and pipe the output to the res
				api.convert(contract[0]).pipe(res)

			}))

		return res
	}

	return shipper
}