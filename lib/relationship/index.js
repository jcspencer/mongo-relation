var types = {
  habtm: require('./hasAndBelongsToMany'),
}

function Relationship (path) {
  var relationshipType = path._schema.options.relationshipType;
  if(!relationshipType){
    throw new Error('Path ' + "'" + path._schema.path + "' doesn't contain a relationship");
  }
  return new types[relationshipType](path);
}

module.exports = Relationship;
