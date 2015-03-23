var ObjectId = require('mongoose').Schema.ObjectId,
    Base     = require('./base');

function belongsTo (schema, model, options) {
  this.type = 'belongsTo';
  Base.call(this, schema, model, options);

  if(this.options.polymorphic){
    var path = {},
        cast = { type: String },
        name = ((options.through || model) + '_type').toLowerCase();

    if (options.required) {
      cast.required = true;
    }

    path[name] = cast
    this.schema.add(path);
  }
};

belongsTo.prototype.__proto__ = Base;

belongsTo.prototype.getCast = function(){
  var cast = {
    type: ObjectId,
    index: true,
    ref: this.model
  };

  cast.belongsTo = this.model;

  if (this.options.required) {
    cast.required = true;
  }

  return cast;
};

belongsTo.prototype.getPathName = function(){
  return this.options.through || this.model.toLowerCase();
};

module.exports = belongsTo;
