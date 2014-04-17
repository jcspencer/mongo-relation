var start = require('./common')
  , should = require('should')
  , mongoose = start.mongoose
  , random = require('../lib/utils').random
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , relationships = require('../index');

/**
 * Blog Schema
 * "belongs to one editor"
 */
var BlogSchema = new Schema({
    title      : String
  , editor     : ObjectId
});

/**
 * Admin Schema
 * "has one blog"
 */
var AdminSchema = new Schema({
    name : String
  , blog : ObjectId
});

/**
 * Attach the plugin to the schemas
 */
BlogSchema.belongsTo('Admin', { through: "editor" });
AdminSchema.hasOne('Blog', { through: "blog" });

/**
 * Register the models with Mongoose
 */
mongoose.model('Blog', BlogSchema)
mongoose.model('Admin', AdminSchema);

var blogs = 'blogs_' + random()
  , admins = 'admins_' + random();

/**
 * Tests
 */

module.exports = {

  'test parent schema hasOne path': function() {
    AdminSchema.paths['blog'].options.hasOne.should.equal('Blog');
  },

  'test child schema belongsTo path': function() {
    BlogSchema.paths['editor'].options.belongsTo.should.equal('Admin');
  },

  //'test presence of create method in parent document': function() {
    //var db = start()
      //, Admin = db.model('Admin', admins)
      //, admin = new Admin();

    //admin.blog.create.should.be.a.Function;
    //db.close()
  //},

  //'test create child document': function() {
    //var db = start()
      //, Admin = db.model('Admin', admins)
      //, Blog = db.model('Blog', blogs)
      //, admin = new Admin();

    //var blog = {title: "Deep thinking, by a mongoose."};

    //admin.blog.create(blog, function(err, admin, blog){
      //should.strictEqual(err, null);

      //admin.should.be.an.instanceof(Admin);

      //admin.blog.should.eql(blog._id);

      //blog.should.be.an.instanceof(Blog);
      //blog.title.should.equal("Deep thinking, by a mongoose.");
      //blog.editor.should.equal(admin._id);

      //db.close();
    //});
  //},

  //'test find child document': function(){
    //var db = start()
      //, Admin = db.model('Admin', admins)
      //, Blog = db.model('Blog', blogs)
      //, admin = new Admin();

    //var blog = {title: "Deep thinking, by a mongoose."};

    //admin.blog.create(blog, function(err, admin, blog){
      //var find = admin.blog.find(function(err, newBlog){
        //should.strictEqual(err, null);

        //find.should.be.an.instanceof(mongoose.Query);
        //find._conditions.should.have.property('_id');
        //find._conditions.should.have.property('editor');
        //find.op.should.equal('findOne');
        
        //admin.blog.should.equal(newBlog._id);
        //newBlog.should.be.an.instanceof(Blog);
        //newBlog.editor.should.eql(admin._id);
        
        //db.close()
      //});
    //});
  //}
};
