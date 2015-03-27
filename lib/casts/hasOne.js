var mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.ObjectId,
    i = require('i')();

function HasOne (doc, options) {
  options = options || {};
  this._options = options;

  this.doc       = doc;
  this.modelName = this.doc.constructor.modelName;
  this.Model     = mongoose.model(this.modelName);

  this.associationModelName = this._options.associationModelName;
  this.associationModel     = mongoose.model(this.associationModelName);

  this.foreignKey = i.underscore(this.modelName);

  var query = {};
  query[this.foreignKey] = this.doc._id;
  return this.associationModel.findOne(query);
}

module.exports = function (schema, associationName, options) {
  options = options || {};
  options.associationName = associationName;
  options.associationModelName = associationModelName = i.classify(associationName);

  schema.virtual(associationName).get(function(){
    return HasOne(this, options);
  });
};
