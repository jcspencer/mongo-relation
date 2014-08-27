module.exports.build = function(objs){
  var rel        = this,
      self       = this.path,
      parent     = self._parent,
      childModel = this.getChildModel();
      childPath  = this.getInverse();

  if (Array.isArray(objs)) {
    return objs.map(function (obj) { return rel.buildOne(obj); });
  } else {
    return this.buildOne(objs);
  }
};

module.exports.create = function (objs, callback) {
  var self        = this.path,
      parent      = self._parent,
      childModel  = this.getChildModel();
      childSchema = childModel.schema,
      childPath   = this.getInverse(),
      throwErr    = this.errorThrower(callback);

  if (!this.validForCreate()) {
    return throwErr('Parent model not referenced anywhere in the Child Schema');
  }

  objs = this.build(objs);

  if (Array.isArray(objs)) {
    var created = [],
        total   = objs.length;

    objs.forEach(function (obj, i) {
      obj.save(function (err, obj) {
        if (err) {
          objs.splice(i, objs.length - i);
          return callback(err);
        }
        created.push(obj);
        --total || parent.save(function (err, parent) {
          if (err) { return callback(err) };
          callback(null, parent, created);
        });
      });
    });
  } else {
    objs.save(function (err, obj) {
      if (err) { return callback(err) };
      parent.save(function (err, parent) {
        if (err) { return callback(err) };
        callback(null, parent, obj);
      });
    });
  }
};
