var mongoose = require('mongoose'), Schema = mongoose.Schema, ObjectId = Schema.ObjectId, MongooseArray = mongoose.Types.Array, utils = require('./utils'), merge = utils.merge, pluralize = utils.pluralize;
/**
 * Adds the relationship to the Schema's path
 * and creates the path if necessary
 *
 * @param {Object} relationship
 * @return {Schema}
 * @api private
 */
Schema.prototype._addRelationship = function (type, model, options) {
  if (!model)
    throw new Error('Model name needed');
  var array = type === 'hasMany' || type === 'habtm', pathName, cast = array ? [{
        type: ObjectId,
        index: true,
        ref: model
      }] : {
      type: ObjectId,
      index: true,
      ref: model
    };
  if (options && options.through) {
    pathName = options.through;
  } else {
    pathName = array ? pluralize(model.toLowerCase()) : model.toLowerCase();
  }
  if (!this.paths[pathName]) {
    var path = {};
    path[pathName] = cast;
    this.add(path);
  }
  this.paths[pathName].options[type] = model;
  if (options && options.dependent)
    this.paths[pathName].options.dependent = options.dependent;
  return this;
};
/**
 * Syntactic sugar to create the relationships
 *
 * @param {String} model [name of the model in the DB]
 * @param {Object} options [through, dependent]
 * @return {Schema}
 * @api public
 */
Schema.prototype.belongsTo = function (model, options) {
  this._addRelationship.call(this, 'belongsTo', model, options);
};
Schema.prototype.hasOne = function (model, options) {
  this._addRelationship.call(this, 'hasOne', model, options);
};
Schema.prototype.hasMany = function (model, options) {
  this._addRelationship.call(this, 'hasMany', model, options);
};
Schema.prototype.habtm = function (model, options) {
  this._addRelationship.call(this, 'habtm', model, options);
};
/**
 * Finds the path referencing supplied model name
 *
 * @param {String} modelName
 * @param {String} type (optional)
 * @return {Object}
 *   @param {String} type
 *   @param {String} name
 * @api private
 */
Schema.prototype._findPathReferencing = function (modelName, type) {
  for (var path in this.paths) {
    var options = this.paths[path].options;
    if (type) {
      if (options[type] && options[type] === modelName) {
        return {
          type: type,
          name: path
        };
        break;
      }
    } else if (options.belongsTo === modelName || options.habtm === modelName) {
      var type = Array.isArray(options.type) ? 'habtm' : 'belongsTo';
      return {
        type: type,
        name: path
      };
      break;
    }
  }
};
/**
 * Check for presence of relationship
 */
MongooseArray.prototype._hasRelationship = function () {
  return this._schema && (this._schema.options.hasMany || this._schema.options.habtm || this._schema.options.hasOne);
};
/**
 * Figure out the relationship
 *
 * @return {Object}
 *   @param {String} type
 *   @param {String} ref
 *   @param {Object} options
 * @api private
 */
MongooseArray.prototype._getRelationship = function () {
  var schemaOpts = this._schema.options, type, ref, options = {};
  if (schemaOpts.hasMany) {
    type = 'hasMany';
    ref = schemaOpts.hasMany;
  }
  if (schemaOpts.hasOne) {
    type = 'hasOne';
    ref = schemaOpts.hasOne;
  }
  if (schemaOpts.habtm) {
    type = 'habtm';
    ref = schemaOpts.habtm;
  }
  if (schemaOpts.dependent)
    options.dependent = schemaOpts.dependent;
  return {
    type: type,
    ref: ref,
    options: options
  };
};
/**
 * Builds the instance of the child element
 *
 * @param {Object|Array} objs
 * @return {Document|Array}
 * @api public
 */
