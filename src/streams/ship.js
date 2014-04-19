var concat = require('concat-stream');
var through = require('through');

module.exports = function(req, res){

	// collect the contract which is the body of the request
	req.pipe(concat(function(contract){
		
		contract = contract[0]

		console.log('-------------------------------------------');
		console.log('-------------------------------------------');
		
		console.log(JSON.stringify(contract, null, 4));
		process.exit();
	}))
}