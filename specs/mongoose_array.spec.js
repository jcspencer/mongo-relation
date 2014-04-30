require('./spec_helper');

var mongoose = require('mongoose'),
    should   = require('should'),
    User     = require('./support/userModel');

describe('additions to mongoose array prototype', function(){
  beforeEach(function(){
    this.user = new User({});
  });

  it('adds a create methods to the association', function(){
    this.user.tweets.create.should.be.a.Function;
  });

  it('adds a find methods to the association', function(){
    this.user.tweets.find.should.be.a.Function;
  });

  it('adds a populate methods to the association', function(){
    this.user.tweets.populate.should.be.a.Function;
  });

  it('adds a remove methods to the association', function(){
    this.user.tweets.remove.should.be.a.Function;
    this.user.tweets.delete.should.be.a.Function;
    this.user.tweets.remove.should.eql(this.user.tweets.delete);
  });

  it('adds a append methods to the association', function(){
    this.user.tweets.append.should.be.a.Function;
  });

  it('adds a concat methods to the association', function(){
    this.user.tweets.concat.should.be.a.Function;
  });
});
