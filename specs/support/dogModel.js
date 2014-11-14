var PetSchemaBase = require('./petSchemaBase')
  , petModel = require('./petModel');

var dogSchema = new PetSchemaBase({
  breed: { type: String, required: true, trim: true },
  date_of_birth: { type: Date, required: true }
});

module.exports = petModel.discriminator('Dog', new PetSchemaBase());
