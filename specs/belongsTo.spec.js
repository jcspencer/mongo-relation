require('./spec_helper');

var mongoose = require('mongoose'),
    should   = require('should'),
    User     = require('./support/userModel'),
    Tweet    = require('./support/tweetModel'),
    Tag      = require('./support/tagModel');

describe('belongsTo', function() {
  it('child schema belongsTo path', function() {
    Tweet.schema.paths.author.options.belongsTo.should.equal('User');
  });

  it('sets the standard mongoose refs', function() {
    Tweet.schema.paths.author.instance.should.equal('ObjectID');
    Tweet.schema.paths.author.options.ref.should.equal('User');
  });
});
