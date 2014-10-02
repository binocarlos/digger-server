var Server = require('../src');
var Client = require('digger-client');
var through = require('through2')
var from = require('from2-array')

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

    it('should return an empty result for no warehouse match', function(done){

      var client = Client();

      var digger = Server()

      var eventsHit = {}

      digger.on('request', function(type, req){
        eventsHit[type] = req
      })

      client.on('request', digger.handler());

      var warehouse = client.connect('/apples');

      warehouse('fruit.red').ship(function(answers){

        eventsHit.ship.url.should.equal('/ship')
        eventsHit.select.url.should.equal('/select')
        eventsHit.select.headers['x-digger-selector'].should.equal('fruit.red')
        answers.models.length.should.equal(0)
        done();
        
      })

    })


/*
    it('run a select query with a stub warehouse as a function', function(done){

      var client = Client();

      var digger = Server()

      digger.use('/apples5', function(req){

        return function(path){

          return from.obj([{
            _digger:{
              tag:'fruit',
              class:['red']
            },
            name:'test'
          }])

        }
      })

      client.on('request', digger.handler());

      var warehouse = client.connect('/apples');

      warehouse('fruit.red').ship(function(answers){

        console.log('-------------------------------------------');
        console.dir(answers.models)
        process.exit()
        answers.models[0].name.should.equal('test')
        
        done();
        
      })

    })


    it('run a select query with a stub warehouse as an object', function(done){

      var client = Client();

      var digger = Server({
        select:function(req){

          return function(path){

            return from.obj([{
              _digger:{
                tag:'fruit',
                class:['red']
              },
              name:'test'
            }])

          }
        }
      })
      
      client.on('request', digger.handler());

      var warehouse = client.connect('/apples');

      warehouse('fruit.red').ship(function(answers){

        answers.models[0].name.should.equal('test')
        
        done();
        
      })

    })

    it('run a load query with a stub warehouse as an object', function(done){

      var client = Client();

      var digger = Server({
        select:function(req){

          return function(path){

            var fullpath = req.headers['x-digger-selector'].diggerid + path

            fullpath.should.equal('/red/apples')

            return from.obj([{
              _digger:{
                tag:'fruit',
                class:['red']
              },
              name:fullpath
            }])

          }
        }
      })
      
      client.on('request', digger.handler());

      var warehouse = client.connect('/apples');

      warehouse('/red').ship(function(answers){

        answers.models[0].name.should.equal('/red/apples')

        
        done();
        
      })

    })
*/
/*
    it('should match the correct warehouse from several', function(done){

      var digger = Server();
      var client = Client();

      digger.use('/apples/red', function(req, res){

        return function(path){

          console.log('-------------------------------------------');
          console.dir(path)
          return from.obj([{
            _digger:{
              tag:'apple',
              class:['red']
            },
            name:'test'
          }])

        }
      })

      digger.use('/apples/green', function(req, res){

        return function(path){

          console.log('-------------------------------------------');
          console.dir(path)

          return from.obj([{
            _digger:{
              tag:'apple',
              class:['green']
            },
            name:'test'
          }])

        }
      })

      client.on('request', digger.reception.bind(digger));

      var warehouse = client.connect('/apples/red');

      warehouse('fruit.red').ship(function(answers){

        console.log('-------------------------------------------');
        console.dir(answers)

        answers.models[0].name.should.equal('test')
        
        done();
        
      })

    })

    it('run an append query with a stub warehouse', function(done){

      var digger = Server();
      var client = Client();

      digger.use(function(req){
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

      warehouse.append(data).ship(function(answers){

        var models = answers.models

        models.length.should.equal(1)
        models[0].name.should.equal('test')

        done();
        
      })

    })
*/
  })


})
