var mongoose = require('mongoose');

var TagSchema = new mongoose.Schema({
  name: String
});

TagSchema.belongsTo('User');

module.exports = mongoose.model('Tag', TagSchema);
