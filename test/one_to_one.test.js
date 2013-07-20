var start = require('./common')
  , should = require('should')
  , mongoose = start.mongoose
  , random = require('../lib/utils').random
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , relationships = require('../index');

/**
 * Blog Schema
 * "belongs to one editor"
 */
var BlogSchema = new Schema({
    title      : String
  , editor     : ObjectId
});

/**
 * User Schema
 * "has one blog"
 */
var UserSchema = new Schema({
    name : String
  , blog : ObjectId
});

/**
 * Attach the plugin to the schemas
 */
BlogSchema.plugin(relationships, {
    belongsTo : "User"
  , through   : "editor"
});
UserSchema.plugin(relationships, {
    hasOne    : "Blog"
  , through   : "blog"
});

/**
 * Register the models with Mongoose
 */
mongoose.model('Blog', BlogSchema)
mongoose.model('User', UserSchema);

var blogs = 'blogs_' + random()
  , users = 'users_' + random();

/**
 * Tests
 */

module.exports = {

  'test parent schema hasOne path': function() {
    UserSchema.paths['blog'].options.hasOne.should.equal('Blog');
  },

  'test child schema belongsTo path': function() {
    BlogSchema.paths['editor'].options.belongsTo.should.equal('User');
  },

  'test presence of create method in parent document': function() {
    var db = start()
      , User = db.model('User', users)
      , user = new User();

    user.blog.should.respondTo('create');
    db.close()
  },

  'test create child document': function() {
    var db = start()
      , User = db.model('User', users)
      , Blog = db.model('Blog', blogs)
      , user = new User();

    var blog = {title: "Deep thinking, by a mongoose."};

    user.blog.create(blog, function(err, user, blog){
      should.strictEqual(err, null);

      user.should.be.an.instanceof(User);

      user.blog.should.eql(blog._id);

      blog.should.be.an.instanceof(Blog);
      blog.title.should.equal("Deep thinking, by a mongoose.");
      blog.editor.should.equal(user._id);

      db.close();
    });
  },

  'test find child document': function(){
    var db = start()
      , User = db.model('User', users)
      , Blog = db.model('Blog', blogs)
      , user = new User();

    var blog = {title: "Deep thinking, by a mongoose."};

    user.blog.create(blog, function(err, user, blog){
      var find = user.blog.find(function(err, newBlog){
        should.strictEqual(err, null);

        find.should.be.an.instanceof(mongoose.Query);
        find._conditions.should.have.property('_id');
        find._conditions.should.have.property('editor');
        find.op.should.equal('findOne');
        
        user.blog.should.equal(newBlog._id);
        newBlog.should.be.an.instanceof(Blog);
        newBlog.editor.should.eql(user._id);
        
        db.close()
      });
    });
  }
};