MongooseArray.prototype.build = function (objs) {
  if (!this._hasRelationship())
    throw new Error('Path doesn\'t contain a reference');
  var self = this, parent = this._parent, childModelName = this._schema.options.hasMany || this._schema.options.habtm, childModel = parent.model(childModelName), childSchema = childModel.schema, parentModelName = parent.constructor.modelName, childPath = childSchema._findPathReferencing(parentModelName);
  var build = function (obj) {
    obj = new childModel(obj);
    // HABTM or belongsTo?
    if (childPath.type === 'habtm')
      obj[childPath.name].push(parent);
    else
      obj[childPath.name] = parent;
    parent[self._path].push(obj);
    return obj;
  };
  if (Array.isArray(objs)) {
    return objs.map(function (obj) {
      return build(obj);
    });
  }
  return build(objs);
};
/**
 * Create a child document and add it to the parent `Array`
 *
 * @param {Object|Array} objs [object(s) to create]
 * @param {Functions} callback [passed: (err, parent, created children)]
 * @api public
 */
MongooseArray.prototype.create = function (objs, callback) {
  if (!this._hasRelationship())
    return callback(new Error('Path doesn\'t contain a reference'));
  var self = this, parent = this._parent, childModelName = this._schema.options.hasMany || this._schema.options.habtm, childModel = parent.model(childModelName), childSchema = childModel.schema, parentModelName = parent.constructor.modelName, childPath = childSchema._findPathReferencing(parentModelName);
  // You *need* a reference in the child `Document`
  if (!childPath)
    throw new Error('Parent model not referenced anywhere in the Child Schema');
  // If we're provided an `Array`, we need to iterate
  objs = this.build(objs);
  if (Array.isArray(objs)) {
    var created = [], total = objs.length;
    objs.forEach(function (obj, i) {
      obj.save(function (err, obj) {
        if (err) {
          // Empty the array and return the error,
          // effectively breaking the loop.
          objs.splice(i, objs.length - i);
          return callback(err);
        }
        // Store the created records;
        created.push(obj);
        --total || parent.save(function (err, parent) {
          if (err)
            return callback(err);
          return callback(null, parent, created);
        });
      });
    });
  } else {
    // Only one object needs creation.
    // Going for it then!
    objs.save(function (err, obj) {
      if (err)
        return callback(err);
      parent.save(function (err, parent) {
        if (err)
          return callback(err);
        return callback(null, parent, obj);
      });
    });
  }
};
/**
 * Find children documents
 *
 * *This is a copy of Model.find w/ added error throwing and such*
 */
