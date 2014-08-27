var types = {
  hasMany:   require('./hasMany'),
  habtm:     require('./hasAndBelongsToMany'),
  belongsTo: require('./belongsTo'),
  hasOne:    require('./hasOne'),
}

function Relationship (path) {
  var relationshipType = path._schema.options.relationshipType;
  if(!relationshipType){
    throw new Error('Path ' + "'" + path._schema.path + "' doesn't contain a relationship");
  }
  return new types[relationshipType](path);
}

module.exports = Relationship;
