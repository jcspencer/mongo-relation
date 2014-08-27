var mongoose = require('mongoose');

var TweetSchema = new mongoose.Schema({
  title: String,
  body:  String
});

TweetSchema.belongsTo('User', { through: 'author', required: true });
TweetSchema.habtm('Tag', { through: 'tags', setChild: false })

module.exports = mongoose.model('Tweet', TweetSchema);
