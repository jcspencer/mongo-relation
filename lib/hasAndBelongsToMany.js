module.exports = function (mongoose, i, utils) {


  return function hasAndBelongsToMany (schema, model, options) {
    this.type = 'habtm';

    this.schema  = schema;
    this.model   = model;
    this.options = options || {};

    this.pathName = this.options.through || i.pluralize(this.model.toLowerCase());

    let path = {};
    path[this.pathName] = [{ type: mongoose.Schema.ObjectId, index: true, ref: this.model }];
    this.schema.add(path);

    this.schema.paths[this.pathName].options[this.type] = this.model;
    this.schema.paths[this.pathName].options.relationshipType = this.type;
    this.schema.paths[this.pathName].options.relationshipModel = this.model;

    if (this.options.dependent) {
      this.schema.paths[this.pathName].options.dependent = this.options.dependent;
    }

    let setChild = this.options.hasOwnProperty('setChild') ? this.options.setChild : true;
    this.schema.paths[this.pathName].options.setChild = setChild;

    if (!this.schema.paths[this.pathName].options.setChild) {
      if (this.schema.paths[this.pathName].options.dependent == 'nullify') {
        throw new Error("dependent cannot be set to 'nullify' while setChild is false");
      }

      if (this.schema.paths[this.pathName].options.dependent == 'destroy') {
        throw new Error("dependent cannot be set to 'destroy' while setChild is false");
      }
    };
  };

  /* Builds the instance of the child element
  *
  * @param {Object|Array} objs
  * @return {Document|Array}
  * @api public
  */

  // mongoose > 3.9.x support
  let MongooseArray = mongoose.Types.Array;
  let base = MongooseArray.mixin || MongooseArray.prototype;

  base.build = function (objs) {
    let childModelName = this._schema.options.relationshipModel;

    let buildOne = function(obj){
      let childModel = mongoose.model(obj.__t || childModelName)
        , child = new childModel(obj);

      this._parent[this._path].push(child);

      if (!!this._schema.options.setChild) {

        // start remove me asap
        // needed for this._childToParent.name
        model = mongoose.model(this._schema.options.relationshipModel);
        for (let path in model.schema.paths) {
          options = model.schema.paths[path].options;
          ref = (options.relationshipModel || options.ref);
          if(ref == this._parent.constructor.modelName){
            options.name = path;
            this._childToParent = options
          }
        }
        // end remove me asap

        child[this._childToParent.name].push(this._parent);
      }

      return child;
    }.bind(this);

    if (Array.isArray(objs)) {
      return objs.map(buildOne);
    } else {
      return buildOne(objs);
    }
  };

  /* Create a child document and add it to the parent `Array`
  *
  * @param {Object|Array} objs [object(s) to create]
  * @param {Functions} callback [passed: (err, parent, created children)]
  * @api public
  */

  base.create = function (objs, callback) {
    objs = this.build(objs);

    let complete = function(err, docs){
      this._parent.save(function(err){
        callback(err, this._parent, docs);
      }.bind(this));
    }.bind(this);

    let validForCreate = function(doc){
      if (!!this._schema.options.setChild) {

        // start remove me asap
        // needed for this._childToParent.name
        model = mongoose.model(this._schema.options.relationshipModel);

        for (let path in model.schema.paths) {
          options = model.schema.paths[path].options;
          ref = (options.relationshipModel || options.ref);
          if(ref == this._parent.constructor.modelName){
            options.name = path;
            this._childToParent = options
          }
        }

        this._allowed_discriminators = [ model.modelName ].concat(Object.keys(model.discriminators || {}));
        let childIsAllowed = function (child) {
          return !!~this._allowed_discriminators.indexOf(child.constructor.modelName);
        }.bind(this);

        // end remove me asap

        return !!this._childToParent && childIsAllowed(doc);
      } else {
        return true
      }
    }.bind(this);

    let createOne = function(doc, done){
      if (!validForCreate(doc))
        return done(new Error('Parent model not referenced anywhere in the Child Schema'));
      doc.save(done);
    };

    if(Array.isArray(objs)){
      let count = objs.length, docs = [];

      objs.forEach(function(obj){
        createOne(obj, function(err, doc){
          if (err) return complete(err);
          docs.push(doc);
          --count || complete(null, docs);
        }.bind(this));
      }.bind(this));
    }
    else {
      createOne(objs, complete);
    }
  };

  /* Append an already instantiated document saves it in the process.
  *
  * @param {Document} child
  * @param {Function} callback
  * @api public
  */

  base.append = function (child, callback) {

    // start remove me asap
    // needed for this._childToParent.name
    model = mongoose.model(this._schema.options.relationshipModel);

    for (let path in model.schema.paths) {
      options = model.schema.paths[path].options;
      ref = (options.relationshipModel || options.ref);
      if(ref == this._parent.constructor.modelName){
        options.name = path;
        this._childToParent = options
      }
    }

    this._allowed_discriminators = [ model.modelName ].concat(Object.keys(model.discriminators || {}));
    let childIsAllowed = function (child) {
      return !!~this._allowed_discriminators.indexOf(child.constructor.modelName);
    }.bind(this);

    // end remove me asap

    // TODO: abstract me
    if(!childIsAllowed(child)) {
      return throwErr('Wrong Model type');
    }

    if (!!this._schema.options.setChild) {
      child[this._childToParent.name].push(this._parent._id);
    }

    this._parent[this._path].push(child._id);

    callback && child.save(callback);
    return child;
  };

  /* Append many instantiated children documents
  *
  * @param {Array} children
  * @param {Function} callback
  * @api public
  */
  base._concat = Array.prototype.concat;
  base.concat = function (docs, callback) {
    let throwErr = utils.throwErr(callback);

    if (!Array.isArray(docs)){
      return throwErr('First argument needs to be an Array');
    };

    let complete = function(err, docs) {
      if(err){ return throwErr(err) }

      let ids = docs.map(function (doc) { return doc._id });
      this._concat(ids);
      this._markModified();

      callback(null, docs);
    }.bind(this);

    let count = docs.length;
    let savedDocs = [];
    docs.forEach(function(doc){
      this.append(doc);
      doc.save(function(err, doc){
        if(err) return complete(err);

        savedDocs.push(doc);
        --count || complete(null, savedDocs);
      });
    }.bind(this));

  };

  /* Find children documents
  *
  * *This is a copy of Model.find w/ added error throwing and such*
  */
  base.find = function (conditions, fields, options, callback) {
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

    // start remove me asap
    // needed for this._childToParent.name
    model = mongoose.model(this._schema.options.relationshipModel);
    for (let path in model.schema.paths) {
      options = model.schema.paths[path].options;
      ref = (options.relationshipModel || options.ref);
      if(ref == this._parent.constructor.modelName){
        options.name = path;
        this._childToParent = options
      }
    }
    // end remove me asap

    let childModel     = mongoose.model(this._schema.options.relationshipModel);
        childPath      = this._childToParent;
        safeConditions = {},
        throwErr       = utils.throwErr(callback);

    utils.merge(safeConditions, conditions);

    if (!!this._schema.options.setChild) {
      if (!childPath) {
        return throwErr('Parent model not referenced anywhere in the Child Schema');
      }

      let childConditions = {};
      childConditions[childPath.name] = this._parent._id;
      utils.merge(safeConditions, childConditions);
    }

    utils.merge(safeConditions, { _id: { $in: this._parent[this._path] } });

    let query = childModel.find(safeConditions, options).select(fields);

    callback && query.exec(callback);
    return query;
  };

  /* Syntactic sugar to populate the array
  *
  * @param {Array} fields
  * @param {Function} callback
  * @return {Query}
  * @api public
  */
  base.populate = function (fields, callback) {
    if ('function' == typeof fields) {
      callback = fields;
      fields = null;
    }

    // TODO: do we really need to initialize a new doc?
    return this._parent.constructor
      .findById(this._parent._id)
      .populate(this._path, fields)
      .exec(callback);
  };

  /* Overrides MongooseArray.remove only for dependent:destroy relationships
  *
  * @param {ObjectId} id
  * @param {Function} callback
  * @return {ObjectId}
  * @api public
  */
  base._remove = base.remove;
  base.remove = base.delete = function (id, callback) {
    let parent     = this._parent,
        childModel = mongoose.model(this._schema.options.relationshipModel);
        childPath  = this._childToParent;
        child      = null,
        throwErr   = utils.throwErr(callback);

    if (id._id) {
      let child = id;
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

    let hasOrFetchChild = function(done){
      if(child){
        done(null, child);
      } else {
        childModel.findById(id, done);
      };
    };

    // TODO: is this needed?
    // I think this removing the id from the instance array
    // however, it could be not needed
    this._remove(id);

    // TODO: shold habtm support delete and destroy?
    if (!!~['delete', 'destroy', 'nullify'].indexOf(this._schema.options.dependent)){
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
};
