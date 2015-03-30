// mongo-relations

module.exports = exports = function mongoRelations (mongoose) {
  var Schema = mongoose.Schema
    , belongsTo = require('./belongsTo')
    , hasMany = require('./hasMany')
    , hasAndBelongsToMany = require('./hasAndBelongsToMany');

  /* Syntactic sugar to create the relationships
  *
  * @param {String} model [name of the model in the DB]
  * @param {Object} options [through, dependent]
  * @return {Schema}
  * @api public
  */
  Schema.prototype.belongsTo = function (model, options) {
    belongsTo(this, model, options);
  };

  Schema.prototype.hasMany = function (model, options) {
    hasMany(this, model, options);
  };

  Schema.prototype.habtm = function (model, options) {
    new hasAndBelongsToMany(this, model, options);
  };

  return mongoose;
};
