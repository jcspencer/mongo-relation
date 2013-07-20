var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , relationships = require('../../index'); // require('mongoose-relationships');

/**
 * Blog Post Schema
 * "belongs to one author"
 */
var PostSchema = new Schema({
    title      : String
  , body       : String
  , author     : {type: ObjectId, ref: 'User'}
});

/**
 * User Schema
 * "has many posts"
 */
var UserSchema = new Schema({
    name  : String
  , posts : [{type: ObjectId, ref: 'Post'}]
});

/**
 * Attach the plugin to the schemas
 */
PostSchema.plugin(relationships, {
    belongsTo : "User"
  , through   : "author"
});
UserSchema.plugin(relationships, {
    hasMany   : "Post"
  , through   : "posts"
});

/**
 * Register the models with Mongoose
 */
var Post = mongoose.model('Post', PostSchema)
  , User = mongoose.model('User', UserSchema);

// Have fun here:
var user = new User();

user.posts.create({
  title: "Mongoose, now with added love through relationships!"
}, function(err, user, post){
  // user.posts.length === 1
  // post.title === "Mongoose, now with added love through relationships!"
});

// Using an `Array`
user.posts.create([
    { title: "Not too imaginative post title" }
  , { title: "... a tad more imaginative post title" }
], function(err, user, posts){
  // user.posts.length === 3
  // posts.length == 2
  // posts[0] instanceof Post
});
