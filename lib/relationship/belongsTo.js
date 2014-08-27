var Base = require('./base');

function belongsTo (path) {
  this.type = 'belongsTo';
  Base.call(this, path);
}

belongsTo.prototype.__proto__ = Base;

module.exports = belongsTo;
