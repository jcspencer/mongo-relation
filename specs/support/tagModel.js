var mongoose = require('mongoose');

var TagSchema = new mongoose.Schema({
  name: String
});

TagSchema.belongsTo('twitter_user');

module.exports = mongoose.model('Tag', TagSchema);
