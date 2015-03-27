var mongoose = require('mongoose');

var twitterUserSchema = new mongoose.Schema({ name: String });

twitterUserSchema.hasOne('post', { modelName: 'TwitterPost' });

twitterUserSchema.hasMany('categories');
twitterUserSchema.hasMany('tags', { dependent: 'nullify' });
twitterUserSchema.hasMany('tweets', { dependent: 'delete', inverse_of: 'author' });

twitterUserSchema.habtm('Pet', { setParent: false })

module.exports = mongoose.model('TwitterUser', twitterUserSchema);
