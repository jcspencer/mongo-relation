var start = require('./common')
  , should = require('should')
  , mongoose = start.mongoose
  , random = require('../lib/utils').random
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , relationships = require('../index');

/**
 * Blog Post Schema
 * "has many categories & belongs to one author"
 */
var PostSchema = new Schema({
    title      : String
  , body       : Number
  , author     : ObjectId
});

/**
 * User Schema
 * "has many posts"
 */
var UserSchema = new Schema({
    name      : String
  , someArray : [ObjectId]
});

/**
 * Tag Schema
 * "belongs to user"
 */

var TagSchema = new Schema({
  name : String
});

/**
 * Attach the plugin to the schemas
 */
PostSchema.belongsTo('User', {through: "author"});
UserSchema.hasMany('Post', {dependent: "delete"});
UserSchema.hasMany('Tag', {dependent: "nullify"});
TagSchema.belongsTo('User');

/**
 * Register the models with Mongoose
 */
mongoose.model('Post', PostSchema);
mongoose.model('User', UserSchema);
mongoose.model('Tag', TagSchema);

var posts = 'posts_' + random()
  , users = 'users_' + random()
  , tags = 'tags_' + random();

/**
 * Tests
 */

module.exports = {
  
  'test parent schema hasMany path': function() {
    UserSchema.paths['posts'].options.hasMany.should.equal('Post');
  },
  
  'test child schema belongsTo path': function() {
    PostSchema.paths['author'].options.belongsTo.should.equal('User');
  },
  
  'test presence of added methods to the MongooseArray': function() {
    var db = start()
      , User = db.model('User', users)
      , user = new User();

    user.posts.should.respondTo('create');
    user.posts.should.respondTo('find');
    user.posts.should.respondTo('populate');
    user.posts.should.respondTo('remove');
    user.posts.should.respondTo('append');
    user.posts.should.respondTo('concat');
    
    db.close()
  },
  
  'test instantiate one child document': function(){
    var db = start()
      , User = db.model('User', users)
      , Post = db.model('Post', posts)
      , user = new User();
    
    var post = {title: "Easy relationships with mongoose-relationships"};
    
    var built = user.posts.build(post);
    
    built.should.be.an.instanceof(Post);
    built.author.should.eql(user._id);
    
    user.posts.should.have.length(1);
    
    db.close();
  },
  
  'test instantiate many children documents': function() {
    var db = start()
      , User = db.model('User', users)
      , Post = db.model('Post', posts)
      , user = new User();
    
    var posts = [{}, {}];
    
    var built = user.posts.build(posts);
    
    built.forEach(function(post){
      post.should.be.an.instanceof(Post);
      post.author.should.eql(user._id);
    });
    
    user.posts.should.have.length(2);
    
    db.close();
  },
  
  'test appending an instantiated child document': function() {
    var db = start()
      , User = db.model('User', users)
      , Post = db.model('Post', posts)
      , user = new User()
      , post = new Post();
    
    user.posts.append(post, function(err, post){
      should.strictEqual(err, null);
      
      post.author.should.eql(user._id);
      user.posts.should.contain(post._id);
      
      db.close();
    });
  },
  
  'test concating many instantiated child documents': function() {
    var db = start()
      , User = db.model('User', users)
      , Post = db.model('Post', posts)
      , user = new User()
      , posts = [new Post(), new Post()];
    
    user.posts.concat(posts, function(err, posts){
      should.strictEqual(err, null);
      
      posts.forEach(function(post){
        post.author.should.eql(user._id);
        user.posts.should.contain(post._id);
      });
      
      db.close();
    });
  },
  
  'test create one child document': function() {
    var db = start()
      , User = db.model('User', users)
      , Post = db.model('Post', posts)
      , user = new User();
    
    var post = {title: "Easy relationships with mongoose-relationships"};
    
    user.posts.create(post, function(err, user, post){
      should.strictEqual(err, null);
      
      user.should.be.an.instanceof(User);
      user.posts.should.have.length(1);

      user.posts[0].should.equal(post._id);
      
      post.should.be.an.instanceof(Post);
      post.title.should.equal("Easy relationships with mongoose-relationships")
      post.author.should.equal(user._id);
      
      db.close();
    });
  },
  
  'test create many children documents': function(){
    var db = start()
      , User = db.model('User', users)
      , Post = db.model('Post', posts)
      , user = new User();
    
    var posts = [
        {title: "Blog post #1"}
      , {title: "Blog post #2"}
    ]
    
    user.posts.create(posts, function(err, user, posts){
      should.strictEqual(err, null);
      
      user.posts.should.have.length(2);
      
      posts.should.have.length(2);
      posts.forEach(function(post){
        user.posts.should.contain(post._id)
        post.should.be.an.instanceof(Post);
        post.author.should.equal(user._id);
      });
      
      db.close();
    });
  },
  
  'test find children documents': function(){
    var db = start()
      , User = db.model('User', users)
      , Post = db.model('Post', posts)
      , user = new User();
    
    var posts = [
        {title: "Blog post #1"}
      , {title: "Blog post #2"}
    ]
    
    user.posts.create(posts, function(err, user, posts){
      var find = user.posts.find({}, function(err, newPosts){
        should.strictEqual(err, null);
        
        find.should.be.an.instanceof(mongoose.Query);
        find._conditions.should.have.property('_id');
        find._conditions.should.have.property('author');
        find._conditions._id['$in'].should.be.an.instanceof(Array);
        
        newPosts.should.have.length(2);
        newPosts.forEach(function(post){
          user.posts.should.contain(post._id)
          post.should.be.an.instanceof(Post);
          post.author.should.eql(user._id);
        });
        
        find.find({title: "Blog post #1"}, function(err, otherPosts){
          find._conditions.title.should.equal("Blog post #1");
          find._conditions.should.have.property('_id');
          
          otherPosts.should.have.length(1);
          
          var post = otherPosts[0];
          post.title.should.equal("Blog post #1");
          
          db.close();
          
        });
      });
    });
  },
  
  'test dependent delete': function(){
    var db = start()
      , User = db.model('User', users)
      , Post = db.model('Post', posts)
      , user = new User();
    
    var posts = [
        {title: "Blog post #1"}
      , {title: "Blog post #2"}
    ]
    
    user.posts.create(posts, function(err, user, posts){
      var post = posts[0];
      user.posts.remove(post._id, function(err, user){
        should.strictEqual(err, null);
        
        user.posts.should.not.contain(post._id);
        user.posts.should.have.length(1);
        
        // Post, be gone!
        Post.findById(post._id, function(err, post){
          should.strictEqual(err, null);
          should.not.exist(post);
          db.close();
        });
      });
    });
  },
  
  'test dependent nullify': function(){
    var db = start()
      , User = db.model('User', users)
      , Tag = db.model('Tag', tags)
      , user = new User();
    
    var tags = [
        {name: "awesome"}
      , {name: "omgbbq"}
    ]
    
    user.tags.create(tags, function(err, user, tags){
      var tag = tags[0];
      user.tags.remove(tag._id, function(err, user){
        should.strictEqual(err, null);
        
        user.tags.should.not.contain(tag._id);
        user.tags.should.have.length(1);
        
        // Post, be nullified!
        Tag.findById(tag._id, function(err, tag){
          should.strictEqual(err, null);
          should.not.exist(tag.user);
          db.close();
        });
      });
    });
  },
  
  'test population of path': function(){
    var db = start()
      , User = db.model('User', users)
      , Post = db.model('Post', posts)
      , user = new User();
    
    var posts = [
        {title: "Blog post #1"}
      , {title: "Blog post #2"}
    ]
    
    user.posts.create(posts, function(err, user, posts){
      user.save(function(err, user){
        User
          .findById(user._id)
          .populate('posts')
          .run(function(err, populatedUser){
            should.strictEqual(err, null);
            
            populatedUser.posts.forEach(function(post){
              post.should.be.an.instanceof(Post);
            });
            
            // Syntactic sugar
            user.posts.populate(function(err, user){
              should.strictEqual(err, null);

              user.posts.forEach(function(post){
                post.should.be.an.instanceof(Post);
              });
              db.close();
            });
          });
      });
    });
  }
};



