function Base (path) {
  this.path = path;
}

Base.getInverse = function () {
  var parentModelName = this.getParentModelName();
      childSchema     = this.getChildModel().schema;

  for (var path in childSchema.paths) {
    var options  = childSchema.paths[path].options,
        relModel = options.relationshipModel,
        relType  = options.relationshipType;

    if (parentModelName == relModel) {
      return { type: relType, name: path };
    }
  }
}

Base.hasInverse = function(){
  return !!this.getInverse();
}

Base.getParentModelName = function () {
  return this.path._parent.constructor.modelName;
}

Base.getChildModel = function () {
  return this.path._parent.model(this.getRelationship().ref);
}

Base.getRelationship = function () {
  var self         = this.path,
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

Base.errorThrower = function (callback) {
  return function (message) {
    if (callback) {
      callback(new Error(message));
    } else {
      throw new Error(message);
    }
  };
}

module.exports = Base;
