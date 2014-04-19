var api = {
	'/ship':require('./streams/ship'),
	'/stream':function(req, res){

	},
	'/merge':function(req, res){
		
	},
	'/pipe':function(req, res){
		
	},
	'/select':function(req, res){

	},
	'/data':function(req, res){

	}
}

module.exports = function(url){
	return api[url] || api['/data']
}