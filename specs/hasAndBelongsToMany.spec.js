require('./');

let mongoose    = require('mongoose'),
    should      = require('should'),
    TwitterUser = require('./support/twitterUserModel'),
    Pet         = require('./support/petModel')
    Dog         = require('./support/dogModel')
    Fish        = require('./support/fishModel')
    TwitterPost = require('./support/twitterPostModel'),
    Category    = require('./support/categoryModel'),
    Tweet       = require('./support/tweetModel'),
    Tag         = require('./support/tagModel'),
    BookSchema  = new mongoose.Schema({});

describe('hasManyBelongsToMany', function() {
  describe('valid options', function() {
    it("cannot set 'dependent:nullify' and 'setChild:false'", function(){
      (function(){
        BookSchema.habtm('Page', { setChild: false, dependent: 'nullify' });
      }).should.throw(Error, /dependent cannot be set to 'nullify' while setChild is false/)
    });

    it("cannot set 'dependent:destroy' and 'setChild:false'", function(){
      (function(){
        BookSchema.habtm('Page', { setChild: false, dependent: 'destroy' });
      }).should.throw(Error, /dependent cannot be set to 'destroy' while setChild is false/)
    });
  });

  it('has habtm on the path', function() {
    Category.schema.paths.posts.options.habtm.should.equal('TwitterPost');
  });

  it('test child schema habtm path', function() {
    TwitterPost.schema.paths.categories.options.habtm.should.equal('Category');
  });

  it('test presence of added methods to the MongooseArray', function() {
    let category = new Category(),
        post     = new TwitterPost();

    should(category.posts.create).be.a.Function;
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

  describe('setChild true', function(){
    it('instantiates one child document', function(){
      let category = new Category(),
          post = { title: 'Easy relationships with mongoose-relationships' };

      let built = category.posts.build(post);

      built.should.be.an.instanceof(TwitterPost);
      built.categories.should.containEql(category._id);
      category.posts.should.containEql(built._id);

      category.posts.should.have.length(1);
    });

    it('instantiates many children documents', function(done) {
      let category = new Category(),
          posts    = [{}, {}];

      let built = category.posts.build(posts);

      category.posts.should.have.length(2);

      let count = category.posts.length;
      built.forEach(function(post){
        post.should.be.an.instanceof(TwitterPost);
        post.categories.should.containEql(category._id);
        category.posts.should.containEql(post._id);
        --count || done();
      });
    });

    it('appends an instantiated child document', function(done) {
      let category = new Category(),
          post     = new TwitterPost();

      category.posts.append(post, function(err, post){
        should.strictEqual(err, null);

        post.categories.should.containEql(category._id);
        category.posts.should.containEql(post._id);

        done();
      });
    });

    it('concatenates many instantiated child documents', function(done) {
      let category = new Category(),
          posts    = [new TwitterPost(), new TwitterPost()];

      category.posts.concat(posts, function(err, posts){
        should.strictEqual(err, null);

        let count = posts.length;
        posts.forEach(function(post){
          post.categories.should.containEql(category._id);
          category.posts.should.containEql(post._id);
          --count || done();
        });
      });
    });

    it('creates one child document', function(done) {
      let category = new Category(),
          post = { title: 'Easy relationships with mongoose-relationships' };

      category.posts.create(post, function(err, category, post){
        should.strictEqual(err, null);

        category.should.be.an.instanceof(Category);
        category.posts.should.have.length(1);

        category.posts[0].should.equal(post._id);

        post.should.be.an.instanceof(TwitterPost);
        post.title.should.equal('Easy relationships with mongoose-relationships')
        post.categories.should.containEql(category._id);

        done();
      });
    });

    it('creates many child documents', function(done){
      let category = new Category();
          posts    = [ { title: 'Blog post #1' },
                       { title: 'Blog post #2' } ]

      category.posts.create(posts, function(err, category, posts){
        should.strictEqual(err, null);

        category.posts.should.have.length(2);

        posts.should.have.length(2);

        let count = posts.length;
        posts.forEach(function(post){
          category.posts.should.containEql(post._id)
          post.should.be.an.instanceof(TwitterPost);
          post.categories.should.containEql(category._id);
          --count || done();
        });
      });
    });

    it('finds children documents', function(done){
      let category = new Category(),
          posts    = [ { title: 'Blog post #1' },
                       { title: 'Blog post #2' } ]

      category.posts.create(posts, function(err, category, posts){
        let firstFind = category.posts.find({})

        firstFind.should.be.an.instanceof(mongoose.Query);
        firstFind._conditions.should.have.property('_id');
        firstFind._conditions.should.have.property('categories');
        firstFind._conditions._id['$in'].should.be.an.instanceof(Array);

        firstFind.exec(function(err, newTwitterPosts){
          should.strictEqual(err, null);

          newTwitterPosts.should.have.length(2);
          newTwitterPosts.forEach(function(post){
            category.posts.should.containEql(post._id)
            post.should.be.an.instanceof(TwitterPost);
            post.categories.should.containEql(category._id);
          });

          let secondFind = firstFind.find({ title: 'Blog post #1' }, function(err, otherTwitterPosts){
            secondFind._conditions.title.should.equal('Blog post #1');
            secondFind._conditions.should.have.property('_id');

            otherTwitterPosts.should.have.length(1);
            otherTwitterPosts[0].title.should.equal('Blog post #1');

            done();
          });
        });
      });
    });

    it('deletes dependent', function(done){
      let category = new Category(),
          posts    = [ { title: 'Blog post #1' },
                       { title: 'Blog post #2' } ]

      category.posts.create(posts, function(err, category, posts){
        let post = posts[0];

        category.posts.remove(post._id, function(err, category){
          should.strictEqual(err, null);

          category.posts.should.not.containEql(post._id);
          category.posts.should.have.length(1);

          // TwitterPost, should still exist, this is HABTM
          TwitterPost.findById(post._id, function(err, post){
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
      let category = new Category(),
           posts = [ { title: 'Blog post #1' },
                     { title: 'Blog post #2' } ];

      category.posts.create(posts, function(err, category, posts){
        category.save(function(err, category){
          Category.findById(category._id).populate('posts').exec(function(err, populatedCategory){
            should.strictEqual(err, null);

            // Syntactic sugar
            let testSugar = function(){
              category.posts.populate(function(err, category){
                should.strictEqual(err, null);

                category.posts.forEach(function(post){
                  post.should.be.an.instanceof(TwitterPost);
                });

                done();
              });
            };

            let count = populatedCategory.posts.length;
            populatedCategory.posts.forEach(function(post){
              post.should.be.an.instanceof(TwitterPost);
            });
            testSugar();
          });
        });
      });
    });
  });

  describe('setChild false', function(){
    it('instantiates one child document', function(){
      let tweet = new Tweet(),
          tag = { name: 'Easy' };

      let built = tweet.tags.build(tag);

      built.should.be.an.instanceof(Tag);
      tweet.tags.should.containEql(built._id);
      should(tag.tweets).eql(undefined)
    });

    it('instantiates many children documents', function(done) {
      let tweet = new Tweet(),
          tags  = [{}, {}];

      let built = tweet.tags.build(tags);

      tweet.tags.should.have.length(2);

      let count = tweet.tags.length;
      built.forEach(function(tag){
        tag.should.be.an.instanceof(Tag);
        should(tag.tweets).eql(undefined);
        tweet.tags.should.containEql(tag._id);
        --count || done();
      });
    });

    it('appends an instantiated child document', function(done) {
      let tweet = new Tweet(),
          tag   = new Tag();

      tweet.tags.append(tag, function(err, tag){
        should.strictEqual(err, null);
        should(tag.tweets).eql(undefined);
        tweet.tags.should.containEql(tag._id);
        done();
      });
    });

    it('concats many instantiated child documents', function(done) {
      let tweet = new Tweet(),
          tags  = [new Tag(), new Tag()];

      tweet.tags.concat(tags, function(err, tags){
        should.strictEqual(err, null);

        let count = tags.length;
        tags.forEach(function(tag){
          should(tag.tweets).eql(undefined);
          tweet.tags.should.containEql(tag._id);
          --count || done();
        });
      });
    });

    it('creates one child document', function(done) {
      let tweet = new Tweet({ author: new TwitterUser() }),
          tag = { name: 'Easy' };

      tweet.tags.create(tag, function(err, tweet, tag){
        should.strictEqual(err, null);

        tweet.should.be.an.instanceof(Tweet);
        tweet.tags.should.have.length(1);
        tweet.tags[0].should.equal(tag._id);

        tag.should.be.an.instanceof(Tag);
        tag.name.should.equal('Easy')
        should(tag.tweets).eql(undefined);

        done();
      });
    });

    it('creates many child documents', function(done){
      let tweet = new Tweet({ author: new TwitterUser()});
          tags    = [ { name: 'Blog tag #1' },
                      { name: 'Blog tag #2' } ]

      tweet.tags.create(tags, function(err, tweet, tags){
        should.strictEqual(err, null);

        tweet.tags.should.have.length(2);

        tags.should.have.length(2);

        let count = tags.length;
        tags.forEach(function(tag){
          tweet.tags.should.containEql(tag._id)
          tag.should.be.an.instanceof(Tag);
          should(tag.categories).eql(undefined);
          --count || done();
        });
      });
    });

    it('finds children documents', function(done){
      let tweet = new Tweet({ author: new TwitterUser()}),
          tags  = [ { name: 'Blog tag #1' },
                    { name: 'Blog tag #2' } ]

      tweet.tags.create(tags, function(err, tweet, tags){
        should.strictEqual(err, null);

        let find = tweet.tags.find({})

        find.should.be.an.instanceof(mongoose.Query);
        find._conditions.should.have.property('_id');
        find._conditions.should.not.have.property('tags');
        find._conditions._id['$in'].should.be.an.instanceof(Array);

        find.exec(function(err, newTags){
          should.strictEqual(err, null);

          let testFind = function(){
            find.find({name: 'Blog tag #1'}, function(err, otherTags){
              find._conditions.name.should.equal('Blog tag #1');
              find._conditions.should.have.property('_id');

              otherTags.should.have.length(1);
              otherTags[0].name.should.equal('Blog tag #1');

              done();
            });
          };

          let count = newTags.length;
          newTags.should.have.length(2);
          newTags.forEach(function(tag){
            tweet.tags.should.containEql(tag._id)
            tag.should.be.an.instanceof(Tag);
            should(tag.categories).eql(undefined);
            --count || testFind();
          });
        });
      });
    });

    it('populations of path', function(done){
      let tweet = new Tweet({ author: new TwitterUser() }),
           tags = [ { name: 'Blog tag #1' },
                    { name: 'Blog tag #2' } ];

      tweet.tags.create(tags, function(err, tweet, tags){
        tweet.save(function(err, tweet){
          Tweet.findById(tweet._id).populate('tags').exec(function(err, populatedTweet){
            should.strictEqual(err, null);

            // Syntactic sugar
            let testSugar = function(){
              tweet.tags.populate(function(err, tweet){
                should.strictEqual(err, null);

                let count = tweet.tags.length;
                tweet.tags.forEach(function(tag){
                  tag.should.be.an.instanceof(Tag);
                  --count || done();
                });
              });
            };

            let count = populatedTweet.tags.length;
            populatedTweet.tags.forEach(function(tag){
              tag.should.be.an.instanceof(Tag);
              --count || testSugar();
            });
          });
        });
      });
    });
  });
});

describe('with descriminators', function(){
  let user, dog, fish;
  beforeEach(function(done){
    user = new TwitterUser();
    dog  = new Dog({ name: 'Maddie', date_of_birth: new Date('12/24/2005'), breed: 'Border Collie Mix' });
    fish = new Fish({ name: 'Dory', date_of_birth: new Date('5/30/2003') });
    user.save(done);
  });

  context('associating', function(){
    describe('#create', function(){
      it('creates the superclass', function(done){
        user.pets.create({}, function(err, user, pet){
          should(pet.__t).eql.undefined;
          pet.should.be.an.instanceof(Pet);
          done();
        });
      });

      it('creates a subclass', function(done){
        user.pets.create(dog, function(err, user, cDog){
          should.strictEqual(err, null);
          should(dog._id).eql(cDog._id);
          should(dog.__t).eql('Dog');
          should(dog.__t).eql(cDog.__t);
          done();
        });
      });
    });

    describe('#append', function(){
      it('appends an instantiated child document', function(done) {
        user.pets.append(fish, function(err, fish){
          should.strictEqual(err, null);
          user.pets.should.containEql(fish._id);
          should(fish.__t).eql('Fish');
          done();
        });
      });
    });

    describe('#concat', function(){
      it('concats a hertogenious set of child documents', function(done) {
        user.pets.concat([fish, dog], function(err, pets){
          should.strictEqual(err, null);

          user.pets.should.containEql(fish._id);
          should(pets[0].__t).eql('Fish');

          user.pets.should.containEql(dog._id);
          should(pets[1].__t).eql('Dog');
          done();
        });
      });
    });
  });

  context('already associated', function(){
    beforeEach(function(done){
      user.pets.concat([fish, dog], function(err){
        user.save(done);
      });
    });

    describe('#find', function(){
      it('finds pets from the parent model with the correct type', function(done) {
        user.pets.find({ _id: fish }).findOne(function(err, foundFish){
          should(foundFish._id).eql(fish._id);
          should(foundFish.__t).eql('Fish');

          user.pets.find({ _id: dog }).findOne(function(err, foundDog){
            should(foundDog._id).eql(dog._id);
            should(foundDog.__t).eql('Dog');
            done();
          });
        });
      });
    });

    describe('#populate', function(){
      it('populates pets from the parent model with the correct type', function(done) {
        user.pets.populate(function(err, user){
          should.strictEqual(err, null);
          let foundFish, foundDog;

          user.pets.forEach(function(pet){
            if(pet.id == fish.id){ foundFish = pet };
          });

          should.exist(foundFish);
          should(foundFish.__t).eql('Fish');

          user.pets.forEach(function(pet){
            if(pet.id == dog.id){ foundDog = pet };
          });

          should.exist(foundDog);
          should(foundDog.__t).eql('Dog');

          done();
        });
      });
    });

    describe('#delete', function(){
      it('removes pet from the parent model', function(done) {
        user.pets.delete(fish, function(err, user){
          user.save(function(err, user){
            TwitterUser.findById(user.id, function(err, foundTwitterUser){
              should(foundTwitterUser.pets).not.containEql(fish._id);
              done();
            });
          });
        });
      });
    });
  });
});
