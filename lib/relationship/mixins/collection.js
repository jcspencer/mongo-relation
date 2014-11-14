var async = require('async')
  , utils = require('../../utils');

module.exports.build = function(objs){
  var relationship = this;

  if (Array.isArray(objs)) {
    return objs.map(function (obj) { return relationship._buildOne(obj); });
  } else {
    return relationship._buildOne(objs);
  }
};

module.exports.create = function (objs, callback) {
  var create,
      completeHander,
      relationship = this,
      self         = relationship._path,
      parent       = relationship._parent,
      throwErr     = utils.throwErr(callback);

  create = function(doc, next){
    createOne.call(relationship, doc, next);
  };

  completeHander = function(err, docs){
    if(err){ return throwErr(err) };
    parent.save(function(err, parent){
      if(err){
        throwErr(err);
      } else {
        callback(err, parent, docs);
      }
    });
  };

  objs = this.build(objs);

  if(Array.isArray(objs)){
    async.mapSeries(objs, create, completeHander);
  } else {
    createOne.call(relationship, objs, completeHander);
  }
};

// Collection style relationship setup
module.exports.setup = function (path) {
  // Cache relationship options
  this._options = path._schema.options;

  // Cache the relationship from Parent to Child
  this._childModelName = this._options.relationshipModel;

  // Cache reference to parent
  this._parent = path._parent;
  this._parentModelName = this._parent.constructor.modelName;

  // Cache allowed discriminators
  var model = mongoose.model(this._options.relationshipModel);
  this._allowed_discriminators = [ model.modelName ].concat(Object.keys(model.discriminators || {}));

  // Cache the relationship from Child to Parent
  for (var path in model.schema.paths) {
    var options = model.schema.paths[path].options;
    if(options.relationshipModel == this._parentModelName){
      options.name = path;
      this._childToParent = options
    }
  }
};

// privates

var createOne = function(doc, callback){
  var throwErr = utils.throwErr(callback);

  if (!this._validForCreate(doc)) {
    return throwErr('Parent model not referenced anywhere in the Child Schema');
  }

  doc.save(callback);
};
