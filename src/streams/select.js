var concat = require('concat-stream')
var through = require('through2')
var Selector = require('digger-selector')
var streamworks = require('streamworks')
var duplexer = require('reduplexer')
var cascade = require('group-cascade-stream')

// the front-end ship handler
// the contract is the body
module.exports = function(api){

	// create a stream for a single selector step - multiple node ids will be piped in
	function selectorMultiStream(selector, laststep){
		var headers = {
			'x-digger-selector':selector
		}
		if(laststep){
			headers['x-digger-laststep'] = true
		}
		var query = api({
			method:'get',
			url:'/warehouse',
			headers:headers
		})
		return through.obj(function(chunk, enc, nextinput){
			var self = this;
			query(chunk)
				.pipe(through.obj(function(chunk, enc, cb){
					this.push(chunk)
					cb()
				}))
				.pipe(through.obj(function(chunk, enc, cb){
					console.log('-------------------------------------------');
					console.dir(chunk);
					self.push(chunk)
					cb()
				}, function(){
					console.log('-------------------------------------------');
					console.log('-------------------------------------------');
					console.log('FIN');
					nextinput()		
				}))
/*
			results.on('end', function(){
				open--
				if(open<=0){
					//output.push()
				}
			})
			results.pipe(through.obj(function(chunk, enc, cb){
				this.push(chunk)
				cb()
			}))
			nextinput()*/
		})
/*
		return duplexer(input, output, {
			objectMode:true
		})*/
	}

	// create a stream for a selector phase of steps
	// multiple steps are piped through each other
	// the input is the starting contexts
	function selectorPhaseStream(phase){
		if(phase.length>1){
			var selectorStreams = phase.map(function(step, index){
				return selectorMultiStream(step, index==phase.length-1)
			})
			var query = streamworks.pipeObjects(selectorStreams)
			return query
		}
		else{
			return selectorMultiStream(phase[0], true)
		}
	}

	// create a stream for multiple phases (selectors split by ',')
	// multiple phases are merged
	function selectorStringStream(selector){
		if(selector.phases.length>1){
			return streamworks.mergeObjects(selector.phases.map(selectorPhaseStream))
		}
		else{
			return selectorPhaseStream(selector.phases[0])
		}
	}

	// the master stream for the selector
	return function(req){

		var selector = null
		var context = null

		if(req.headers['x-digger-selector']){
			selector = selectorStringStream(Selector(req.headers['x-digger-selector']))
		}
		if(req.headers['x-digger-context']){
			context = selectorStringStream(Selector(req.headers['x-digger-context']))
		}

		if(!selector && !contract){
			throw new Error('no selector or context given')
		}
		else if(selector && context){
			return streamworks.pipeObjects([
				context,
				selector
			])
		}
		else{
			return selector || context
		}
	}
}