Mongoose Relationships [![Build Status](https://travis-ci.org/JamesS237/mongo-relation.svg?branch=master)](https://travis-ci.org/JamesS237/mongo-relation)
======================
_... because sometimes embedded documents aren't enough._

A plugin for [Mongoose](http://github.com/learnboost/mongoose) adding a simple syntax for model relationships and providing useful helpers to empower them.

This is an early release with limited functionalities. I'm looking for feedback on the API and features (been exploring a few different solutions, nothing's impossible!).

I'm inspiring from various libraries in Ruby I've used throughout the years. Might not be your cup of tea.

Goals
-----

* Be unobtrusive and compliant with the ways of Mongoose (coding style, testing, API).

Usage
=====

First, `npm install mongo-relation`.

Add relationships to your schema through either `hasMany`, `belongsTo` or `habtm` (has and belongs to many).

* {String} `ModelName` is the name of the Model.
* {Object} `options`
    * {String} `through` if you want to specify what path to use for the relationship. Else the path will be created for you by pluralizing the `ModelName`.
    * {String} `dependent` takes either "delete" or "nullify" and indicated what to do when the element is removed from the parent's `through` array.

```javascript
var mongoose = require('mongoose');
require('mongo-relation');

YourSchema.hasMany('ModelName', {through: 'PathName', dependent: 'delete|nullify'});
```

It's good to take note that for "has and belongs to many" type relationships, the dependent option only deletes the reference, not the actual referenced document.

Examples
--------

One to Many
-----------

```javascript
UserSchema.hasMany('Post', {dependent: 'delete'});

// uses the 'author' path for the relation
PostSchema.belongsTo('User', {through: 'author'});
```

Has and Belongs to Many
-----------------------

```javascript
PostSchema.habtm('Category');
CategorySchema.habtm('Post');
```

Methods
=======

Every `Document` that has their `Schema` plugged with `mongo-relation` has access to the following methods.

__Let's use this starting point:__

```javascript
var mongoose = require('mongoose');
require('mongo-relation');

// UserSchema stores an Array of ObjectIds for posts
var UserSchema = new mongoose.Schema({
    posts: [mongoose.Schema.ObjectId]
});

// PostSchema stores an ObjectId for the author
var PostSchema = new mongoose.Schema({
    title  : String
  , author : mongoose.Schema.ObjectId
});

// Attach the plugin
UserSchema.hasMany('Post');
PostSchema.belongsTo('User', {through: 'author'});

var User = mongoose.model('User', UserSchema)
  , Post = mongoose.model('Post', PostSchema);
```

create
------

Takes care of creating the child document and the links between it and the parent document.

* {Object|Array} `objs` representation of the child document(s) to create
* {Function} `callback` (optional) function returning an error if any, the new parent document and the created post(s)

__Example:__

```javascript
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
```

build
-----

Instantiates a child document, appends its reference to the parent document and returns the child document. _Does not save anything._

* {Object} `obj` representation of the child document(s) to create

__Example:__

```javascript
var post = user.posts.build({title: "Just instantiating me"});
// post.author === user._id
```

append
------

Allows pushing of an already existing document into the parent document. Creates all the right references.

Works with either a saved or unsaved document.

The parent document is not saved, you'll have to do that yourself.

* {Document} `child` document to push.
* {Function} `callback` called with an error if any and the child document w/ references.

__Example:__

```javascript
var post = new Post();

user.posts.append(post, function(err, post){
  // post.author === user._id
  // user.posts.id(post._id) === post._id
});
```

concat
------

Just like `Array.prototype.concat`, it appends an `Array` to another `Array`

* {Document} `child` document to push.
* {Function} `callback` called with an error if any and the child document w/ references.

__Example:__

```javascript
var posts = [new Post(), new Post()];

user.posts.concat(posts, function(err, posts){
  // `posts` is an `Array` of `Document`
  // each have its author set to `user._id`
});
```

find
----

It's the same as a `Mongoose.Query`. Only looks through the children documents.

See [Mongoose.Query](http://mongoosejs.com/docs/finding-documents.html) for the params

__Example:__

```javascript
user.posts.find({title: "Not too imaginative post title"}, function(err, posts){
  // posts.length === 1
  // posts[0].author == user._id
  // posts[0].title == "Not too imaginative post title";
});
```

populate
--------

Some sugary syntax to populate the parent document's child documents.

* {Array} `fields` (optional) you want to get back with each child document
* {Function} `callback` called with an error and the populate document

__Example:__

```javascript
user.posts.populate(function(err, user){
  // user.posts.length === 2
});
```

remove
------

Depending on the `dependent` option, it'll either delete or nullify the

* {ObjectId} `id` of the document to remove
* {Function} `callback` (optional) called after the deed is done with an error if any and the new parent document.

__Example:__

```javascript
user.posts.remove(user.posts[0]._id, function(err, user){
  // The post will either be delete or have its `author` field nullified
});
```

Testing
=======

Mongo-Relation uses [Mocha](http://github.com/visionmedia/mocha) with [Should](http://github.com/visionmedia/should.js). Tests are located in `./test` and should be ran with the `make test` command.

Contribute
==========

* Pick up any of the items above & send a pull request (w/ __passing__ tests please)
* Discuss the API / features in the [Issues](http://github.com/JamesS237/mongo-relation/issues)
* Use it and report bugs in the [Issues](http://github.com/JamesS237/mongo-relation/issues) (w/ __failing__ tests please)
