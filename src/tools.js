var utils = require('digger-utils');

var tools = module.exports = {
	isContract:function(req){
		return req.url==utils.urls.merge || req.url==utils.urls.pipe
	},
	// remove the body of all requests that are not merge or pipe
	recurseStreamContract:function(contract){
		if(tools.isContract(contract)){
			contract.body.forEach(tools.recurseStreamContract)
		}
		else{
			delete contract.body;
		}
	}
}