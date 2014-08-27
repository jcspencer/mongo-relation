var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  name: String
});

UserSchema.hasMany('Tag',          { dependent: 'nullify'});
UserSchema.hasMany('Tweet',        { dependent: 'delete' });
UserSchema.hasOne( 'Post',         { through:   'post'   });
UserSchema.hasMany('Notification', { setParent: false, dependent: 'delete'  });
UserSchema.hasMany('Address',      { setParent: false, dependent: 'nullify' });
UserSchema.hasMany('Category',     { through: 'categories' });

module.exports = mongoose.model('User', UserSchema);
