require('./spec_helper');

var mongoose     = require('mongoose'),
    should       = require('should'),
    User         = require('./support/userModel'),
    Tweet        = require('./support/tweetModel'),
    Tag          = require('./support/tagModel'),
    Address      = require('./support/addressModel'),
    Notification = require('./support/notificationModel');

describe('hasMany', function() {
  describe('setup', function(){
    it('has hasMany on the path', function() {
      User.schema.paths.tweets.options.hasMany.should.equal('Tweet');
    });

    it('defaults setParent to true', function() {
      User.schema.paths.tweets.options.setParent.should.be.true
    });

    it('sets setParent on the path', function() {
      User.schema.paths.notifications.options.setParent.should.be.false
    });
  });

  describe('Child Relationship', function(){
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
  });

  describe('Parent Relationship', function(){
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

    it('appends one instantiated child document', function(done) {
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
        should.strictEqual(err, null);
        var find = user.tweets.find({});
        find.exec(function(err, newTweets) {
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

    it('deletes dependent child documents', function(done) {
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

    it('nullifies dependent child documents', function(done){
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

    it('populates child documents in path', function(done){
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

  describe('Parent Relationship when setParent is false', function(){
    describe('#create', function(){
      it('creates one child document', function(done) {
        var user         = new User(),
            notification = { message: 'Check out new relationships!' };

        user.notifications.create(notification, function(err, user, notification) {
          should.strictEqual(err, null);

          user.should.be.an.instanceof(User);
          notification.should.be.an.instanceof(Notification);
          notification.message.should.equal('Check out new relationships!')
          notification.user.should.equal(user._id);
          done();
        });
      });

      it('does not add the child id to the parent', function(done) {
        var user         = new User(),
            notification = { message: 'Check out new relationships!' };

        user.notifications.create(notification, function(err, user, notification) {
          should.strictEqual(err, null);
          user.notifications.should.have.length(0);
          user.notifications.should.be.empty;
          done();
        });
      });

      it('creates many children documents', function(done) {
        var user          = new User(),
            notifications = [ { message: 'Blog notification #1' },
                              { message: 'Blog notification #2' } ];

        user.notifications.create(notifications, function(err, user, notifications) {
          should.strictEqual(err, null);

          notifications.should.have.length(2);

          var count = notifications.length;
          notifications.forEach(function(notification) {
            notification.should.be.an.instanceof(Notification);
            notification.user.should.equal(user._id);
            --count || done()
          });
        });
      });

      it('does not add child ids to the parent', function(done) {
        var user          = new User(),
            notifications = [ { message: 'Blog notification #1' },
                              { message: 'Blog notification #2' } ];

        user.notifications.create(notifications, function(err, user, notifications) {
          should.strictEqual(err, null);

          user.notifications.should.have.length(0);
          var count = notifications.length;
          notifications.forEach(function(notification) {
            user.notifications.should.not.containEql(notification._id)
            --count || done()
          });
        });
      });
    });

    describe('#append', function(){
      it('associates the child to the parent', function(done) {
        var user         = new User(),
            notification = new Notification();

        user.notifications.append(notification, function(err, notification) {
          should.strictEqual(err, null);
          notification.user.should.eql(user._id);
          done();
        });
      });

      it('does not add the child id to the parent', function(done) {
        var user         = new User(),
            notification = new Notification();

        user.notifications.append(notification, function(err, notification) {
          should.strictEqual(err, null);
          user.notifications.should.be.empty;
          done();
        });
      });
    });

    describe('#concat', function(){
      it('concates many instantiated child documents', function(done) {
        var user          = new User(),
            notifications = [ new Notification(), new Notification() ];

        user.notifications.concat(notifications, function(err, notifications) {
          should.strictEqual(err, null);

          var count = notifications.length;
          notifications.forEach(function(notification){
            notification.user.should.eql(user._id);
            //user.notifications.should.containEql(notification._id);
            --count || done();
          });
        });
      });

      it('does not add child ids to the parent', function(done) {
        var user          = new User(),
            notifications = [ new Notification(), new Notification() ];

        user.notifications.concat(notifications, function(err, notifications) {
          should.strictEqual(err, null);

          var count = notifications.length;
          notifications.forEach(function(notification){
            user.notifications.should.not.containEql(notification._id);
            --count || done();
          });
        });
      });
    });

    describe('#find', function() {
      it('returns a Mongoose Query', function(done) {
        var user          = new User(),
            notifications = [ {}, {} ]

        user.notifications.create(notifications, function(err, user, notifications) {
          var find = user.notifications.find({})
          find.should.be.an.instanceof(mongoose.Query);
          find._conditions.should.have.property('user');
          done();
        });
      });

      it('takes options to find by', function(done) {
        var user          = new User(),
            notifications = [ { message: 'Alert!' }, {} ]

        user.notifications.create(notifications, function(err, user, notifications) {
          var find = user.notifications.find({ message: 'Alert!' })
          find._conditions.should.have.property('user');
          find._conditions.should.have.property('message');
          find._conditions.message.should.eql('Alert!');
          done();
        });
      });

      it('finds child documents', function(done) {
        var user          = new User(),
            notifications = [ {}, {} ]

        user.notifications.create(notifications, function(err, user, notifications) {
          var find = user.notifications.find({});
          find.exec(function(err, foundNotifications) {
            should.strictEqual(err, null);

            foundNotifications.should.have.length(2);

            var count = foundNotifications.length;
            foundNotifications.forEach(function(notification) {
              notification.should.be.an.instanceof(Notification);
              notification.user.should.eql(user._id);
              --count || done();
            });
          });
        });
      });

      it('searching for children documents', function(done) {
        var find,
            user           = new User(),
            notifications  = [ { message: 'Blog notification #1' },
                               { message: 'Blog notification #2' } ]

        user.notifications.create(notifications, function(err, user, notifications) {
          find = user.notifications.find({ message: 'Blog notification #1' });
          find.exec(function(err, foundNotifications) {
            should.strictEqual(err, null);

            foundNotifications.should.have.length(1);
            foundNotifications[0].message.should.equal('Blog notification #1');
            done();
          });
        });
      });
    });

    describe('#delete', function(){
      it('deletes dependent child documents', function(done) {
        var user          = new User(),
            notifications = [ { message: 'Blog tweet #1' },
                              { message: 'Blog tweet #2' } ];

        user.notifications.create(notifications, function(err, user, notifications){
          var notification = notifications[0];
          user.notifications.remove(notification._id, function(err, user){
            should.strictEqual(err, null);

            Notification.findById(notification._id, function(err, found){
              should.strictEqual(err, null);
              should.not.exist(found);
              done();
            });
          });
        });
      });
    });

    describe('#nullifies', function(){
      it('nullifies dependent child documents', function(done){
        var user      = new User(),
            addresses = [ {}, {} ];

        user.addresses.create(addresses, function(err, user, addresses){
          var addressOne = addresses[0];
          var addressTwo = addresses[1];
          user.addresses.remove(addressOne._id, function(err, user){
            should.strictEqual(err, null);

            user.addresses.should.have.length(0);

            Address.findById(addressOne._id, function(err, address){
              should.strictEqual(err, null);
              should.not.exist(address.user);
              done();
            });
          });
        });
      });
    });

    describe('#populate', function(){
      it('returns an error', function(done){
        var user          = new User(),
            notifications = [ {}, {} ];

        user.notifications.create(notifications, function(err, user, notifications){
          user.save(function(err, user){
            user.notifications.populate(function(err, user){
              err.should.be.an.instanceof(Error);
              err.message.should.eql('Cannot populate when setParent is false. Use #find.')
              done();
            });
          });
        });
      });
    });
  });
});
