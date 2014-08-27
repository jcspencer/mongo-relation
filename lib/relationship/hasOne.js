var Base = require('./base');

function hasOne (path) {
  this.type = 'hasOne';
  Base.call(this, path);
}

hasOne.prototype.__proto__ = Base;

module.exports = hasOne;
