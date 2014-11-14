var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  name: String
});

userSchema.hasMany('Tag',          { dependent: 'nullify'});
userSchema.hasMany('Tweet',        { dependent: 'delete' });
userSchema.hasOne( 'Post',         { through:   'post'   });
userSchema.hasMany('Notification', { setParent: false, dependent: 'delete'  });
userSchema.hasMany('Address',      { setParent: false, dependent: 'nullify' });
userSchema.hasMany('Category',     { through: 'categories' });
userSchema.habtm('Pet',            { setParent: false })

module.exports = mongoose.model('User', userSchema);
