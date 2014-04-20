var concat = require('concat-stream')
var through = require('through2')
var Selector = require('digger-selector')
var streamworks = require('streamworks')

// the front-end ship handler
// the contract is the body
module.exports = function(api){

	// load from a single node with a single selector step
	function selectorPathStream(step, path){
		return api({
			method:'get',
			url:path,
			headers:{
				'x-digger-selector':step
			}
		})
	}

	// create a stream for a single selector step - multiple node ids will be piped in
	function selectorStepStream(step){

		var stream = through.obj(function(path, enc, cb){
			var pathStream = selectorPathStream(step, path)

			pathStream.pipe(stream)
		})

		return stream;
	}

	// create a stream for a selector phase of steps
	// multiple steps are piped through each other
	// the input is the starting contexts
	function selectorPhaseStream(phase){
		if(phase.length>1){
			return streamworks.pipe(phase.map(selectorStepStream))
		}
		else{
			return selectorStepStream(phase[0])
		}
	}

	// create a stream for multiple phases (selectors split by ',')
	// multiple phases are merged
	function selectorStringStream(selector){
		if(selector.phases.length>1){
			return streamworks.merge(selector.phases.map(selectorPhaseStream))
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
			return streamworks.pipe([
				context,
				selector
			])
		}
		else{
			return selector || context
		}
	}
}