var tools = module.exports = {
	isContract:function(req){
		return req.url=='/merge' || req.url=='/pipe';
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