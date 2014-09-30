var through = require('through2')
var Selector = require('digger-selector')
var streamworks = require('streamworks')
var duplexer = require('reduplexer')

function getModelUrl(model){
	return typeof(model)==='string' ? model : model._digger.path + '/' + model._digger.inode
}

function uniqueFilter(){
	var hit = {}
	return function(chunk){
		var url = getModelUrl(chunk)
		if(!hit[url]){
			hit[url] = true
			return true
		}
		else{
			return false
		}
	}
}

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

		var filter = uniqueFilter()

		return through.obj(function(chunk, enc, nextinput){
			var self = this;
/*
			var unique = uniqueFilter(function(r){
				self.push(chunk)
			})*/

			query(chunk)
				.pipe(through.obj(function(chunk, enc, cb){
					if(filter(chunk)){
						self.push(chunk)	
					}
					cb()
				}, function(){
					nextinput()		
				}))
		})
	}

	// create a stream for a selector phase of steps
	// multiple steps are piped through each other
	// the input is the starting contexts
	function selectorPhaseStream(phase, lastString){
		if(phase.length>1){
			var selectorStreams = phase.map(function(step, index){
				return selectorMultiStream(step, lastString && index==phase.length-1)
			})
			var query = streamworks.pipeObjects(selectorStreams)
			return query
		}
		else{
			return selectorMultiStream(phase[0], lastString)
		}
	}

	// create a stream for multiple phases (selectors split by ',')
	// multiple phases are merged
	function selectorStringStream(selector, lastString){
		if(selector.phases.length>1){
	
			var filter = uniqueFilter()

			var input = streamworks.mergeObjects(selector.phases.map(function(phase){
				return selectorPhaseStream(phase, lastString)
			}))
			var output = through.obj(function(chunk, enc, cb){
				if(filter(chunk)){
					this.push(chunk)
				}
				cb()
			})

			input.pipe(output)

			return duplexer(input, output, {
				objectMode:true
			})
		}
		else{
			return selectorPhaseStream(selector.phases[0], lastString)
		}
	}

	// the master stream for the selector
	return function(req){

		var selector = null
		var context = null

		if(req.headers['x-digger-selector']){
			selector = selectorStringStream(Selector(req.headers['x-digger-selector']), true)
		}
		if(req.headers['x-digger-context']){
			context = selectorStringStream(Selector(req.headers['x-digger-context']))
		}

		if(!selector && !contract){
			return 'no selector or context given'
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