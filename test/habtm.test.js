var start = require('./common')
  , should = require('should')
  , mongoose = start.mongoose
  , random = require('../lib/utils').random
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , relationships = require('../index');

/**
 * Post Schema
 * "has many categories & belongs to one author"
 */
var PostSchema = new Schema({
    title      : String
  , body       : Number
  , author     : ObjectId
  , categories : [ObjectId]
});

/**
 * Category Schema
 * "has many posts"
 */

var CategorySchema = new Schema({
    name: String
});

/**
 * User Schema
 * "has many posts"
 */
var UserSchema = new Schema({
    name  : String
  , posts : [ObjectId]
});

/**
 * Attach the plugin to the schemas
 */
PostSchema.belongsTo("User", {through: "author"});
PostSchema.habtm('Category'); // should not delete the reference

CategorySchema.habtm('Post', {dependent: 'delete'}); // should only delete the reference

/**
 * Register the models with Mongoose
 */
mongoose.model('Post', PostSchema)
mongoose.model('Category', CategorySchema)
mongoose.model('User', UserSchema);

var posts = 'posts_' + random()
  , users = 'users_' + random()
  , categories = 'categories_' + random();

/**
 * Tests
 */

module.exports = {

  'test parent schema habtm path': function() {
    CategorySchema.paths['posts'].options.habtm.should.equal('Post');
  },

  'test child schema habtm path': function() {
    PostSchema.paths['categories'].options.habtm.should.equal('Category');
  },

  'test presence of added methods to the MongooseArray': function() {
    var db = start()
      , Category = db.model('Category', categories)
      , category = new Category()
      , Post = db.model('Post', posts)
      , post = new Post();

    category.posts.should.respondTo('create');
    post.categories.should.respondTo('create');
    
    category.posts.should.respondTo('find');
    post.categories.should.respondTo('find');
    
    category.posts.should.respondTo('populate');
    post.categories.should.respondTo('populate');
    
    category.posts.should.respondTo('remove');
    post.categories.should.respondTo('remove');
    
    category.posts.should.respondTo('append');
    post.categories.should.respondTo('append');
    
    category.posts.should.respondTo('concat');
    post.categories.should.respondTo('concat');
    
    db.close()
  },
  
  'test instantiate one child document': function(){
    var db = start()
      , Category = db.model('Category', categories)
      , Post = db.model('Post', posts)
      , category = new Category();
    
    var post = {title: "Easy relationships with mongoose-relationships"};
    
    var built = category.posts.build(post);
    
    built.should.be.an.instanceof(Post);
    built.categories.should.contain(category._id);
    category.posts.should.contain(built._id);
    
    category.posts.should.have.length(1);
    
    db.close();
  },
  
  'test instantiate many children documents': function() {
    var db = start()
      , Category = db.model('Category', categories)
      , Post = db.model('Post', posts)
      , category = new Category();
    
    var posts = [{}, {}];
    
    var built = category.posts.build(posts);
    
    built.forEach(function(post){
      post.should.be.an.instanceof(Post);
      post.categories.should.contain(category._id);
      category.posts.should.contain(post._id);
    });
    
    category.posts.should.have.length(2);
    
    db.close();
  },

  'test appending an instantiated child document': function() {
    var db = start()
      , Category = db.model('Category', categories)
      , Post = db.model('Post', posts)
      , category = new Category()
      , post = new Post();
    
    category.posts.append(post, function(err, post){
      should.strictEqual(err, null);
      
      post.categories.should.contain(category._id);
      category.posts.should.contain(post._id);
      
      db.close();
    });
  },
  
  'test concating many instantiated child documents': function() {
    var db = start()
      , Category = db.model('Category', categories)
      , Post = db.model('Post', posts)
      , category = new Category()
      , posts = [new Post(), new Post()];
    
    category.posts.concat(posts, function(err, posts){
      should.strictEqual(err, null);
      
      posts.forEach(function(post){
        post.categories.should.contain(category._id);
        category.posts.should.contain(post._id);
      });
      
      db.close();
    });
  },
  

  'test create one child document': function() {
    var db = start()
      , Category = db.model('Category', categories)
      , category = new Category()
      , Post = db.model('Post', posts);

    var post = {title: "Easy relationships with mongoose-relationships"};

    category.posts.create(post, function(err, category, post){
      should.strictEqual(err, null);

      category.should.be.an.instanceof(Category);
      category.posts.should.have.length(1);

      category.posts[0].should.equal(post._id);

      post.should.be.an.instanceof(Post);
      post.title.should.equal("Easy relationships with mongoose-relationships")
      post.categories.should.contain(category._id);

      db.close();
    });
  },

  'test create many child documents': function(){
    var db = start()
      , Category = db.model('Category', categories)
      , category = new Category()
      , Post = db.model('Post', posts);

    var posts = [
        {title: "Blog post #1"}
      , {title: "Blog post #2"}
    ]

    category.posts.create(posts, function(err, category, posts){
      should.strictEqual(err, null);

      category.posts.should.have.length(2);

      posts.should.have.length(2);
      posts.forEach(function(post){
        category.posts.should.contain(post._id)
        post.should.be.an.instanceof(Post);
        post.categories.should.contain(category._id);
      });

      db.close();
    });
  },

  'test find children documents': function(){
    var db = start()
      , Category = db.model('Category', categories)
      , category = new Category()
      , Post = db.model('Post', posts);

    var posts = [
        {title: "Blog post #1"}
      , {title: "Blog post #2"}
    ]

    category.posts.create(posts, function(err, category, posts){
      var find = category.posts.find({}, function(err, newPosts){
        should.strictEqual(err, null);

        find.should.be.an.instanceof(mongoose.Query);
        find._conditions.should.have.property('_id');
        find._conditions.should.have.property('categories');
        find._conditions._id['$in'].should.be.an.instanceof(Array);

        newPosts.should.have.length(2);
        newPosts.forEach(function(post){
          category.posts.should.contain(post._id)
          post.should.be.an.instanceof(Post);
          post.categories.should.contain(category._id);
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
      , Category = db.model('Category', categories)
      , Post = db.model('Post', posts)
      , category = new Category()
    
    var posts = [
        {title: "Blog post #1"}
      , {title: "Blog post #2"}
    ]
    
    category.posts.create(posts, function(err, category, posts){
      var post = posts[0];
      category.posts.remove(post._id, function(err, category){
        should.strictEqual(err, null);
        
        category.posts.should.not.contain(post._id);
        category.posts.should.have.length(1);
        
        // Post, should still exist, this is HABTM
        Post.findById(post._id, function(err, post){
          
          should.strictEqual(err, null);

          should.exist(post);
          
          post.categories.should.not.contain(category._id);
          post.categories.should.have.length(0);
          
          post.categories.create({}, function(err, post, category){
            
            
            post.categories.remove(category._id, function(err, post){
              should.strictEqual(err, null);

              // Deletes the category reference in the post
              post.categories.should.not.contain(category._id);
              post.categories.should.have.length(0);

              // ... but shouldn't have in the category's post (no dependent: delete);
              Category.findById(category._id, function(err, category){
                should.strictEqual(err, null);

                category.posts.should.contain(post._id);
                category.posts.should.have.length(1);

                db.close();
              });
            });
            
          });
          
        });
      });
    });
  },
  
  'test population of path': function(){
    var db = start()
      , Category = db.model('Category', categories)
      , Post = db.model('Post', posts)
      , category = new Category()
    
    var posts = [
        {title: "Blog post #1"}
      , {title: "Blog post #2"}
    ]
    
    category.posts.create(posts, function(err, category, posts){
      category.save(function(err, category){
        Category
          .findById(category._id)
          .populate('posts')
          .run(function(err, populatedCategory){
            should.strictEqual(err, null);
            
            populatedCategory.posts.forEach(function(post){
              post.should.be.an.instanceof(Post);
            });
            
            // Syntactic sugar
            category.posts.populate(function(err, category){
              should.strictEqual(err, null);

              category.posts.forEach(function(post){
                post.should.be.an.instanceof(Post);
              });
              db.close();
            });
          });
      });
    });
  }
  
  
};