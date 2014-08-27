function Base (schema, model, options) {
  this.schema  = schema;
  this.model   = model;
  this.options = options || {};

  this.pathName = this.getPathName();

  var path = {};
  path[this.pathName] = this.getCast();
  this.schema.add(path);

  this.schema.paths[this.pathName].options[this.type] = this.model;
  this.schema.paths[this.pathName].options.relationshipType = this.type;
  this.schema.paths[this.pathName].options.relationshipModel = this.model;

  if (this.options.dependent) {
    this.schema.paths[this.pathName].options.dependent = this.options.dependent;
  }

};

Base.getCast = function(){ };
Base.getPathName = function(){ };

module.exports = Base;
