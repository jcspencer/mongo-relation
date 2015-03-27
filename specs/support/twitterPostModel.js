var mongoose = require('mongoose');

var twitterPostSchema = new mongoose.Schema({
  title: String
});

twitterPostSchema.belongsTo('editor', { modelName: 'TwitterUser' });
twitterPostSchema.belongsTo('author', { modelName: 'TwitterUser' });

// should not delete the reference
twitterPostSchema.habtm('Category');

module.exports = mongoose.model('TwitterPost', twitterPostSchema);