MongooseArray.prototype.find = function (conditions, fields, options, callback) {
  if (!this._hasRelationship())
    return callback(new Error('Path doesn\'t contain a reference'));
  // Copied from `Model.find`
  if ('function' == typeof conditions) {
    callback = conditions;
    conditions = {};
    fields = null;
    options = null;
  } else if ('function' == typeof fields) {
    callback = fields;
    fields = null;
    options = null;
  } else if ('function' == typeof options) {
    callback = options;
    options = null;
  } else {
    conditions = {};
  }
  var parent = this._parent, childModel = parent.model(this._schema.options.hasMany || this._schema.options.habtm), childPath = childModel.schema._findPathReferencing(parent.constructor.modelName);
  // You *need* a reference in the child `Document`
  if (!childPath)
    throw new Error('Parent model not referenced anywhere in the Child Schema');
  var safeConditions = {};
  safeConditions[childPath.name] = parent._id;
  merge(safeConditions, conditions);
  merge(safeConditions, { _id: { $in: parent[this._path] } });
  //var query = new mongoose.Query(safeConditions, options).select(fields).bind(childModel, 'find');
  var query = childModel.find(safeConditions, options).select(fields);
  if ('undefined' === typeof callback)
    return query;
  return query.find(callback);
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
  if ('function' == typeof fields) {
    callback = fields;
    fields = null;
  }
  var parent = this._parent, model = parent.constructor, path = this._path, self = this;
  return model.findById(parent._id).populate(path, fields).exec(callback);
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
var oldRemove = MongooseArray.prototype.remove;
MongooseArray.prototype.remove = MongooseArray.prototype.delete = function (id, callback) {
  var args = arguments, relationship = this._getRelationship();
  if (id._id) {
    var child = id;
    id = child._id;
  }
  if (arguments[1] && typeof arguments[1] === 'function')
    oldRemove.call(this, id);
  else {
    oldRemove.apply(this, arguments);
  }
  if (!callback || typeof arguments[1] !== 'function')
    callback = function (err) {
      if (err)
        throw err;
    };
  var self = this, parent = this._parent, childModel = parent.model(relationship.ref);
  if (relationship.options.dependent) {
    if (relationship.type === 'habtm') {
      if (relationship.options.dependent === 'delete' || relationship.options.dependent === 'nullify') {
        if (child) {
          var childPath = child._findPathReferencing(parent.constructor.modelName, 'habtm');
          child[childPath.name].remove(parent._id);
          child.save(function (err, child) {
            if (err)
              callback(err);
            callback(null, parent);
          });
        } else {
          childModel.findById(id, function (err, child) {
            if (err)
              return callback(err);
            var childPath = child.schema._findPathReferencing(parent.constructor.modelName, 'habtm');
            child[childPath.name].remove(parent._id);
            child.save(function (err, child) {
              if (err)
                callback(err);
              callback(null, parent);
            });
          });
        }
      }
    } else {
      if (relationship.options.dependent === 'delete') {
        childModel.remove({ _id: id }, function (err) {
          if (err)
            return callback(err);
          parent.save(callback);
        });
      } else if (relationship.options.dependent === 'nullify') {
        if (child) {
          var childPath = child._findPathReferencing(parent.constructor.modelName);
          child.set(childPath.name, null);
          child.save(function (err, child) {
            if (err)
              callback(err);
            callback(null, parent);
          });
        } else {
          childModel.findById(id, function (err, child) {
            if (err)
              return callback(err);
            var childPath = child.schema._findPathReferencing(parent.constructor.modelName);
            child.set(childPath.name, null);
            child.save(function (err, child) {
              if (err)
                callback(err);
              callback(null, parent);
            });
          });
        }
      }
    }
  } else {
    callback(null, parent);
  }
};
/**
 * Append an already instantiated document
 * saves it in the process.
 *
 * @param {Document} child
 * @param {Function} callback
 * @api public
 */
MongooseArray.prototype.append = function (child, callback) {
  var throwErr = function (message) {
    if (callback)
      return callback(new Error(message));
    else
      throw new Error(message);
  };
  if (!this._hasRelationship())
    return throwErr('Path doesn\'t contain a reference');
  var relationship = this._getRelationship();
  if (child.constructor.modelName !== relationship.ref)
    return throwErr('Wrong Model type');
  var childPath = child.schema._findPathReferencing(this._parent.constructor.modelName);
  if (childPath.type === 'habtm')
    child[childPath.name].push(this._parent._id);
  else
    child[childPath.name] = this._parent._id;
  this._parent[this._path].push(child._id);
  if (!callback)
    return child;
  return child.save(callback);
};
/**
 * Append many instantiated children documents
 *
 * @param {Array} children
 * @param {Function} callback
 * @api public
 */
var oldConcat = MongooseArray.prototype.concat;
MongooseArray.prototype.concat = function (children, callback) {
  if (!Array.isArray(children))
    return callback(new Error('First argument needs to be an Array'));
  var self = this, children = children.map(function (child) {
      return self.append(child);
    }), childrenIds = children.map(function (child) {
      return child._id;
    });
  var total = children.length;
  children.forEach(function (child) {
    child.save(function (err, child) {
      if (err) {
        // Empty the array and return the error,
        // effectively breaking the loop.
        objs.splice(i, objs.length - i);
        return callback(err);
      }
      --total || function () {
        oldConcat.call(self, childrenIds);
        self._markModified();
        callback(null, children);
      }();
    });
  });
};
