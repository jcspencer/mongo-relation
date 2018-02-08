let wtfnode = require('wtfnode');

let mongoose = require('../')(require('mongoose'));

let resetDb = function(next){
  mongoose.connection.db.dropDatabase(next);
};

before(function(done){
  if(mongoose.get('isConnected')){
    resetDb(done);
  } else {
    mongoose.connection.on('open', function(){ resetDb(done); }); }
});

after(function (done) {
  wtfnode.dump();
  done();
});

let host = process.env.BOXEN_MONGODB_URL || process.env.MONGOOSE_TEST_URL || 'mongodb://localhost/';
let uri = host + 'mongo_relations';

mongoose.connect(uri, function(){
  mongoose.set('isConnected', true);
});

module.exports = mongoose;
