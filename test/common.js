var mongoose = require('mongoose');

if(process.env.BOXEN_MONGODB_URL){
  var host = process.env.BOXEN_MONGODB_URL + 'mongoose_relationships_test';
} else if(process.env.MONGOOSE_TEST_URL){
  var host = process.env.MONGOOSE_TEST_URL;
} else {
  var host = 'mongodb://localhost/';
}

var uri = host + 'mongoose_relationships_test';

module.exports = function (options) {
  return mongoose.createConnection( uri , options);
};

module.exports.mongoose = mongoose;
