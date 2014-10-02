var through = require('through2')
var Selector = require('digger-selector')
var from = require('from2-array')
var EventEmitter = require('events').EventEmitter
var util = require('util')

function Warehouse(){
	EventEmitter.call(this)
}

util.inherits(Warehouse, EventEmitter)

module.exports = Warehouse

// return a generic stream that auto loads the supplier for each input
Warehouse.prototype.handler = function(req){
	var self = this;

	if(!this._supplier){
		throw new Error('error - there is no supplier given to the digger-server')
	}

	return this._wrappedsupplier(req)
}

Warehouse.prototype.setSupplier = function(supplier){
	this._supplier = supplier
	this._wrappedsupplier = this.wrapSupplier(supplier)
}


Warehouse.prototype.setAccess = function(fn){
	this._access = fn
}

Warehouse.prototype.checkAccess = function(path, user, mode, done){
	if(!this._access){
		return done()
	}
	this._access(path, user, mode, done)
}

/*

	check access for the originating url letting chunks through if it passes
	
*/
Warehouse.prototype.getWriteAccessStream = function(req){
	
	var checkedAccess = false
	var hasAccess = false

	// a stream that we can return right away that runs the single url via access control
	var accessStream = through.obj(function(chunk, enc, next){
		var s = this
		if(checkedAccess){
			if(hasAccess){
				s.push(chunk)
			}
			next()
		}
		else{
			self.checkAccess(req.url, req.headers['x-digger-user'], 'write', function(err){
				checkedAccess = true
				if(!err){
					hasAccess = true
					s.push(chunk)
				}
				next()
			})
		}
	})

	return accessStream
}

/*

	check access for each incoming chunk (which is expected to be a string i.e. the path)
	
*/
Warehouse.prototype.getReadAccessStream = function(req){
	var self = this;

	// a stream that we can return right away that runs the single url via access control
	var accessStream = through.obj(function(chunk, enc, next){
		var s = this
		if(chunk._digger.path){
			checkpath = [chunk._digger.path, chunk._digger.inode].join('/')
		}
		else{
			checkpath = '/'
		}
		self.checkAccess(checkpath, req.headers['x-digger-user'], 'read', function(err){
			if(!err){
				s.push(chunk)
			}
			next()
		})
	})

	return accessStream
}

Warehouse.prototype.getSelectStreamFactory = function(selector, laststep){
	if(!this._supplier){
		throw new Error('error - there is no supplier given to the digger-server')
	}
	return this._supplier.select(selector, laststep)
}

Warehouse.prototype.wrapSupplier = function(supplier){
	var self = this;
	return function(req){

		// Expect no input
		if(req.method=='get'){
			var query = req.query || {}
			var queryselector = query.selector || query.s
			var headerselector = req.headers['x-digger-selector']

			var selector = queryselector || headerselector
			var feedurl = ''

			if(selector){
				if(typeof(selector)==='string'){
					selector = Selector(selector)
					if(selector && selector.phases && selector.phases.length>0){
						selector = selector.phases[0][0]
					}
				}
				feedurl = req.url
			}
			else{
				selector = {
					diggerid:req.url
				}
				feedurl = ''
			}

			var queryStreamFactory = supplier.select(selector, true)

			var accessStream = self.getReadAccessStream(req)
			var queryStream = queryStreamFactory(feedurl)	

			return queryStream.pipe(accessStream)
		}
		else{

			var accessStream = self.getWriteAccessStream(req)
			var supplierStream

			if(req.method=='post'){
				if(req.headers['x-base-request']){
					req.pipe(accessStream)
				}
				supplierStream = supplier.append(req)	
			}
			else if(req.method=='put'){
				if(req.headers['x-base-request']){
					req.pipe(accessStream)
				}
				supplierStream = supplier.save(req)	
			}
			else if(req.method=='delete'){
				supplierStream = supplier.remove(req)	
			}

			return accessStream.pipe(supplierStream)
		}
	}
}

module.exports = function(){

	return new Warehouse()

}