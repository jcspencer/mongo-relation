var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
  title:  String
});

PostSchema.belongsTo('User', { through: 'editor' });
PostSchema.belongsTo('User', { through: 'author' });

// should not delete the reference
PostSchema.habtm('Category');

module.exports = mongoose.model('Post', PostSchema);
