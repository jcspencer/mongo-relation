var mongoose = require('mongoose');

var tweetSchema = new mongoose.Schema({ title: String, body: String });

tweetSchema.belongsTo('author', { modelName: 'TwitterUser', required: true });
tweetSchema.habtm('Tag', { through: 'tags', setChild: false })

module.exports = mongoose.model('Tweet', tweetSchema);
