var through = require('through2');

// the data stream is the main 
module.exports = function(api){
	return function(req){

		console.log('-------------------------------------------');
		console.log('data stream');
		console.log(req.url);
		console.log(req.method);
		return through.obj(function(chunk, enc, cb){
			console.log('-------------------------------------------');
			console.log('input');
			console.dir(chunk);
			this.push(chunk)
			cb()
		})

	}
}