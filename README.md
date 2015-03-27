# Mongoose Relationships

A plugin for [Mongoose](http://github.com/learnboost/mongoose) for model relationships and helpers.

## Goals

* Be unobtrusive and compliant with the ways of Mongoose (coding style, testing, API).

## Usage

```javascript
var mongoose = require('mongoose');
require('mongo-relation');
```

### One to Many (belongsTo/hasMany)

```javascript
var postSchema = new mongoose.Schema({});
postSchema.hasMany('comments', { dependent: 'destroy|delete|nullify' });
var Post = mongoose.model('Post', postSchema);

var commentSchema = new mongoose.Schema({});
commentSchema.belongsTo('post');
var Comment = mongoose.model('Comment', commentSchema);
```

#### create

Creates a child document associated to the parent.

* {Object|Array} __objs__ child document(s) // simple objects
* {Function} __callback__ callback(err, docs)
  * {Error} __err__ error from mongoose
  * {Document|Array} __docs__ Array or single persisted model

```javascript
var postSchema = new mongoose.Schema({ content: String });
postSchema.hasMany('comments', { dependent: 'destroy|delete|nullify' });

var commentSchema = new mongoose.Schema({ content: String });
commentSchema.belongsTo('post');

var post = new Post({ content: "Relations are helpful." });

post.comments.create({ content: "I agree!" }, function(err, comment){
  console.assert(comment.content == "I agree!", "comment belongsTo post.");
  console.assert(post._id == comment.post, "comment belongsTo post.");
  console.assert(!comment.isNew, "comment has been saved.");
  console.assert(comment instanceOf Comment, "comment is a Comment.");
});

post.comments.create({ content: "+1" }, { content: "Yup!" }, function(err, comments){
  console.assert(comments.length == 2, "created two documents.");
  comments.forEach(function (comment) {
    console.assert(post._id == comment.post, "comment belongsTo post.");
    console.assert(!comment.isNew, "comment has been saved.");
    console.assert(comment instanceOf Comment, "comment is a Comment.");
  });
});
```

#### build

Instantiates children/a child document(s) with the appropriate associations.

* {Object|Array} __objs__ child document(s) // simple objects

```javascript
var comment = post.comments.build({comment: "First!"});
console.assert(comment.post == post._id, "associated");
console.assert(comment.isNew, "not saved");

var post = new Post({ content: "Relations are easy." });
var comments = post.comments.build({ comment: "First!" }, { comment: "LOL" });
console.assert(comments.length == 2);
comments.forEach(function (comment) {
  console.assert(comment.post === post._id, "associated");
  console.assert(comment.isNew, "not saved");
});
```

#### concat

Associates & saves initialized document(s) with the appropriate associations.

* {Document|Array} __docs__ documents to associate. // mongoose documents
* {Function} __callback__ callback(err, docs)
  * {Error} __err__ error from mongoose
  * {Document|Array} __docs__ Array or single persisted document(s)

```javascript

var post = new Post({ content: "Concating is great." });
var comment = new Comment();
post.comments.concat(comment, function(err, comment){
  console.assert(comment.post === post._id, "associated");
  console.assert(!comment.isNew, "saved");
});

var comments = [new Comment(), new Comment()];
post.comments.concat(comments, function(err, comments){
  console.assert(comments.length == 2);
  comments.forEach(function (comment) {
    console.assert(comment.post === post._id, "associated");
    console.assert(!comment.isNew, "saved");
  });
});

// existing doc

var comment = new Comment();
comment.save(function (err, comment) {
  post.comments.concat(comment, function(err, comment){
	console.assert(comment.post === post._id, "associated");
	console.assert(!comment.isNew, "saved");
  });
});

```


#### append
Sugar for #concat


#### find

Inject params for the association, then fallback on _Model.find_

- {Object} __docs__ (optional) query conditions
- {String} __fields__ (optional) fields to populate
- {Object} __options__ (optional) query options
- {String} __callback__ (optional) callback(err, docs)
  - {Error} __err__ error from mongoose
  - {Document} __doc__ Found document


```javascript
var postOne = new Post({ content: "Find all the things." })
  , postTwo = new Post({ content: "Found all the things." });

postOne.comments.create({ content: "+1" }, function(err){
  postTwo.comments.create({ content: "+1" }, function(err){

    postOne.comments.find({ comment: "+1" }, function(err, comments){
      console.assert(comments.length == 1);
      console.assert(comments[0].post == postOne._id, "found the correct comment");

      var criteria = postTwo.comments.find({ comment: "+1" });
      console.assert(criteria._conditions.post == postTwo._id, "The association has been added to the query.");
      console.assert(criteria._conditions.comment == "+1", "keeps original query.");

      criteria.exec(function(err, comments){
        console.assert(comments.length == 1);
        console.assert(comments[0].post == postTwo._id, "found the correct comment");
      });
    });
  });
});
```

Todo
====

* Document belongsTo
* add touch to hasMany
* add touch to belongsTo
* Refactor hasAndBelongsToMany
* Document hasAndBelongsToMany
* Add embedsMany
* Add emdedsOne