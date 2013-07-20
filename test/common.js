var mongoose = require('mongoose');

module.exports = function (options) {
  return mongoose.createConnection(
      process.env.MONGOOSE_TEST_URI || 'mongodb://localhost/mongoose_relationships_test'
    , options
  );
};

module.exports.mongoose = mongoose;