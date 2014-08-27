var ObjectId  = require('mongoose').Schema.ObjectId,
    pluralize = require('../utils').pluralize,
    Base      = require('./base');

function hasMany (schema, model, options) {
  this.type = 'hasMany';
  Base.call(this, schema, model, options);

  var setParent = this.options.hasOwnProperty('setParent') ? this.options.setParent : true;
  this.schema.paths[this.pathName].options.setParent = setParent;
};

hasMany.prototype.__proto__ = Base;

hasMany.prototype.getCast = function(){
  return [{
    type:  ObjectId,
    index: true,
    ref:   this.model
  }];
};

hasMany.prototype.getPathName = function(){
  return this.options.through || pluralize(this.model.toLowerCase());
};

module.exports = hasMany;
