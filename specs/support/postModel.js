var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
  title: String
});

PostSchema.belongsTo('editor', { modelName: 'User' });
PostSchema.belongsTo('author', { through: 'User' });

// should not delete the reference
PostSchema.habtm('Category');

module.exports = mongoose.model('Post', PostSchema);
