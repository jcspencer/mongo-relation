var mongoose = require('mongoose');

var AddressSchema = new mongoose.Schema({
  street: String
});

AddressSchema.belongsTo('User');

module.exports = mongoose.model('Address', AddressSchema);
