require('./spec_helper');

var mongoose = require('mongoose'),
    should   = require('should'),
    User     = require('./support/userModel'),
    Post     = require('./support/postModel'),
    Category = require('./support/categoryModel');

describe('hasManyBelongsToMany', function() {

  it('has hasMany on the path', function() {
    Category.schema.paths['posts'].options.habtm.should.equal('Post');
  });

  it('test child schema habtm path', function() {
    Post.schema.paths['categories'].options.habtm.should.equal('Category');
  });

  it('test presence of added methods to the MongooseArray', function() {
    var category = new Category(),
        post     = new Post();

    category.posts.create.should.be.a.Function;
    post.categories.create.should.be.a.Function;

    category.posts.find.should.be.a.Function;
    post.categories.find.should.be.a.Function;

    category.posts.populate.should.be.a.Function;
    post.categories.populate.should.be.a.Function;

    category.posts.remove.should.be.a.Function;
    post.categories.remove.should.be.a.Function;

    category.posts.append.should.be.a.Function;
    post.categories.append.should.be.a.Function;

    category.posts.concat.should.be.a.Function;
    post.categories.concat.should.be.a.Function;
  });

  it('instantiates one child document', function(){
    var category = new Category(),
        post = { title: 'Easy relationships with mongoose-relationships' };

    var built = category.posts.build(post);

    built.should.be.an.instanceof(Post);
    built.categories.should.containEql(category._id);
    category.posts.should.containEql(built._id);

    category.posts.should.have.length(1);
  });

  it('instantiates many children documents', function(done) {
    var category = new Category(),
        posts    = [{}, {}];

    var built = category.posts.build(posts);

    category.posts.should.have.length(2);

    var count = category.posts.length;
    built.forEach(function(post){
      post.should.be.an.instanceof(Post);
      post.categories.should.containEql(category._id);
      category.posts.should.containEql(post._id);
      --count || done();
    });
  });

  it('appends an instantiated child document', function(done) {
    var category = new Category(),
        post     = new Post();

    category.posts.append(post, function(err, post){
      should.strictEqual(err, null);

      post.categories.should.containEql(category._id);
      category.posts.should.containEql(post._id);

      done();
    });
  });

  it('concates many instantiated child documents', function(done) {
    var category = new Category(),
        posts    = [new Post(), new Post()];

    category.posts.concat(posts, function(err, posts){
      should.strictEqual(err, null);

      var count = posts.length;
      posts.forEach(function(post){
        post.categories.should.containEql(category._id);
        category.posts.should.containEql(post._id);
        --count || done();
      });
    });
  });

  it('creates one child document', function(done) {
    var category = new Category(),
        post = { title: 'Easy relationships with mongoose-relationships' };

    category.posts.create(post, function(err, category, post){
      should.strictEqual(err, null);

      category.should.be.an.instanceof(Category);
      category.posts.should.have.length(1);

      category.posts[0].should.equal(post._id);

      post.should.be.an.instanceof(Post);
      post.title.should.equal('Easy relationships with mongoose-relationships')
      post.categories.should.containEql(category._id);

      done();
    });
  });

  it('creates many child documents', function(done){
    var category = new Category();
        posts    = [ { title: 'Blog post #1' },
                     { title: 'Blog post #2' } ]

    category.posts.create(posts, function(err, category, posts){
      should.strictEqual(err, null);

      category.posts.should.have.length(2);

      posts.should.have.length(2);

      var count = posts.length;
      posts.forEach(function(post){
        category.posts.should.containEql(post._id)
        post.should.be.an.instanceof(Post);
        post.categories.should.containEql(category._id);
        --count || done();
      });
    });
  });

  it('finds children documents', function(done){
    var category = new Category(),
        posts    = [ { title: 'Blog post #1' },
                     { title: 'Blog post #2' } ]

    category.posts.create(posts, function(err, category, posts){
      var find = category.posts.find({}, function(err, newPosts){
        should.strictEqual(err, null);

        find.should.be.an.instanceof(mongoose.Query);
        find._conditions.should.have.property('_id');
        find._conditions.should.have.property('categories');
        find._conditions._id['$in'].should.be.an.instanceof(Array);

        var testFind = function(){
          find.find({title: 'Blog post #1'}, function(err, otherPosts){
            find._conditions.title.should.equal('Blog post #1');
            find._conditions.should.have.property('_id');

            otherPosts.should.have.length(1);
            otherPosts[0].title.should.equal('Blog post #1');

            done();
          });
        };

        var count = newPosts.length;
        newPosts.should.have.length(2);
        newPosts.forEach(function(post){
          category.posts.should.containEql(post._id)
          post.should.be.an.instanceof(Post);
          post.categories.should.containEql(category._id);
          --count || testFind();
        });
      });
    });
  });

  it('deletes dependent', function(done){
    var category = new Category(),
        posts    = [ { title: 'Blog post #1' },
                     { title: 'Blog post #2' } ]

    category.posts.create(posts, function(err, category, posts){
      var post = posts[0];

      category.posts.remove(post._id, function(err, category){
        should.strictEqual(err, null);

        category.posts.should.not.containEql(post._id);
        category.posts.should.have.length(1);

        // Post, should still exist, this is HABTM
        Post.findById(post._id, function(err, post){
          should.strictEqual(err, null);

          should.exist(post);

          post.categories.should.not.containEql(category._id);
          post.categories.should.have.length(0);

          post.categories.create({}, function(err, post, category){

            post.categories.remove(category._id, function(err, post){
              should.strictEqual(err, null);

              // Deletes the category reference in the post
              post.categories.should.not.containEql(category._id);
              post.categories.should.have.length(0);

              // ... but shouldn't have in the category's post (no dependent: delete);
              Category.findById(category._id, function(err, category){
                should.strictEqual(err, null);

                category.posts.should.containEql(post._id);
                category.posts.should.have.length(1);

                done();
              });
            });
          });
        });
      });
    });
  });

  it('populations of path', function(done){
    var category = new Category(),
         posts = [ { title: 'Blog post #1' },
                   { title: 'Blog post #2' } ];

    category.posts.create(posts, function(err, category, posts){
      category.save(function(err, category){
        Category.findById(category._id).populate('posts').exec(function(err, populatedCategory){
          should.strictEqual(err, null);

          // Syntactic sugar
          var testSugar = function(){
            category.posts.populate(function(err, category){
              should.strictEqual(err, null);

              var count = category.posts.length;
              category.posts.forEach(function(post){
                post.should.be.an.instanceof(Post);
                --count || done();
              });
            });
          };

          var count = populatedCategory.posts.length;
          populatedCategory.posts.forEach(function(post){
            post.should.be.an.instanceof(Post);
            --count || testSugar();
          });
        });
      });
    });
  });
});
