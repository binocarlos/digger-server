var Server = require('../src');
var Client = require('digger-client');
var through = require('through2')

describe('diggerserver', function(){

  describe('constructor', function(){
  
    it('should be a function', function(){
      Server.should.be.type('function');
    })

    it('should create a digger server which should be an event emitter', function(done){
      var diggerdb = Server();

      diggerdb.on('apples', done);
      diggerdb.emit('apples');
    })

  })


  describe('basic queries', function(){

    it('run a query with a stub warehouse', function(done){

      var digger = Server();
      var client = Client();

      digger.use(function(req, res){
        return through.obj(function(chunk, env, cb){

          chunk._digger.tag.should.equal('folder')
          chunk._digger.path.should.equal('/apples')
          chunk._digger.class.length.should.equal(1)
          chunk._digger.class[0].should.equal('red')
          this.push({
            name:'test'
          })
          cb()
        })
      })

      client.on('request', digger.reception.bind(digger));

      var warehouse = client.connect('/apples');

      var data = client.create('folder').addClass('red');

      var contract = warehouse.append(data)

      warehouse.append(data).ship(function(answers){

        var models = answers.models

        models.length.should.equal(1)
        models[0].name.should.equal('test')

        done();
        
      })

    })

  })


})
