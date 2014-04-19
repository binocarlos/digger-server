var tools = require('../tools')

module.exports = function(api){
	return function(req, res){

		// collect the contract which is encoded in the HTTP header
		var contract = req.headers['x-digger-contract']

		if(typeof(contract)==='string'){
			contract = JSON.parse(contract)
		}

		console.log('-------------------------------------------');
		console.log('stream');
		tools.recurseStreamContract(contract)

	}
}