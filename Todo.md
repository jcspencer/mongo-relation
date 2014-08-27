- TODO: in a hasMany relationship the parent should not hold child ids
- habtm dependent cannot delete or destroy
- change 'shouldSetChild' to 'inverseOf: nil'
- use async library
- remove "this.schema.paths[this.pathName].options[this.type] = this.model;"
- require callbacks for 'append' & 'delete'
- abstract "if (child.constructor.modelName !== relationship.ref) {"
- check if concat is correct
- concat should save parent when necessary

HasMany should not set the id on the parent document

    User.hasMany('Tweet');
    user = new User();
    tweet = user.tweets.build();
    user.tweets.should.eql([]);
    tweet.user.should.eql user._id;



#### hasOne

User hasOne Profile

Use case: A required relationship - A user would not make sense without a profile. Every user must have one.

| User       | Profile |
|------------|---------|
| profile_id | id      |

plus unique index on Profile.user_id

    user.profile.age

#### hasMany

User hasMany Profiles

| User | Profile |
|------|---------|
| id   | user_id |

    user.profiles.first.age

#### belongsTo

Profile belongsTo User

Use case: A profile does not make sense without the user. Orphaned objects shouldn't exist.

| User       | Profile |
|------------|---------|
| id         | user_id |

    profile.user.id

#### hasAndBelongsToMany

User hasMany profiles, profiles hasMany users

| User        | Profile  |
|-------------|----------|
| profile_ids | user_ids |

    user.profiles.first.id
    profile.users.first.id
