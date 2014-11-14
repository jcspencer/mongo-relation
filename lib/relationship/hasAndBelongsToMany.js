var Base            = require('./base'),
    async           = require('async')
    utils           = require('../utils'),
    extend          = utils.extend,
    merge           = utils.merge,
    mongoose        = require('mongoose'),
    MongooseArray   = mongoose.Types.Array,
    CollectionMixin = require('./mixins/collection');

function hasAndBelongsToMany (path) {
  Base.call(this, path);
  this.setup(path);
  this.type = 'habtm';
}

hasAndBelongsToMany.prototype.__proto__ = Base;

hasAndBelongsToMany.prototype.append = function(child, callback){
  var self      = this._path,
      parent    = self._parent,
      childPath = this._childToParent;
      throwErr  = utils.throwErr(callback);

  // TODO: abstract me
  if(!childIsAllowed.call(this, child)) {
    return throwErr('Wrong Model type');
  }

  if (shouldSetChild.call(this)) {
    child[childPath.name].push(parent._id);
  }

  parent[self._path].push(child._id);

  callback && child.save(callback);
  return child;
};

// XXX: does not save parent
hasAndBelongsToMany.prototype.concat = function(children, callback){
  var throwErr = utils.throwErr(callback);

  if (!Array.isArray(children)){
    return throwErr('First argument needs to be an Array');
  };

  var self     = this._path,
      children = children.map(function (child) { return self.append(child); });

  var saveChild = function(child, next) {
    child.save(next);
  };

  var completeHandler = function(err, savedChildren) {
    if(err){ return throwErr(err) }

    var ids = savedChildren.map(function (child) { return child._id });
    MongooseArray.prototype._concat.call(self, ids);

    self._markModified();
    callback(null, savedChildren);
  };

  async.mapSeries(children, saveChild, completeHandler);
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

  var self           = this._path,
      parent         = self._parent,
      childModel     = this.getChildModel(this._childModelName);
      childPath      = this._childToParent;
      safeConditions = {},
      throwErr       = utils.throwErr(callback);

  merge(safeConditions, conditions);

  if (shouldSetChild.call(this)) {
    if (!childPath) {
      return throwErr('Parent model not referenced anywhere in the Child Schema');
    }

    var childConditions = {};
    childConditions[childPath.name] = parent._id;
    merge(safeConditions, childConditions);
  }

  merge(safeConditions, { _id: { $in: parent[self._path] } });

  var query = childModel.find(safeConditions, options).select(fields);

  callback && query.exec(callback);
  return query;
};

// XXX: Does not save parent
hasAndBelongsToMany.prototype.delete = function (id, callback) {
  var self       = this._path,
      parent     = self._parent,
      childModel = this.getChildModel(this._childModelName);
      childPath  = this._childToParent;
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
  if (!!~['delete', 'destroy', 'nullify'].indexOf(this._options.dependent)){
    hasOrFetchChild(function(err, child){
      if (err) { return throwErr(err) };
      child[childPath.name].remove(parent._id);
      child.save(function(err, child){
        if (err){ return throwErr(err) };
        callback(null, parent);
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

  var self     = this._path,
      parent   = self._parent,
      model    = parent.constructor,
      path     = self._path;
      throwErr = utils.throwErr(callback);

  // TODO: do we really need to initialize a new doc?
  return model.findById(parent._id).populate(path, fields).exec(callback);
};

extend(hasAndBelongsToMany, CollectionMixin);

// private not private

hasAndBelongsToMany.prototype._buildOne = function(childObj){
  return buildOne.call(this, childObj);
};

hasAndBelongsToMany.prototype._validForCreate = function(doc){
  if (shouldSetChild.call(this)) {
    return !!this._childToParent && childIsAllowed.call(this, doc);
  } else {
    return true
  }
};

// privates

var shouldSetChild = function () {
  return !!this._path._schema.options.setChild;
};

var buildOne = function(childObj){
  var self       = this._path,
      parent     = self._parent,
      childModel = this.getChildModel(childObj.__t || this._childModelName);
      childPath  = this._childToParent;

  var child = new childModel(childObj);
  parent[self._path].push(child);

  if (shouldSetChild.call(this)) {
    child[childPath.name].push(parent);
  }

  return child;
};

var childIsAllowed = function(child) {
  return !!~this._allowed_discriminators.indexOf(child.constructor.modelName);
};

module.exports = hasAndBelongsToMany;
