require('./spec_helper');

var mongoose = require('mongoose'),
    should   = require('should'),
    User     = require('./support/userModel'),
    Tweet    = require('./support/tweetModel'),
    Tag      = require('./support/tagModel');

describe('hasMany', function() {
  it('has hasMany on the path', function() {
    User.schema.paths.tweets.options.hasMany.should.equal('Tweet');
  });

  it('instantiates one child document', function() {
    var user  = new User({}),
        tweet = { title: 'Easy relationships with mongoose-relationships' };

    var built = user.tweets.build(tweet);

    built.should.be.an.instanceof(Tweet);
    built.author.should.eql(user._id);
    built.title.should.equal('Easy relationships with mongoose-relationships')

    user.tweets.should.have.length(1);
  });

  it('instantiates many children documents', function(done) {
    var user   = new User(),
        tweets = [{}, {}];

    var built = user.tweets.build(tweets);

    user.tweets.should.have.length(2);

    var count = built.length;
    built.forEach(function(tweet){
      tweet.should.be.an.instanceof(Tweet);
      tweet.author.should.eql(user._id);
      --count || done();
    });
  });

  it('appendes an instantiated child document', function(done) {
    var user  = new User(),
        tweet = new Tweet();

    user.tweets.append(tweet, function(err, tweet) {
      should.strictEqual(err, null);
      tweet.author.should.eql(user._id);
      user.tweets.should.containEql(tweet._id);
      done();
    });
  });

  it('concates many instantiated child documents', function(done) {
    var user   = new User(),
        tweets = [ new Tweet(), new Tweet() ];

    user.tweets.concat(tweets, function(err, tweets) {
      should.strictEqual(err, null);

      var count = tweets.length;
      tweets.forEach(function(tweet){
        tweet.author.should.eql(user._id);
        user.tweets.should.containEql(tweet._id);
        --count || done();
      });
    });
  });

  it('creates one child document', function(done) {
    var user  = new User(),
        tweet = { title: 'Easy relationships with mongoose-relationships' };

    user.tweets.create(tweet, function(err, user, tweet) {
      should.strictEqual(err, null);

      user.should.be.an.instanceof(User);
      user.tweets.should.have.length(1);
      user.tweets[0].should.equal(tweet._id);

      tweet.should.be.an.instanceof(Tweet);
      tweet.title.should.equal('Easy relationships with mongoose-relationships')
      tweet.author.should.equal(user._id);
      done();
    });
  });

  it('creates many children documents', function(done) {
    var user = new User(),
        tweets = [ { title: 'Blog tweet #1' },
                   { title: 'Blog tweet #2' } ];

    user.tweets.create(tweets, function(err, user, tweets) {
      should.strictEqual(err, null);

      user.tweets.should.have.length(2);
      tweets.should.have.length(2);

      var count = tweets.length;
      tweets.forEach(function(tweet) {
        user.tweets.should.containEql(tweet._id)
        tweet.should.be.an.instanceof(Tweet);
        tweet.author.should.equal(user._id);
        --count || done()
      });
    });
  });

  it('finds children documents', function(done) {
    var user   = new User(),
        tweets = [ { title: 'Blog tweet #1' },
                   { title: 'Blog tweet #2' } ]

    user.tweets.create(tweets, function(err, user, tweets) {
      var find = user.tweets.find({}, function(err, newTweets) {
        should.strictEqual(err, null);

        find.should.be.an.instanceof(mongoose.Query);
        find._conditions.should.have.property('_id');
        find._conditions.should.have.property('author');
        find._conditions._id['$in'].should.be.an.instanceof(Array);

        var search = function() {
          find.find({ title: 'Blog tweet #1' }, function(err, otherTweets) {
            find._conditions.title.should.equal('Blog tweet #1');
            find._conditions.should.have.property('_id');

            otherTweets.should.have.length(1);
            otherTweets[0].title.should.equal('Blog tweet #1');
            done();
          });
        };

        newTweets.should.have.length(2);

        var count = newTweets.length;
        newTweets.forEach(function(tweet) {
          user.tweets.should.containEql(tweet._id)
          tweet.should.be.an.instanceof(Tweet);
          tweet.author.should.eql(user._id);
          --count || search();
        });
      });
    });
  });

  it('deletes dependents', function(done) {
    var user   = new User(),
        tweets = [ { title: 'Blog tweet #1' },
                   { title: 'Blog tweet #2' } ];

    user.tweets.create(tweets, function(err, user, tweets){
      var tweet = tweets[0];
      user.tweets.remove(tweet._id, function(err, user){
        should.strictEqual(err, null);

        user.tweets.should.not.containEql(tweet._id);
        user.tweets.should.have.length(1);

        // Tweet, be gone!
        Tweet.findById(tweet._id, function(err, found){
          should.strictEqual(err, null);
          should.not.exist(found);
          done();
        });
      });
    });
  });

  it('nullifies dependents', function(done){
    var user = new User(),
        tags = [ { name: 'awesome' },
                 { name: 'omgbbq' } ];

    user.tags.create(tags, function(err, user, tags){
      var tag = tags[0];
      user.tags.remove(tag._id, function(err, user){
        should.strictEqual(err, null);

        user.tags.should.not.containEql(tag._id);
        user.tags.should.have.length(1);

        // Tweet, be nullified!
        Tag.findById(tag._id, function(err, tag){
          should.strictEqual(err, null);
          should.not.exist(tag.user);
          done();
        });
      });
    });
  });

  it('test population of path', function(done){
    var user   = new User(),
        tweets = [ { title: 'Blog tweet #1' },
                   { title: 'Blog tweet #2' } ];

    user.tweets.create(tweets, function(err, user, tweets){
      user.save(function(err, user){
        User.findById(user._id).populate('tweets').exec(function(err, populatedUser){
          should.strictEqual(err, null);

          var testSugar = function(){
            // Syntactic sugar
            user.tweets.populate(function(err, user){
              should.strictEqual(err, null);

              var count = user.tweets.length;
              user.tweets.forEach(function(tweet){
                tweet.should.be.an.instanceof(Tweet);
                --count || done();
              });
            });
          };

          var count = populatedUser.tweets.length;
          populatedUser.tweets.forEach(function(tweet){
            tweet.should.be.an.instanceof(Tweet);
            --count || testSugar();
          });
        });
      });
    });
  });
});
