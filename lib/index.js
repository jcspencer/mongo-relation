var mongoose            = require('mongoose'),
    Schema              = mongoose.Schema,
    MongooseArray       = mongoose.Types.Array,
    belongsTo           = require('./casts/belongsTo'),
    hasAndBelongsToMany = require('./casts/hasAndBelongsToMany'),
    hasMany             = require('./casts/hasMany'),
    Relationship        = require('./relationship');

/**
 * Syntactic sugar to create the relationships
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

/**
 * Builds the instance of the child element
 *
 * @param {Object|Array} objs
 * @return {Document|Array}
 * @api public
 */
MongooseArray.prototype.build = function (objs) {
  return (new Relationship(this)).build(objs);
};

/**
 * Create a child document and add it to the parent `Array`
 *
 * @param {Object|Array} objs [object(s) to create]
 * @param {Functions} callback [passed: (err, parent, created children)]
 * @api public
 */
MongooseArray.prototype.create = function (objs, callback) {
  return (new Relationship(this)).create(objs, callback);
};

/**
 * Find children documents
 *
 * *This is a copy of Model.find w/ added error throwing and such*
 */
MongooseArray.prototype.find = function (conditions, fields, options, callback) {
  return (new Relationship(this)).find(conditions, fields, options, callback);
};

/**
 * Syntactic sugar to populate the array
 *
 * @param {Array} fields
 * @param {Function} callback
 * @return {Query}
 * @api public
 */
MongooseArray.prototype.populate = function (fields, callback) {
  return (new Relationship(this)).populate(fields, callback);
}

/**
 * Append an already instantiated document
 * saves it in the process.
 *
 * @param {Document} child
 * @param {Function} callback
 * @api public
 */
MongooseArray.prototype.append = function (child, callback) {
  return (new Relationship(this)).append(child, callback);
};


/**
 * Append many instantiated children documents
 *
 * @param {Array} children
 * @param {Function} callback
 * @api public
 */

MongooseArray.prototype._concat = MongooseArray.prototype.concat;
MongooseArray.prototype.concat = function (children, callback) {
  return (new Relationship(this)).concat(children, callback);
};

/**
 * Overrides MongooseArray.remove
 * only for dependent:destroy relationships
 *
 * @param {ObjectId} id
 * @param {Function} callback
 * @return {ObjectId}
 * @api public
 */
MongooseArray.prototype._remove = MongooseArray.prototype.remove;
MongooseArray.prototype.remove = MongooseArray.prototype.delete = function (id, callback) {
  return (new Relationship(this)).delete(id, callback);
};
