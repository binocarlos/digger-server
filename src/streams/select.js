var concat = require('concat-stream')
var through = require('through2')
var Selector = require('digger-selector')
var streamworks = require('streamworks')
var duplexer = require('reduplexer')
var cascade = require('group-cascade-stream')

// the front-end ship handler
// the contract is the body
module.exports = function(api){

	// a designated warehouse selector stream
	function warehouseQueryFactory(warehouse, selector, laststep){
		var headers = {
			'x-digger-selector':selector
		}
		if(laststep){
			headers['x-digger-laststep'] = true
		}
		return api({
			method:'get',
			url:warehouse,
			headers:headers
		})
	}

	// create a stream for a single selector step - multiple node ids will be piped in
	function selectorStepStream(selector, laststep){

		var inputopen = true
		var warehousesopen = 0
		var warehouses = {}
		
		var output = through.obj()

		var input = through.obj(function(chunk, enc, nextid){

			console.log('-------------------------------------------');
			console.dir('input: ' + chunk);
			console.dir(selector.tag);
			var warehouseid = api.warehouse.resolve(chunk)

			var warehouse = warehouses[warehouseid]
			if(!warehouse){
				warehouse = warehouses[warehouseid] = warehouseQueryFactory(warehouseid, selector, laststep)
				warehousesopen++
			}

			var stream = warehouse(chunk)

			stream.pipe(output, {end:false})

			stream.on('end', function(){
				warehousesopen--
				if(!inputopen && warehousesopen<=0){
					console.log('-------------------------------------------');
					console.log('warehouse end');
					output.push()
				}
				
			})

			nextid()

		}, function(){
			inputopen = false
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

			var start = selectorStepStream(phase[0])

			var middle = through.obj(function(chunk, enc, cb){
				console.log('-------------------------------------------');
				console.log('first result');
				console.dir(chunk);
				this.push(chunk)
				cb()
			})

			var second = selectorStepStream(phase[1], true)

			var end = through.obj(function(chunk, enc, cb){
				console.log('-------------------------------------------');
				console.log('second result');
				console.dir(chunk);
				this.push(chunk)
				cb()
			})

			start.pipe(middle).pipe(second).pipe(end)

			return duplexer(start, end, {
				objectMode:true
			})
			/*
			return streamworks.pipeObjects(phase.map(function(step, index){
				return selectorStepStream(step, index==phase.length-1)
			}))
*/
		}
		else{
			return selectorStepStream(phase[0], true)
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