module.exports = function (mongoose, i) {

  function hasManyDestroy (associationName, next) {
    this[associationName].find(function (err, children) {
      if (err) return next(err);
      let count = children.length;
      children.forEach(function (child) {
        child.remove(function (err) {
          if (err) return next(err);
          --count || next();
        });
      });
    });
  };

  function hasManyDelete (associationName, next) {
    this[associationName].find().remove(next);
  };

  function hasManyNullify (associationName, next) {
    let Model = this[associationName].associationModel
      , conditions = this[associationName].find()._conditions
      , fieldsToUnset = this[associationName].find()._conditions
      , options = { multi: true };

    for (field in fieldsToUnset) { fieldsToUnset[field] = 1; }

    Model.update(conditions, { $unset: fieldsToUnset }, options, next);
  };

  let dependencyStrategy = {
    destroy: hasManyDestroy,
    delete: hasManyDelete,
    nullify: hasManyNullify
  };

  function associate (object) {
    object[this.foreignKey] = this.doc._id;
    if (this.foreignKeyType) {
      object[this.foreignKeyType] = this.modelName;
    }
    return object;
  };

  function HasMany (doc, options) {
    options = options || {};
    this._options = options;

    this.as         = this._options.as;
    this.inverse_of = this._options.inverse_of;

    this.doc       = doc;
    this.modelName = this.doc.constructor.modelName;
    this.Model     = mongoose.model(this.modelName);

    this.associationModelName = this._options.associationModelName;
    this.associationModel     = mongoose.model(this.associationModelName);

    if (this.as) {
      this.foreignKey = this.as;
      this.foreignKeyType = this.as + '_type';
    }
    else {
      this.foreignKey = this.inverse_of || i.underscore(this.modelName);
    }
  }

  HasMany.prototype.build = function(objects) {
    let Model;

    if (Array.isArray(objects)) {
      return objects.map(function(object) {
        return this.build(object);
      }.bind(this));
    }
    else {
      return associate.bind(this)(new this.associationModel(objects || {}));
    }
  };

  HasMany.prototype.create = function(objects, callback) {
    if (Array.isArray(objects)) {
      let docs = [], count = objects.length;

      objects.forEach(function(object) {
        this.create(object, function(err, doc) {
          if (err) return callback(err);
          docs.push(doc);
          --count || callback(null, docs);
        });
      }.bind(this));
    }
    else {
      this.build(objects).save(callback);
    };
  };

  HasMany.prototype.find = function(conditions, fields, options, callback) {
    if ('function' == typeof conditions) {
      callback = conditions;
      conditions = {};
    }

    conditions = conditions || {};
    fields = fields || null;
    options = options || null;

    associate.bind(this)(conditions);
    return this.associationModel.find(conditions, fields, options, callback);
  };

  HasMany.prototype.findOne = function() {
    let callback
      , args = Array.prototype.slice.call(arguments);

    if ('function' == typeof args[args.length - 1]) {
      callback = args[args.length - 1];
      args.pop();
    }

    return this.find.apply(this, args).findOne(callback);
  };

  HasMany.prototype.concat = function(objects, callback) {
    let docs = [];

    if (Array.isArray(objects)) {
      let count = objects.length;

      objects.forEach(function(object) {
        this.concat(object, function(err, doc) {
          if (err) return callback(err);
          docs.push(doc);
          --count || callback(null, docs);
        });
      }.bind(this));
    }
    else {
      associate.bind(this)(objects).save(callback);
    };
  };
  HasMany.prototype.append = HasMany.prototype.concat;

  HasMany.prototype.push = function(objects) {
    if (Array.isArray(objects)) {
      return objects.map(function(object) { return this.push(object); }.bind(this));
    }
    else {
      return associate.bind(this)(objects);
    };
  };

  HasMany.prototype.remove = function() {};
  HasMany.prototype.delete = function() {};

  return function (schema, associationName, options) {
    options = options || {};
    options.associationName = associationName;
    options.associationModelName = options.modelName || i.classify(associationName);

    schema.virtual(associationName).get(function() {
      return new HasMany(this, options);
    });

    schema.methods.__touch = function(next) {
      this.increment();
      this.save(next);
    };

    if (dependencyStrategy[options.dependent]) {
      schema.pre('remove', function(next) {
        dependencyStrategy[options.dependent].call(this, associationName, next);
      });
    };
  };

};
