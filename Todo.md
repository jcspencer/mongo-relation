HasMany should not set the id on the parent document

    User.hasMany('Tweet');
    user = new User();
    tweet = user.tweets.build();
    user.tweets.should.eql([]);
    tweet.user.should.eql user._id;
