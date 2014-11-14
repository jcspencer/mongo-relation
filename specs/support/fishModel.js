var PetSchemaBase = require('./petSchemaBase')
  , PetModel = require('./petModel');

var fishSchema = new PetSchemaBase({
  hasScales: { type: Boolean, default: true },
  isColdBlooded: { type: Boolean, default: true }
});

module.exports = PetModel.discriminator('Fish', fishSchema);
