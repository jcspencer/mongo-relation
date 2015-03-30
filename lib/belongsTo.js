var ObjectId = require('mongoose').Schema.ObjectId,
    i = require('i')();

module.exports = function (schema, associationName, options) {
  options = options || {};
  var path = {},
      pathName = associationName,
      idCast = {
        type: ObjectId,
        ref: (options.modelName || i.classify(associationName)),
        relationshipType: 'belongsTo',
        index: true
      },
      typeCast = { polymorphic: true, type: String };

  if(options.required){
    typeCast.required = idCast.required = true;
  }

  if(options.polymorphic){
    idCast.polymorphic = true;
    path[pathName + '_type'] = typeCast;
  }

  path[pathName] = idCast;

  schema.add(path);

  if(options.touch){
    schema.pre('save', function(next){
      this.populate(associationName, function(err, model){
        this[associationName].__touch(next);
      }.bind(this));
    });
  };
};
