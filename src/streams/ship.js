var concat = require('concat-stream');
var through = require('through2');

// the front-end ship handler
// the contract is the body
module.exports = function(api){
	return function(req){

		// the response stream
		var res = through.obj(function(chunk, enc, cb){
			this.push(chunk)
			cb()
		})

		// collect the contract which is the body of the request
		req.pipe(concat(function(contract){

			// now we have the contract as POJO we can turn it into a stream
			// and pipe the output to the res
			api.convert(contract[0]).pipe(res)

		}))

		return res
	}
}