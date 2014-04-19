var concat = require('concat-stream');
var through = require('through');
var tools = require('../tools')

module.exports = function(req, res){

	// collect the contract which is encoded in the HTTP header
	var contract = req.headers['x-digger-contract']

	if(typeof(contract)==='string'){
		contract = JSON.parse(contract)
	}

	tools.recurseStreamContract(contract)

	req.pipe(concat(function(contract){
		
		contract = contract[0]

		console.log('-------------------------------------------');
		console.log('-------------------------------------------');
		
		console.log(JSON.stringify(contract, null, 4));
		process.exit();
	}))
}