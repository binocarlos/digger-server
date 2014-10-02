var through = require('through2')
var from = require('from2-array')
var Selector = require('digger-selector')
var streamworks = require('streamworks')
var duplexer = require('reduplexer')
var EventEmitter = require('events').EventEmitter

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

	var selectorWarehouse = new EventEmitter()

	// create a stream for a single selector step - multiple node ids will be piped in
	function selectorMultiStream(req, selector, laststep){

		// query is a single function that accepts a container url
		// it returns a stream for that single query
		var streamFactory = api.getSelectStreamFactory(selector, laststep)
		var accessStream = api.getReadAccessStream(req)
		var filter = uniqueFilter()

		return through.obj(function(chunk, enc, nextinput){
			var self = this;

			streamFactory(chunk)
				.pipe(accessStream)
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
	function selectorPhaseStream(req, phase, lastString){
		if(phase.length>1){
			var selectorStreams = phase.map(function(step, index){
				return selectorMultiStream(req, step, lastString && index==phase.length-1)
			})
			var query = streamworks.pipeObjects(selectorStreams)
			return query
		}
		else{
			return selectorMultiStream(req, phase[0], lastString)
		}
	}

	// create a stream for multiple phases (selectors split by ',')
	// multiple phases are merged
	function selectorStringStream(req, selector, lastString){
		if(selector.phases.length>1){
	
			var filter = uniqueFilter()

			var input = streamworks.mergeObjects(selector.phases.map(function(phase){
				return selectorPhaseStream(req, phase, lastString)
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
			return selectorPhaseStream(req, selector.phases[0], lastString)
		}
	}

	// the master stream for the selector
	selectorWarehouse.handler = function(req){

		var selector = null
		var context = null

		if(req.headers['x-digger-selector']){
			selector = selectorStringStream(req, Selector(req.headers['x-digger-selector']), true)
		}
		if(req.headers['x-digger-context']){
			context = selectorStringStream(req, Selector(req.headers['x-digger-context']))
		}

		selectorWarehouse.emit('request', req)

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

	return selectorWarehouse
}