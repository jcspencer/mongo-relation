var ObjectId = require('mongoose').Schema.ObjectId,
    Base     = require('./base');

function hasOne (schema, model, options) {
  this.type = 'hasOne';
  Base.call(this, schema, model, options);
};

hasOne.prototype.__proto__ = Base;

hasOne.prototype.getCast = function(){
  var cast = { type: ObjectId, index: true, ref: this.model };

  cast.hasOne = this.model;

  if (this.options.required) {
    cast.required = true;
  }

  return cast;
};

hasOne.prototype.getPathName = function(){
  return this.options.through || this.model.toLowerCase();
};

module.exports = hasOne;
