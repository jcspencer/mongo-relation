require('./spec_helper');

var mongoose = require('mongoose'),
    should   = require('should'),
    User     = require('./support/userModel'),
    Tweet    = require('./support/tweetModel'),
    Tag      = require('./support/tagModel'),
    Location = require('./support/locationModel');

describe('belongsTo', function() {
  it('child schema belongsTo path', function() {
    Tweet.schema.paths.author.options.belongsTo.should.equal('User');
  });

  it('sets the standard mongoose refs', function() {
    Tweet.schema.paths.author.instance.should.equal('ObjectID');
    Tweet.schema.paths.author.options.ref.should.equal('User');
  });

  it('sets the required field', function() {
    Tweet.schema.paths.author.isRequired.should.be.ok
  });
});

describe('belongsTo, polymorphic true', function() {
  it('sets the correct paths', function() {
    should(Location.schema.paths.locateable).exist
    should(Location.schema.paths.locateable.instance).equal('ObjectID')

    should(Location.schema.paths.locateable_type).exist
    should(Location.schema.paths.locateable_type.instance).equal('String')
  });
});
