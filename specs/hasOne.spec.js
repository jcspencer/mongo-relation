require('./spec_helper');

var mongoose = require('mongoose'),
    should   = require('should'),
    User     = require('./support/userModel'),
    Tweet    = require('./support/tweetModel'),
    Tag      = require('./support/tagModel'),
    Post     = require('./support/postModel');

describe('hasOne', function() {
  it('adds the belongsTo path to the child schema', function() {
    Tweet.schema.paths.author.options.belongsTo.should.equal('User');
  });

  it('adds the belongsTo path to the child schema', function() {
    Post.schema.paths.editor.options.belongsTo.should.equal('User');
  });

  it('adds the hasOne path to the parent schema', function() {
    User.schema.paths.post.options.hasOne.should.equal('Post');
  });

  it.skip('has a create function on the association', function() {
    var user = new User();
    user.post.create.should.be.a.Function;
  });

  it.skip('creates a child document', function(done){
    var user = new User(),
        post = { title: 'Deep thinking, by a mongoose.' };

    user.post.create(post, function(err, user, post){
      should.strictEqual(err, null);

      user.should.be.an.instanceof(user);
      post.should.be.an.instanceof(post);

      user.post.should.eql(post._id);
      post.editor.should.equal(user._id);

      post.title.should.equal('Deep thinking, by a mongoose.');
      done();
    });
  });

  it.skip('finds the child document', function(done){
    var user = new User(),
        post = { title: 'Deep thinking, by a mongoose.'};

    user.post.create(post, function(err, user, post){
      var find = user.post.find(function(err, newPost){
        should.strictEqual(err, null);

        find.should.be.an.instanceof(mongoose.Query);
        find._conditions.should.have.property('_id');
        find._conditions.should.have.property('editor');
        find.op.should.equal('findOne');

        user.post.should.equal(newPost._id);

        newPost.should.be.an.instanceof(post);
        newPost.editor.should.eql(user._id);
        done();
      });
    });
  });
});
