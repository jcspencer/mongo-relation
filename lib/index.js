'use strict';

let i = require('i')();
let utils = require('./utils');

module.exports = function mongooseRelation (mongoose) {

  //let belongsTo = require('./belongsTo')(mongoose, i);
  let hasMany = require('./hasMany')(mongoose, i);
  let hasAndBelongsToMany = require('./hasAndBelongsToMany')(mongoose, i, utils);

  mongoose.Schema.prototype.belongsTo = require('./belongsTo')(mongoose, i);

  mongoose.Schema.prototype.hasMany = function (model, options) {
    hasMany(this, model, options);
  };

  mongoose.Schema.prototype.habtm = function (model, options) {
    new hasAndBelongsToMany(this, model, options);
  };

  return mongoose;

};
