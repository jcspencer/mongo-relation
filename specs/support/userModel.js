var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  name:      String,
  someArray: [ mongoose.Schema.Types.ObjectId ]
});

UserSchema.hasMany('Tweet', { dependent: 'delete' });
UserSchema.hasMany('Tag',   { dependent: 'nullify'});
UserSchema.hasOne( 'Post',  { through:   'post'   });

module.exports = mongoose.model('User', UserSchema);
