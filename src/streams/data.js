var through = require('through');

module.exports = function(api){
	return function(req){

		console.log('-------------------------------------------');
		console.log('data');
		console.dir(req);

		return through(function(data){
			console.log('-------------------------------------------');
			console.dir(data);
			this.queue(data)
		})

	}
}