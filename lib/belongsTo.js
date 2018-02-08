'use strict';

module.exports = function (mongoose, i) {

  return function (associationName, options) {
    options = options || {};
    let paths = {};
    let pathName = associationName;
    let idCast = {
      type: mongoose.Schema.ObjectId,
      ref: (options.modelName || i.classify(associationName)),
      relationshipType: 'belongsTo',
      index: true,
      required: !!options.required
    };

    if (options.polymorphic) {
      idCast.polymorphic = true;

      let typeCast = {
        polymorphic: true,
        type: String,
        required: idCast.required,
        enum: options.enum
      };

      paths[pathName + '_type'] = typeCast;
    }

    paths[pathName] = idCast;

    this.add(paths);

    if (options.touch) {
      this.pre('save', function (next) {
        this.populate(associationName, (err, model) => {
          this[associationName].__touch(next);
        });
      });
    };
  };
};
