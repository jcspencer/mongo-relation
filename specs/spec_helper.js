var mongoose      = require('mongoose'),
    relationships = require('../');

var resetDb = function(next){
  mongoose.connection.db.dropDatabase(next);
};

before(function(done){
  if(mongoose.get('isConnected')){
    resetDb(done);
  } else {
    mongoose.connection.on('open', function(){
      resetDb(done);
    });
  }
});

var host = process.env.BOXEN_MONGODB_URL || process.env.MONGOOSE_TEST_URL || 'mongodb://localhost/';
var uri = host + 'mongo_relations';

mongoose.connect(uri, function(){
  mongoose.set('isConnected', true);
});
