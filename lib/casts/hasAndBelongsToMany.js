var ObjectId  = require('mongoose').Schema.ObjectId,
    pluralize = require('../utils').pluralize,
    Base      = require('./base');

function hasAndBelongsToMany (schema, model, options) {
  this.type = 'habtm';
  Base.call(this, schema, model, options);

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

hasAndBelongsToMany.prototype.__proto__ = Base;

hasAndBelongsToMany.prototype.getCast = function(){
  return [{
    type:  ObjectId,
    index: true,
    ref:   this.model
  }];
};

hasAndBelongsToMany.prototype.getPathName = function(){
  return this.options.through || pluralize(this.model.toLowerCase());
};

module.exports = hasAndBelongsToMany;
