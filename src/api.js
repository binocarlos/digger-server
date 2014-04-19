function factory(req){
	var fn = fns[req.url] || fns['/data']
	var stream = fn(req)
	stream._api = req.url
	return stream
}

var fns = {
	'/ship':require('./streams/ship')(factory),
	'/stream':require('./streams/stream')(factory),
	'/data':require('./streams/data')(factory)
}

factory.convert = require('./convertcontract')(factory)

module.exports = factory