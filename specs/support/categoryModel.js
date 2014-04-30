var mongoose = require('mongoose');

var CategorySchema = new mongoose.Schema({
  title:  String
});

CategorySchema.belongsTo('User', { through: 'editor' });

// should only delete the reference
CategorySchema.habtm('Post', { dependent: 'delete' });

module.exports = mongoose.model('Category', CategorySchema);
