var mongoose = require('mongoose');

var locationSchema = new mongoose.Schema({
  place: String
});

locationSchema.belongsTo('Locateable', { polymorphic: true });

module.exports = mongoose.model('Location', locationSchema);
