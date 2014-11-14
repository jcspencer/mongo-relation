var mongoose      = require('mongoose')
  , PetSchemaBase = require('./petSchemaBase')
  , petSchema     = new PetSchemaBase();

module.exports = mongoose.model('Pet', petSchema);
