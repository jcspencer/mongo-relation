var Base            = require('./base'),
    utils           = require('../utils'),
    extend          = utils.extend,
    merge           = utils.merge,
    MongooseArray   = require('mongoose').Types.Array,
    CollectionMixin = require('./mixins/collection');

function hasAndBelongsToMany (path) {
  this.type = 'habtm';
  Base.call(this, path);
}

hasAndBelongsToMany.prototype.__proto__ = Base;

hasAndBelongsToMany.prototype.shouldSetChild = function () {
  return !!this.path._schema.options.setChild;
};

hasAndBelongsToMany.prototype.buildOne = function(obj){
  var self       = this.path,
      parent     = self._parent,
      childModel = this.getChildModel();
      childPath  = this.getInverse();

  var child = new childModel(obj);
  parent[self._path].push(child);

  if (this.shouldSetChild()) {
    child[childPath.name].push(parent);
  }

  return child;
};

hasAndBelongsToMany.prototype.append = function(child, callback){
  var self         = this.path,
      parent       = self._parent,
      relationship = this.getRelationship(),
      childPath    = this.getInverse(),
      throwErr     = this.errorThrower(callback);

  // TODO: abstract me
  if (child.constructor.modelName !== relationship.ref) {
    return throwErr('Wrong Model type');
  }

  if (this.shouldSetChild()) {
    child[childPath.name].push(parent._id);
  }

  parent[self._path].push(child._id);

  if (!callback) {
    return child;
  } else {
    child.save(callback);
  }
};

hasAndBelongsToMany.prototype.validForCreate = function () {
  if (this.shouldSetChild()) {
    return this.hasInverse()
  } else {
    return true
  }
}

// XXX: does not save parent
hasAndBelongsToMany.prototype.concat = function(children, callback){
  var throwErr = this.errorThrower(callback);

  if (!Array.isArray(children))
    return throwErr('First argument needs to be an Array');

  var self        = this.path,
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
        MongooseArray.prototype._concat.call(self, childrenIds);
        self._markModified();
        callback(null, children);
      }();
    });
  });
};

hasAndBelongsToMany.prototype.find = function(conditions, fields, options, callback){
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

  var self           = this.path,
      parent         = self._parent,
      childModel     = this.getChildModel();
      childPath      = this.getInverse(),
      safeConditions = {},
      throwErr       = this.errorThrower(callback);

  merge(safeConditions, conditions);

  if (this.shouldSetChild()) {
    if (!this.hasInverse()) {
      return throwErr('Parent model not referenced anywhere in the Child Schema');
    }

    var childConditions = {};
    childConditions[childPath.name] = parent._id;
    merge(safeConditions, childConditions);
  }

  merge(safeConditions, { _id: { $in: parent[self._path] } });

  var query = childModel.find(safeConditions, options).select(fields);

  if (callback) {
    query.exec(callback);
  } else {
    return query;
  }
};

// XXX: Does not save parent
hasAndBelongsToMany.prototype.delete = function (id, callback) {
  var throwErr = this.errorThrower(callback);

  var self         = this.path,
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

  // TODO: is this needed?
  // I think this removing the id from the instance array
  // however, it could be not needed
  MongooseArray.prototype._remove.call(self, id);

  // TODO: shold habtm support delete and destroy?
  if (!!~['delete', 'destroy', 'nullify'].indexOf(relationship.options.dependent)){
    hasOrFetchChild(function(err, child){
      if (err) { return callback(err) };
      child[childPath.name].remove(parent._id);
      child.save(function(err, child){
        if (err){
          callback(err);
        } else {
          callback(null, parent);
        }
      });
    });
  } else {
    callback(null, parent);
  }
};

hasAndBelongsToMany.prototype.populate = function(fields, callback){
  if ('function' == typeof fields) {
    callback = fields;
    fields = null;
  }

  var self     = this.path,
      parent   = self._parent,
      model    = parent.constructor,
      path     = self._path;

  return model.findById(parent._id).populate(path, fields).exec(callback);
};

extend(hasAndBelongsToMany, CollectionMixin);

module.exports = hasAndBelongsToMany;
