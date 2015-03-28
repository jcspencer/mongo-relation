var ObjectId  = require('mongoose').Schema.ObjectId,
    pluralize = require('../utils').pluralize;

module.exports = function hasAndBelongsToMany (schema, model, options) {
  this.type = 'habtm';

  this.schema  = schema;
  this.model   = model;
  this.options = options || {};

  this.pathName = this.options.through || pluralize(this.model.toLowerCase());

  var path = {};
  path[this.pathName] = [{ type: ObjectId, index: true, ref: this.model }];
  this.schema.add(path);

  this.schema.paths[this.pathName].options[this.type] = this.model;
  this.schema.paths[this.pathName].options.relationshipType = this.type;
  this.schema.paths[this.pathName].options.relationshipModel = this.model;

  if (this.options.dependent) {
    this.schema.paths[this.pathName].options.dependent = this.options.dependent;
  }

  var setChild = this.options.hasOwnProperty('setChild') ? this.options.setChild : true;
  this.schema.paths[this.pathName].options.setChild = setChild;

  if (!this.schema.paths[this.pathName].options.setChild) {
    if (this.schema.paths[this.pathName].options.dependent == 'nullify') {
      throw new Error("dependent cannot be set to 'nullify' while setChild is false");
    }

    if (this.schema.paths[this.pathName].options.dependent == 'destroy') {
      throw new Error("dependent cannot be set to 'destroy' while setChild is false");
    }
  };
};
