var concat = require('concat-stream')
var through = require('through2')
var Selector = require('digger-selector')
var streamworks = require('streamworks')
var duplexer = require('reduplexer')

// the front-end ship handler
// the contract is the body
module.exports = function(api){

	// load from a single node with a single selector step
	function selectorPathStream(step, path, laststep){
		var headers = {
			'x-digger-selector':step
		}
		if(laststep){
			headers['x-digger-laststep'] = true
		}
		return api({
			method:'get',
			url:path,
			headers:headers
		})
	}

	// create a stream for a single selector step - multiple node ids will be piped in
	function selectorStepStream(step, laststep){

		var output = through.obj()

		var input = through.obj(function(path, topenc, topcb){

			selectorPathStream(step, path, laststep)
				.pipe(output)

		})

		return duplexer(input, output, {
			objectMode:true
		})
	}

	// create a stream for a selector phase of steps
	// multiple steps are piped through each other
	// the input is the starting contexts
	function selectorPhaseStream(phase){
		if(phase.length>1){
			return streamworks.pipe(phase.map(function(step, index){
				return selectorStepStream(step, index==phase.length-1)
			}))
		}
		else{
			return selectorStepStream(phase[0], true)
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