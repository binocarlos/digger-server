var Server = require('../src');
var Client = require('digger-client');
var level = require('level');
var wrench = require('wrench');

var leveldb;

function makedb(done){
  wrench.rmdirSyncRecursive('/tmp/diggertestdb', true);
  level('/tmp/diggertestdb', {}, function(err, ldb){
    if (err) throw err
    leveldb = ldb
    done();
  });
}

function closedb(done){
  leveldb.close(done);
}

makedb(function(){
  var diggerdb = Server(leveldb);
  var client = Client();

  setInterval(function(){

  }, 1000)

/*
  client.on('request', diggerdb.reception.bind(diggerdb));

  var warehouse = client.connect('/warehouse');

  var data = client.create('folder').addClass('red');

  var contract = warehouse.append(data)

  warehouse.append(data).ship(function(answers){

    console.log('-------------------------------------------');
    process.exit();

  })*/
})