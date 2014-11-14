var mongoose = require('mongoose');

function Base (path) {
  this._path = path;
  this._parent = path._parent;
}

Base.getChildModel = function(discriminator) {
  return mongoose.model(discriminator);
}

Base.getRelationship = function() {
  var self         = this._path,
      schemaOpts   = self._schema.options,
      relationship = {};

  relationship.rel = this.type;
  relationship.ref = schemaOpts.relationshipModel;
  relationship.options = {}

  if (schemaOpts.dependent) {
    relationship.options.dependent = schemaOpts.dependent;
  }

  return relationship;
};

module.exports = Base;
