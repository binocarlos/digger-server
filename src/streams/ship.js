var concat = require('concat-stream');
var through = require('through');

module.exports = function(api){
	return function(req){

		// the stream we return - a delayed stream to give us the chance to 
		// read the contract in the body first
		var res = through(function(d){
			console.log('-------------------------------------------');
			console.log('-------------------------------------------');
			console.log('-------------------------------------------');
			console.dir(d);
			this.queue(d)
		})

		// collect the contract which is the body of the request
		req.pipe(concat(function(contract){
			
			contract = contract[0]

			var contractStream = api.convert(contract)

			contractStream.pipe(res)

		}))

		return res
	}
}