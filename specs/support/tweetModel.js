var mongoose = require('mongoose');

var TweetSchema = new mongoose.Schema({
  title: String,
  body:  String
});

TweetSchema.belongsTo('User', { through: 'author' });

module.exports = mongoose.model('Tweet', TweetSchema);
