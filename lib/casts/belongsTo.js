var ObjectId = require('mongoose').Schema.ObjectId,
    i = require('i')();

module.exports = function (schema, modelName, options) {
  options = options || {};
  var path = {},
      pathName = i.underscore(modelName),
      idCast = { type: ObjectId, ref: modelName, relationshipType: 'belongsTo', index: true },
      typeCast = { polymorphic: true, type: String };

  if(options.modelName){
    idCast.ref = options.modelName;
  }

  if(options.required){
    typeCast.required = idCast.required = true;
  }

  if(options.polymorphic){
    idCast.polymorphic = true;
    path[pathName + '_type'] = typeCast;
  }

  path[pathName] = idCast;

  schema.add(path);
};
