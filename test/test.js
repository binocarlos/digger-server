var Server = require('../src');
var Client = require('digger-client');
var through = require('through2')
var from = require('from2-array')
var concat = require('concat-stream')

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

    it('should run with basic access control', function(done){

      var client = Client();
      var digger = Server()

      digger.warehouse({
        select:function(req){
      
          return function(path){

            return from.obj([{
              _digger:{
                path:'/apples/red',
                inode:'bigred',
                tag:'fruit',
                class:['red']
              },
              name:'test'
            }])

          }
        }
      })

      digger.access(function(path, user, mode, next){
        
        path.should.equal('/apples/red/bigred')
        user.should.equal('bob')
        mode.should.equal('read')

        next()
      })

      client.on('request', function(req, res){
        req.headers['x-digger-user'] = 'bob'
        digger.reception(req, res)
      })

      var warehouse = client.connect('/apples');

      warehouse('fruit.red').ship(function(answers){

        answers.models[0].name.should.equal('test')
        done();
        
      })

    })

    it('run an append query with a stub warehouse', function(done){

      var digger = Server();
      var client = Client();

      digger.warehouse({
        append:function(req){
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
        }
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

    it('run a delete query with a stub warehouse', function(done){

      var digger = Server();
      var client = Client();

      digger.warehouse({
        select:function(selector, laststep){

          selector.string.should.equal('thing')
          return function(path){

            path.should.equal('/apples')

            return from.obj([{
              _digger:{
                path:'/apples/red',
                inode:'bigred',
                tag:'fruit',
                class:['red']
              },
              name:'test'
            }])

          }
        },
        remove:function(req){
          return through.obj(function(chunk, env, cb){

            chunk.should.equal('/apples/red/bigred')

            cb()
          })
        }
      })

      client.on('request', digger.reception.bind(digger));

      var warehouse = client.connect('/apples');

      warehouse('thing').ship(function(results){
        results.remove().ship(function(delresults){
          
          done()
        })
        
      })

    })

    it('run a direct query', function(done){

      var digger = Server();
      
      digger.warehouse({
        select:function(selector, laststep){

          selector.string.should.equal('apples.red')
          selector.class.red.should.equal(true)
          selector.tag.should.equal('apples')
      
          return function(path){

            path.should.equal('/apples/blue')

            return from.obj([{
              _digger:{
                path:'/apples/red',
                inode:'bigred',
                tag:'fruit',
                class:['red']
              },
              name:'test'
            }])

          }
        }
      })

      var res = concat(function(results){

        results.length.should.equal(1)
        results[0].name.should.equal('test')

        done()
      })

      var req = {
        url:'/apples/blue',
        query:{
          selector:'apples.red'
        },
        headers:{},
        method:'get'
      }

      digger.reception(req, res)

    })

  })


})
