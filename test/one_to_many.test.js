var start = require('./common')
  , should = require('should')
  , mongoose = start.mongoose
  , random = require('../lib/utils').random
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , relationships = require('../index');

/**
 * Blog Tweet Schema
 * "has many categories & belongs to one author"
 */
var TweetSchema = new Schema({
    title      : String
  , body       : Number
  , author     : ObjectId
});

/**
 * Member Schema
 * "has many tweets"
 */
var MemberSchema = new Schema({
    name      : String
  , someArray : [ObjectId]
});

/**
 * Tag Schema
 * "belongs to member"
 */

var TagSchema = new Schema({
  name : String
});

/**
 * Attach the plugin to the schemas
 */
TweetSchema.belongsTo('Member', {through: "author"});
MemberSchema.hasMany('Tweet', {dependent: "delete"});
MemberSchema.hasMany('Tag', {dependent: "nullify"});
TagSchema.belongsTo('Member');

/**
 * Register the models with Mongoose
 */
mongoose.model('Tweet', TweetSchema);
mongoose.model('Member', MemberSchema);
mongoose.model('Tag', TagSchema);

var tweets = 'tweets_' + random()
  , members = 'members_' + random()
  , tags = 'tags_' + random();

/**
 * Tests
 */

module.exports = {
  
  'test parent schema hasMany path': function() {
    MemberSchema.paths['tweets'].options.hasMany.should.equal('Tweet');
  },
  
  'test child schema belongsTo path': function() {
    TweetSchema.paths['author'].options.belongsTo.should.equal('Member');
  },
  
  'test presence of added methods to the MongooseArray': function() {
    var db = start()
      , Member = db.model('Member', members)
      , member = new Member();

    member.tweets.create.should.be.a.Function;
    member.tweets.find.should.be.a.Function;
    member.tweets.populate.should.be.a.Function;
    member.tweets.remove.should.be.a.Function;
    member.tweets.append.should.be.a.Function;
    member.tweets.concat.should.be.a.Function;
    
    db.close()
  },
  
  'test instantiate one child document': function(){
    var db = start()
      , Member = db.model('Member', members)
      , Tweet = db.model('Tweet', tweets)
      , member = new Member();
    
    var tweet = {title: "Easy relationships with mongoose-relationships"};
    
    var built = member.tweets.build(tweet);
    
    built.should.be.an.instanceof(Tweet);
    built.author.should.eql(member._id);
    
    member.tweets.should.have.length(1);
    
    db.close();
  },
  
  'test instantiate many children documents': function() {
    var db = start()
      , Member = db.model('Member', members)
      , Tweet = db.model('Tweet', tweets)
      , member = new Member();
    
    var tweets = [{}, {}];
    
    var built = member.tweets.build(tweets);
    
    built.forEach(function(tweet){
      tweet.should.be.an.instanceof(Tweet);
      tweet.author.should.eql(member._id);
    });
    
    member.tweets.should.have.length(2);
    
    db.close();
  },
  
  'test appending an instantiated child document': function() {
    var db = start()
      , Member = db.model('Member', members)
      , Tweet = db.model('Tweet', tweets)
      , member = new Member()
      , tweet = new Tweet();
    
    member.tweets.append(tweet, function(err, tweet){
      should.strictEqual(err, null);
      
      tweet.author.should.eql(member._id);
      member.tweets.should.containEql(tweet._id);
      
      db.close();
    });
  },
  
  'test concating many instantiated child documents': function() {
    var db = start()
      , Member = db.model('Member', members)
      , Tweet = db.model('Tweet', tweets)
      , member = new Member()
      , tweets = [new Tweet(), new Tweet()];
    
    member.tweets.concat(tweets, function(err, tweets){
      should.strictEqual(err, null);
      
      tweets.forEach(function(tweet){
        tweet.author.should.eql(member._id);
        member.tweets.should.containEql(tweet._id);
      });
      
      db.close();
    });
  },
  
  'test create one child document': function() {
    var db = start()
      , Member = db.model('Member', members)
      , Tweet = db.model('Tweet', tweets)
      , member = new Member();
    
    var tweet = {title: "Easy relationships with mongoose-relationships"};
    
    member.tweets.create(tweet, function(err, member, tweet){
      should.strictEqual(err, null);
      
      member.should.be.an.instanceof(Member);
      member.tweets.should.have.length(1);

      member.tweets[0].should.equal(tweet._id);
      
      tweet.should.be.an.instanceof(Tweet);
      tweet.title.should.equal("Easy relationships with mongoose-relationships")
      tweet.author.should.equal(member._id);
      
      db.close();
    });
  },
  
  'test create many children documents': function(){
    var db = start()
      , Member = db.model('Member', members)
      , Tweet = db.model('Tweet', tweets)
      , member = new Member();
    
    var tweets = [
        {title: "Blog tweet #1"}
      , {title: "Blog tweet #2"}
    ]
    
    member.tweets.create(tweets, function(err, member, tweets){
      should.strictEqual(err, null);
      
      member.tweets.should.have.length(2);
      
      tweets.should.have.length(2);
      tweets.forEach(function(tweet){
        member.tweets.should.containEql(tweet._id)
        tweet.should.be.an.instanceof(Tweet);
        tweet.author.should.equal(member._id);
      });
      
      db.close();
    });
  },
  
  'test find children documents': function(){
    var db = start()
      , Member = db.model('Member', members)
      , Tweet = db.model('Tweet', tweets)
      , member = new Member();
    
    var tweets = [
        {title: "Blog tweet #1"}
      , {title: "Blog tweet #2"}
    ]
    
    member.tweets.create(tweets, function(err, member, tweets){
      var find = member.tweets.find({}, function(err, newTweets){
        should.strictEqual(err, null);
        
        find.should.be.an.instanceof(mongoose.Query);
        find._conditions.should.have.property('_id');
        find._conditions.should.have.property('author');
        find._conditions._id['$in'].should.be.an.instanceof(Array);
        
        newTweets.should.have.length(2);
        newTweets.forEach(function(tweet){
          member.tweets.should.containEql(tweet._id)
          tweet.should.be.an.instanceof(Tweet);
          tweet.author.should.eql(member._id);
        });
        
        find.find({title: "Blog tweet #1"}, function(err, otherTweets){
          find._conditions.title.should.equal("Blog tweet #1");
          find._conditions.should.have.property('_id');
          
          otherTweets.should.have.length(1);
          
          var tweet = otherTweets[0];
          tweet.title.should.equal("Blog tweet #1");
          
          db.close();
          
        });
      });
    });
  },
  
  'test dependent delete': function(){
    var db = start()
      , Member = db.model('Member', members)
      , Tweet = db.model('Tweet', tweets)
      , member = new Member();
    
    var tweets = [
        {title: "Blog tweet #1"}
      , {title: "Blog tweet #2"}
    ]
    
    member.tweets.create(tweets, function(err, member, tweets){
      var tweet = tweets[0];
      member.tweets.remove(tweet._id, function(err, member){
        should.strictEqual(err, null);
        
        member.tweets.should.not.containEql(tweet._id);
        member.tweets.should.have.length(1);
        
        // Tweet, be gone!
        Tweet.findById(tweet._id, function(err, tweet){
          should.strictEqual(err, null);
          should.not.exist(tweet);
          db.close();
        });
      });
    });
  },
  
  'test dependent nullify': function(){
    var db = start()
      , Member = db.model('Member', members)
      , Tag = db.model('Tag', tags)
      , member = new Member();
    
    var tags = [
        {name: "awesome"}
      , {name: "omgbbq"}
    ]
    
    member.tags.create(tags, function(err, member, tags){
      var tag = tags[0];
      member.tags.remove(tag._id, function(err, member){
        should.strictEqual(err, null);
        
        member.tags.should.not.containEql(tag._id);
        member.tags.should.have.length(1);
        
        // Tweet, be nullified!
        Tag.findById(tag._id, function(err, tag){
          should.strictEqual(err, null);
          should.not.exist(tag.member);
          db.close();
        });
      });
    });
  },
  
  'test population of path': function(){
    var db = start()
      , Member = db.model('Member', members)
      , Tweet = db.model('Tweet', tweets)
      , member = new Member();
    
    var tweets = [
        {title: "Blog tweet #1"}
      , {title: "Blog tweet #2"}
    ]
    
    member.tweets.create(tweets, function(err, member, tweets){
      member.save(function(err, member){
        Member
          .findById(member._id)
          .populate('tweets')
          .exec(function(err, populatedMember){
            should.strictEqual(err, null);
            
            populatedMember.tweets.forEach(function(tweet){
              tweet.should.be.an.instanceof(Tweet);
            });
            
            // Syntactic sugar
            member.tweets.populate(function(err, member){
              should.strictEqual(err, null);

              member.tweets.forEach(function(tweet){
                tweet.should.be.an.instanceof(Tweet);
              });
              db.close();
            });
          });
      });
    });
  }
};



