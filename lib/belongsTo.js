var ObjectId = require('mongoose').Schema.ObjectId,
    i = require('i')();

module.exports = function (schema, associationName, options) {
  options = options || {};
  var paths = {},
      pathName = associationName,
      idCast = {
        type: ObjectId,
        ref: (options.modelName || i.classify(associationName)),
        relationshipType: 'belongsTo',
        index: true,
        required: !!options.required
      };

  if (options.polymorphic) {
    idCast.polymorphic = true;

    var typeCast = {
      polymorphic: true,
      type: String,
      required: idCast.required,
      enum: options.enum
    };

    paths[pathName + '_type'] = typeCast;
  }

  paths[pathName] = idCast;

  schema.add(paths);

  if (options.touch) {
    schema.pre('save', function(next) {
      this.populate(associationName, function(err, model) {
        this[associationName].__touch(next);
      }.bind(this));
    });
  };
};
