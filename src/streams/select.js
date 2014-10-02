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
	function selectorMultiStream(url, selector, laststep){
		var headers = {
			'x-digger-selector':selector
		}
		if(laststep){
			headers['x-digger-laststep'] = true
		}

		// we post to _select to say we are gonna stream the ids
		var query = api.getHandler({
			method:'post',
			url:'/_select',
			headers:headers
		})

		// no match from registered suppliers
		// return empty stream
		if(!query){
			return through.obj(function(chunk, enc, next){
				next()
			})
		}

		if(typeof(query)!='function'){
			return query
		}

		var filter = uniqueFilter()

		return through.obj(function(chunk, enc, nextinput){
			var self = this;

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
	function selectorPhaseStream(url, phase, lastString){
		if(phase.length>1){
			var selectorStreams = phase.map(function(step, index){
				return selectorMultiStream(url, step, lastString && index==phase.length-1)
			})
			var query = streamworks.pipeObjects(selectorStreams)
			return query
		}
		else{
			return selectorMultiStream(url, phase[0], lastString)
		}
	}

	// create a stream for multiple phases (selectors split by ',')
	// multiple phases are merged
	function selectorStringStream(url, selector, lastString){
		if(selector.phases.length>1){
	
			var filter = uniqueFilter()

			var input = streamworks.mergeObjects(selector.phases.map(function(phase){
				return selectorPhaseStream(url, phase, lastString)
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
			return selectorPhaseStream(url, selector.phases[0], lastString)
		}
	}

	// the master stream for the selector
	selectorWarehouse.handler = function(req){

		var selector = null
		var context = null

		if(req.headers['x-digger-selector']){
			selector = selectorStringStream(req.url, Selector(req.headers['x-digger-selector']), true)
		}
		if(req.headers['x-digger-context']){
			context = selectorStringStream(req.url, Selector(req.headers['x-digger-context']))
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