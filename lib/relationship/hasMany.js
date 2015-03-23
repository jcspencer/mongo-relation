var Base            = require('./base'),
    async           = require('async')
    utils           = require('../utils'),
    extend          = utils.extend,
    merge           = utils.merge,
    mongoose        = require('mongoose'),
    MongooseArray   = mongoose.Types.Array,
    CollectionMixin = require('./mixins/collection');

function hasMany (path) {
  Base.call(this, path);
  this.setup(path);
  this.type = 'hasMany';
}

hasMany.prototype.__proto__ = Base;

hasMany.prototype.append = function (child, callback) {
  var self         = this._path,
      parent       = this._parent,
      relationship = this.getRelationship(),
      childPath    = this._childToParent,
      throwErr     = utils.throwErr(callback);

  // TODO: abstract me
  if (!childIsAllowed.call(this, child)) {
    return throwErr('Wrong Model type');
  }

  if (shouldSetParent.call(this)) {
    parent[self._path].push(child._id);
  }

  if (this._options.as) {
    child[this._options.as] = parent._id;
    child[this._options.as + '_type'] = parent.constructor.modelName;
  } else {
    child[childPath.name] = parent._id;
  }

  if (!callback) {
    return child;
  } else {
    child.save(callback);
  }
};

// XXX: does not save parent
hasMany.prototype.concat = function (children, callback) {
  var throwErr = utils.throwErr(callback);

  if (!Array.isArray(children)) {
    return throwErr('First argument needs to be an Array');
  };

  var relationship = this,
      self         = this._path,
      children     = children.map(function (child) { return self.append(child) });

  var saveChild = function(child, next) {
    child.save(next);
  };

  var completeHandler = function(err, savedChildren){
    if (err) { return throwErr(err) }

    if (shouldSetParent.call(relationship)){
      var ids = savedChildren.map(function(child) { return child._id });
      MongooseArray.prototype._concat.call(self, ids);
    }

    self._markModified();
    callback(null, children);
  };

  async.mapSeries(children, saveChild, completeHandler);
};

hasMany.prototype.find = function (conditions, fields, options, callback) {
  // Copied from `Model.find`
  if ('undefined' == typeof conditions) {
    conditions = {};
  } else if ('function' == typeof conditions) {
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
  }

  var self            = this._path,
      parent          = this._parent,
      childModel      = this.getChildModel(this._childModelName);
      childPath       = this._childToParent;
      childConditions = {},
      throwErr        = utils.throwErr(callback);

  if (this._options.as) {
    childConditions[this._options.as] = parent._id;
    childConditions[this._options.as + '_type'] = parent.constructor.modelName;
  } else {
    if (!childPath) {
      return throwErr('Parent model not referenced anywhere in the Child Schema');
    }

    childConditions[childPath.name] = parent._id;

    if (shouldSetParent.call(this)) {
      merge(conditions, { _id: { $in: parent[self._path] } });
    }
  }

  merge(conditions, childConditions);

  var query = childModel.find(conditions, options).select(fields);

  callback && query.exec(callback);
  return query;
};

// XXX: Does not save parent
hasMany.prototype.delete = function (id, callback) {
  var rel        = this,
      self       = this._path,
      parent     = this._parent,
      childModel = this.getChildModel(this._childModelName),
      childPath  = this._childToParent,
      child      = null,
      throwErr   = utils.throwErr(callback);

  if (id._id) {
    var child = id;
    id = child._id;
  }

  // TODO: should a callback be required?
  if (!callback) {
    callback = function (err) {
      if (err) {
        throw err;
      }
    };
  }

  if (shouldSetParent.call(rel)) {
    // TODO: is this needed?
    // I think this removing the id from the instance array
    // however, it could be not needed
    MongooseArray.prototype._remove.call(self, id);
  }

  var callbackForRemoveOrSave = function(err) {
    if (err) { return throwErr(err); }
    if (shouldSetParent.call(rel)) {
      parent.save(callback);
    } else {
      callback(null, parent);
    }
  };

  rel.find({ _id: id }).findOne({}).exec(function(err, child){
    if (err) return callback(err);
    if (!child) return callback(new Error('Child is not a member of the relationship.'));

    if (!!~['delete', 'destroy'].indexOf(rel._options.dependent)){
      child.remove(callbackForRemoveOrSave);
    } else if (rel._options.dependent === 'nullify') {
      if (err) { return throwErr(err) };
      child.set(childPath.name, null);
      child.save(callbackForRemoveOrSave);
    } else {
      callback(null, parent);
    };

  });
};

hasMany.prototype.populate = function (fields, callback) {
  if ('function' == typeof fields) {
    callback = fields;
    fields = null;
  }

  var self     = this._path,
      parent   = this._parent,
      model    = parent.constructor,
      path     = self._path,
      throwErr = utils.throwErr(callback);

  if (!shouldSetParent.call(this)) {
    return throwErr('Cannot populate when setParent is false. Use #find.');
  }

  // TODO: do we really need to initialize a new doc?
  model.findById(parent._id).populate(path, fields).exec(callback);
};

extend(hasMany, CollectionMixin);

// private not private

hasMany.prototype._buildOne = function (obj) {
  return buildOne.call(this, obj);
};

hasMany.prototype._validForCreate = function(doc) {
  if (this._options.as){
    return true;
  } else {
    return !!this._childToParent && childIsAllowed.call(this, doc);
  }
}

// privates

var buildOne = function(obj){
  var self       = this._path,
      parent     = this._parent,
      childModel = this.getChildModel(obj.__t || this._childModelName);
      childPath  = this._childToParent;

  child = new childModel(obj);
  if (this._options.as){
    child[this._options.as          ] = parent._id;
    child[this._options.as + '_type'] = parent.constructor.modelName;
  } else {
    child[childPath.name] = parent;
  }

  if (shouldSetParent.call(this)) {
    parent[self._path].push(child);
  }

  return child;
};

var shouldSetParent = function(){
  return !!this._path._schema.options.setParent;
};

var childIsAllowed = function(child) {
  return !!~this._allowed_discriminators.indexOf(child.constructor.modelName);
};

module.exports = hasMany;
