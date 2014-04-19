var Server = require('../src');
var Client = require('digger-client');
var level = require('level');
var wrench = require('wrench');

describe('diggerserver', function(){

  var leveldb;

  beforeEach(function(done){
    this.timeout(1000);
    wrench.rmdirSyncRecursive('/tmp/diggertestdb', true);
    level('/tmp/diggertestdb', {}, function(err, ldb){
      if (err) throw err
      leveldb = ldb
      done();
    });
  })

  afterEach(function(done){
    this.timeout(1000);
    leveldb.close(done);
  })

  describe('constructor', function(){
  
    it('should be a function', function(){
      Server.should.be.type('function');
    })

    it('should throw if no leveldb or options', function(){
      (function(){
        var diggerdb = Server();
      }).should.throw('db required');
    })

    it('should create a digger server which should be an event emitter', function(done){
      var diggerdb = Server(leveldb);

      diggerdb.on('apples', done);
      diggerdb.emit('apples');
    })

  })

  describe('append and find data', function(){

    it('should append some data', function(done){
      var diggerdb = Server(leveldb);
      var client = Client();

      client.on('request', diggerdb.reception.bind(diggerdb));

      var warehouse = client.connect('/warehouse');

      var data = client.create('folder').addClass('red');

      var contract = warehouse.append(data)

      warehouse.append(data).ship(function(){
        warehouse('folder.red').ship(function(folder){
          folder.count().should.equal(1);
          done();
        })
      })

    })

  })


})
