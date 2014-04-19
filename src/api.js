function factory(req){
	var fn = fns[req.url] || fns['/warehouse']
	var stream = fn(req)
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
