var Base            = require('./base'),
    utils           = require('../utils'),
    extend          = utils.extend,
    merge           = utils.merge,
    MongooseArray   = require('mongoose').Types.Array,
    CollectionMixin = require('./mixins/collection');

function hasMany (path) {
  this.type = 'hasMany';
  Base.call(this, path);
}

hasMany.prototype.__proto__ = Base;

hasMany.prototype.shouldSetParent = function() {
  return !!this.path._schema.options.setParent;
};

hasMany.prototype.buildOne = function (obj) {
  var self       = this.path,
      parent     = self._parent,
      childModel = this.getChildModel();
      childPath  = this.getInverse();

  child = new childModel(obj);
  child[childPath.name] = parent;

  if (this.shouldSetParent()) {
    parent[self._path].push(child);
  }

  return child;
};

hasMany.prototype.append = function (child, callback) {
  var self         = this.path,
      parent       = self._parent,
      relationship = this.getRelationship(),
      childPath    = this.getInverse(),
      throwErr     = this.errorThrower(callback);

  // TODO: abstract me
  if (child.constructor.modelName !== relationship.ref) {
    return throwErr('Wrong Model type');
  }

  if (this.shouldSetParent()) {
    parent[self._path].push(child._id);
  }

  child[childPath.name] = parent._id;

  if (!callback) {
    return child;
  } else {
    child.save(callback);
  }
};

hasMany.prototype.validForCreate = function () {
  return this.hasInverse();
}

// XXX: does not save parent
hasMany.prototype.concat = function (children, callback) {
  var throwErr = this.errorThrower(callback);

  if (!Array.isArray(children))
    return throwErr('First argument needs to be an Array');

  var rel         = this,
      self        = this.path,
      children    = children.map(function (child) { return self.append(child); }),
      childrenIds = children.map(function (child) { return child._id; }),
      total       = children.length;

  children.forEach(function (child) {
    child.save(function (err, child) {
      if (err) {
        // Empty the array and return the error,
        // effectively breaking the loop.
        objs.splice(i, objs.length - i);
        return callback(err);
      }
      --total || function () {
        // TODO: is this needed?
        // I think this is updating the instance of the array
        // while #append is updating the document
        // but this could be unnecessary
        if (rel.shouldSetParent()){
          MongooseArray.prototype._concat.call(self, childrenIds);
        }
        self._markModified();
        callback(null, children);
      }();
    });
  });
};

hasMany.prototype.find = function (conditions, fields, options, callback) {
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
  }

  var throwErr = this.errorThrower(callback);

  var self            = this.path,
      parent          = self._parent,
      childModel      = this.getChildModel();
      childPath       = this.getInverse(),
      safeConditions  = {},
      childConditions = {},
      throwErr        = this.errorThrower(callback);

  if (!this.hasInverse()) {
    return throwErr('Parent model not referenced anywhere in the Child Schema');
  }

  merge(safeConditions, conditions);

  childConditions[childPath.name] = parent._id;
  merge(safeConditions, childConditions);

  if(this.shouldSetParent()) {
    merge(safeConditions, { _id: { $in: parent[self._path] } });
  }

  var query = childModel.find(safeConditions, options).select(fields);

  if (callback) {
    query.exec(callback);
  } else {
    return query;
  }
};

// XXX: Does not save parent
hasMany.prototype.delete = function (id, callback) {
  var throwErr = this.errorThrower(callback);

  var rel          = this,
      self         = this.path,
      parent       = self._parent,
      relationship = this.getRelationship();
      childModel   = this.getChildModel();
      childPath    = this.getInverse();
      child        = null;

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

  var hasOrFetchChild = function(done){
    if(child){
      done(null, child);
    } else {
      childModel.findById(id, done);
    };
  };

  if (rel.shouldSetParent()) {
    MongooseArray.prototype._remove.call(self, id);
  }

  var callbackForRemoveOrSave = function(err) {
    if (err) { return callback(err); }
    if (rel.shouldSetParent()) {
      parent.save(callback);
    } else {
      callback(null, parent);
    }
  };

  if (!!~['delete', 'destroy'].indexOf(relationship.options.dependent)){
    childModel.remove({ _id: id }, callbackForRemoveOrSave);
  } else if (relationship.options.dependent === 'nullify') {
    hasOrFetchChild( function(err, child) {
      if (err) { return callback(err) };
      child.set(childPath.name, null);
      child.save(callbackForRemoveOrSave);
    });
  } else {
    callback(null, parent);
  }
};

hasMany.prototype.populate = function (fields, callback) {
  if ('function' == typeof fields) {
    callback = fields;
    fields = null;
  }

  var self     = this.path,
      parent   = self._parent,
      model    = parent.constructor,
      path     = self._path,
      throwErr = this.errorThrower(callback);

  if(!this.shouldSetParent()) {
    return throwErr('Cannot populate when setParent is false. Use #find.');
  }

  // TODO: do we really need to initialize a new doc?
  model.findById(parent._id).populate(path, fields).exec(callback);
};

extend(hasMany, CollectionMixin);

module.exports = hasMany;
