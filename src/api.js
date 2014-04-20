function factory(req){
	var fn = fns[req.url] || fns['/warehouse']
	var warehousename = fns[req.url] ? req.url : '/warehouse'
	var stream = fn(req)
	if(!stream){
		throw new Error('no stream returned: ' + warehousename)
	}
	stream._api = req.url
	return stream
}

var fns = {
	'/ship':require('./streams/ship')(factory),
	'/stream':require('./streams/stream')(factory),
	'/warehouse':require('./warehouse')(factory)
}

factory.convert = require('./convertcontract')(factory)
factory.warehouses = fns['/warehouse']

module.exports = factory
