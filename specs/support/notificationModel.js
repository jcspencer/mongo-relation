var mongoose = require('mongoose');

var NotificationSchema = new mongoose.Schema({
  message: String
});

NotificationSchema.belongsTo('User');

module.exports = mongoose.model('Notification', NotificationSchema);
