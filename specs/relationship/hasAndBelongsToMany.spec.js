require('../');

var should       = require('should')
  , Relationship = require('../../lib/relationship/hasAndBelongsToMany')
  , User         = require('../support/userModel')
  , Pet          = require('../support/petModel')
  , Dog          = require('../support/dogModel')
  , Fish         = require('../support/fishModel')
  , Post         = require('../support/postModel')
  , Category     = require('../support/categoryModel');

describe('hasManyBelongsToMany', function() {
  describe('constructor', function() {
    var path, relationship, user;

    beforeEach(function(){
      user = new User();
      relationship = new Relationship(user.pets);
    });

    it("holds reference to it's path", function(){
      should(relationship._path).eql(user.pets);
    });

    it('caches allowed discriminators', function(){
      should(relationship._allowed_discriminators.sort()).eql(['Pet', 'Dog', 'Fish'].sort());
    });

    it('knows the relationship of the child to the parent', function(){
      var definition = relationship._childToParent;
      should(definition.name).eql('users');
      should(definition.relationshipModel).eql('User');
      should(definition.relationshipType).eql('habtm');
    });

    it('caches a reference to the parent of the relationship', function(){
      should(relationship._parent.constructor.modelName).eql('User');
      should(relationship._parentModelName).eql('User');
    });

    it('caches the name of the child base model', function(){
      should(relationship._childModelName).eql('Pet');
    });
  });
});
