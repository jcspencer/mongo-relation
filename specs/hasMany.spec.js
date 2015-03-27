require('./spec_helper');

var mongoose = require('mongoose')
  , async    = require('async')
  , should   = require('should');

describe('hasMany without options', function(){
  var userSchema, User, user, widgetSchema, Widget, widget;

  before(function(){
    widgetSchema = mongoose.Schema({ name: String });
    widgetSchema.belongsTo('user');
    Widget = mongoose.model('Widget', widgetSchema);

    userSchema = new mongoose.Schema({});
    userSchema.hasMany('widgets');
    User = mongoose.model('User', userSchema);
  });

  describe('schema', function(){
    it('has a virtual to represent the relationship', function(){
      should(userSchema.virtuals.widgets).not.equal(undefined);
      should(userSchema.virtuals.widgets.path).equal('widgets');
    });
  });

  describe('instance', function(){
    before(function(){
      user = new User();
    });

    it('returns a relationship', function(){
      should(user.widgets.build).be.a.Function;
      should(user.widgets.create).be.a.Function;
      should(user.widgets.find).be.a.Function;
      should(user.widgets.findOne).be.a.Function;
      should(user.widgets.append).be.a.Function;
      should(user.widgets.concat).be.a.Function;
      should(user.widgets.remove).be.a.Function;
      should(user.widgets.delete).be.a.Function;
    });
  });

  describe('build', function(){
    before(function(){
      user = new User();
    });

    it('instantiates one child document', function() {
      built = user.widgets.build({ name: 'Beam' });

      should(built).be.an.instanceof(Widget);
      should(built.user).eql(user._id);
      should(built.name).equal('Beam')
    });

    it('instantiates many children documents', function() {
      built = user.widgets.build([{}, {}]);

      built.forEach(function(widget){
        should(widget).be.an.instanceof(Widget);
        should(widget.user).eql(user._id);
      });
    });
  });

  describe('create', function(){
    before(function(){
      user = new User();
    });

    it('creates one child document', function(done) {
      user.widgets.create({ name: 'Beam' }, function(err, widget) {
        should.strictEqual(err, null);

        should(widget).be.an.instanceof(Widget);
        should(widget.name).equal('Beam')
        should(widget.user).equal(user._id);
        done();
      });
    });

    it('creates many child document', function(done) {
      user.widgets.create([{}, {}], function(err, widgets) {
        should.strictEqual(err, null);

        widgets.forEach(function(widget){
          should(widget).be.an.instanceof(Widget);
          should(widget.user).equal(user._id);
        });

        done();
      });
    });
  });

  describe('find', function(){
    var find;

    before(function(){
      user = new User();
    });

    it('returns a criteria', function() {
      find = user.widgets.find();
      should(find).be.instanceOf(mongoose.Query);
      should(find.op).equal('find');
      should(find.model.modelName).equal('Widget');
      should(find._conditions.user).equal(user._id);
    });

    it('handles query', function() {
      find = user.widgets.find({ title: 'Win' });
      should(find._conditions.title).equal('Win');
    });

    it('handles fields', function() {
      find = user.widgets.find({}, 'name');
      should(find._fields.name).eql(1);
    });

    it('handles options', function() {
      find = user.widgets.find({}, null, { skip: 6, limit: 3 });
      should(find.options.skip).eql(6);
      should(find.options.limit).eql(3);
    });

    describe('handling callbacks', function(){
      before(function(done){
        user.widgets.create([{ }, { }], done);
      });

      it('with conditions, fields, options, callback', function(done) {
        find = user.widgets.find({}, null, null, function(err, widgets){
          should(widgets).have.lengthOf(2);
          widgets.forEach(function(widget){
            should(widget).be.an.instanceof(Widget);
          });
          done();
        });

        should(find).be.instanceOf(mongoose.Query);
      });

      it('with conditions, fields, callback', function(done) {
        find = user.widgets.find({}, null, function(err, widgets){
          should(widgets).have.lengthOf(2);
          widgets.forEach(function(widget){
            should(widget).be.an.instanceof(Widget);
          });
          done();
        });

        should(find).be.instanceOf(mongoose.Query);
      });

      it('with conditions, callback', function(done) {
        find = user.widgets.find({}, function(err, widgets){
          should(widgets).have.lengthOf(2);
          widgets.forEach(function(widget){
            should(widget).be.an.instanceof(Widget);
          });
          done();
        });

        should(find).be.instanceOf(mongoose.Query);
      });

      it('with callback', function(done) {
        find = user.widgets.find(function(err, widgets){
          should(widgets).have.lengthOf(2);
          widgets.forEach(function(widget){
            should(widget).be.an.instanceof(Widget);
          });
          done();
        });

        should(find).be.instanceOf(mongoose.Query);
      });
    });

  });

  describe('findOne', function(){
    var find;

    before(function(done){
      user = new User();
      user.widgets.create([{ }, { }], done);
    });

    it('returns a findOne critera', function() {
      find = user.widgets.findOne();
      should(find).be.instanceOf(mongoose.Query);
      should(find.op).equal('findOne');
      should(find.model.modelName).equal('Widget');
      should(find._conditions.user).equal(user._id);
    });

    it('handles the callback correctly', function(done) {
      user.widgets.findOne(function(err, widget){
        should(widget.user).eql(user._id);
        done();
      });
    });
  });

  describe('concat', function(){
    var other_widget;

    before(function(){
      user = new User();
      widget = new Widget();
      otherWidget = new Widget();

      should(widget.isNew).be.true;
      should(otherWidget.isNew).be.true;
    });

    it('concatenates a single child', function(done) {
      user.widgets.concat(widget, function(err, concatenatedWidget){
        should(widget._id).eql(concatenatedWidget._id);
        should(widget.isNew).be.false;
        should(concatenatedWidget.isNew).be.false;

        should(widget.user).eql(user._id);
        should(concatenatedWidget.user).eql(user._id);

        done();
      });
    });

    it('concatenates many children', function(done) {
      user.widgets.concat([widget, otherWidget], function(err, concatenatedWidgets){
        should(concatenatedWidgets).have.lengthOf(2);

        should(widget._id).eql(concatenatedWidgets[0]._id);
        should(widget.user).eql(user._id);
        should(widget.isNew).be.false;
        should(concatenatedWidgets[0].user).eql(user._id);
        should(concatenatedWidgets[0].isNew).be.false;

        should(otherWidget._id).eql(concatenatedWidgets[1]._id);
        should(otherWidget.user).eql(user._id);
        should(otherWidget.isNew).be.false;
        should(concatenatedWidgets[1].user).eql(user._id);
        should(concatenatedWidgets[1].isNew).be.false;

        done();
      });
    });

  });

  describe('append', function(){
    before(function(){
      user = new User({});
    });

    it('is sugar for concat', function(){
      should(user.widgets.concat).eql(user.widgets.append);
    });
  });

  describe('push', function(){
    var otherWidget;

    before(function(){
      user = new User({});
      widget = new Widget({});
      otherWidget = new Widget({});
      should(widget.user).eql(undefined);
      should(otherWidget.user).eql(undefined);
    });

    it('adds relationship information to the child', function(){
      var returnedWidget = user.widgets.push(widget);
      should(widget.user).eql(user._id);
      should(returnedWidget.user).eql(user._id);
      should(returnedWidget._id).eql(widget._id);
    });

    it('adds relationship information to many children', function(){
      var returnedWidgets = user.widgets.push([ widget, otherWidget ]);
      should(widget.user).eql(user._id);
      should(otherWidget.user).eql(user._id);

      should(returnedWidgets[0].user).eql(user._id);
      should(returnedWidgets[0]._id).eql(widget._id);

      should(returnedWidgets[1].user).eql(user._id);
      should(returnedWidgets[1]._id).eql(otherWidget._id);
    });
  });

  describe.skip('remove', function(){
    before(function(done){
      user = new User({});
      user.widgets.create({}, function(err, widget_){
        widget = widget_;
        done();
      });
    });

    it('deletes the child', function(){
      // this interface doesn't seem practical
      user.widgets.remove(widget, function(){

      });
    });
  });

  describe('dependent:null', function(){
    before(function(done){
      new User().save(function(err, u){
        u.widgets.create({}, function(err, w){
          user = u;
          widget = w;
          done();
        });
      });
    });

    it('does nothing to children', function(done){
      user.remove(function(err){
        Widget.findById(widget._id, function(err, wadget){
          should(wadget).not.equal(null);
          done();
        });
      });
    });
  });
});

describe('hasMany dependent', function(){
  var postSchema, Post, post
    , likeSchema, Like, like, likeEventCalled = false
    , favoriteSchema, Favorite, favorite, favoriteEventCalled = false
    , repostSchema, Repost, repost, repostEventCalled = false;

  before(function(done){
    likeSchema = mongoose.Schema({});
    likeSchema.belongsTo('post');
    likeSchema.pre('remove', function(next){ Like.emit('destroy-test-event', this); next(); });
    Like = mongoose.model('Like', likeSchema);
    Like.once('destroy-test-event', function(){ likeEventCalled = true; });

    favoriteSchema = mongoose.Schema({});
    favoriteSchema.belongsTo('post');
    favoriteSchema.pre('remove', function(next){ Favorite.emit('destroy-test-event', this); next(); });
    Favorite = mongoose.model('Favorite', favoriteSchema);
    Favorite.once('destroy-test-event', function(){ favoriteEventCalled = true; });

    repostSchema = mongoose.Schema({});
    repostSchema.belongsTo('post');
    repostSchema.pre('remove', function(next){ Repost.emit('destroy-test-event', this); next(); });
    Repost = mongoose.model('Repost', repostSchema);
    Repost.once('destroy-test-event', function(){ repostEventCalled = true; });

    postSchema = new mongoose.Schema({});
    postSchema.hasMany('likes', { dependent: 'delete' });
    postSchema.hasMany('favorites', { dependent: 'destroy' });
    postSchema.hasMany('reposts', { dependent: 'nullify' });
    Post = mongoose.model('Post', postSchema);

    new Post().save(function(err, post){
      async.parallel({
        like: function(cb){ post.likes.create({}, cb); },
        favorite: function(cb){ post.favorites.create({}, cb); },
        repost: function(cb){ post.reposts.create({}, cb); },
      }, function(err, output){
        favorite = output.favorite[0];
        like = output.like[0];
        repost = output.repost[0];
        post.remove(done);
      });
    });
  });

  describe('delete', function(){
    it('removes children', function(done){
      Like.findById(like._id, function(err, like){
        should.strictEqual(like, null);
        done();
      });
    });

    it('does not run child middlewares', function(){
      should(likeEventCalled).be.false;
    });
  });

  describe('destroy', function(){
    it('removes children', function(done){
      Favorite.findById(favorite._id, function(err, favorite){
        should.strictEqual(favorite, null);
        done();
      });
    });

    it('runs child middlewares', function(){
      should(favoriteEventCalled).be.true;
    });
  });

  describe('nullify', function(){
    it('removes the parent reference from children', function(done){
      Repost.findById(repost._id, function(err, repost){
        should(repost.post).eql(undefined);
        should(repost).be.instanceOf(Repost);
        done();
      });
    });
  });
});

describe('hasMany polymorphic:true', function() {
  var tourSchema, Tour, tour, venueSchema, Venue, venue;

  before(function(){
    venueSchema = mongoose.Schema({ });
    venueSchema.belongsTo('playable', { polymorphic: true });
    Venue = mongoose.model('Venue', venueSchema);
    venue = new Venue();

    tourSchema = new mongoose.Schema({});
    tourSchema.hasMany('venues', { as: 'playable' });
    Tour = mongoose.model('Tour', tourSchema);
    tour = new Tour();
  });

  describe('push', function() {
    it('knows how to associate a polymorphic relationship', function() {
      should(venue.playable).eql(undefined);
      should(venue.playable_type).eql(undefined);

      tour.venues.push(venue);

      should(venue.playable).eql(tour._id);
      should(venue.playable_type).eql('Tour');
    });
  });

  describe('create', function() {
    it('creates a polymorphic child', function(done) {
      tour.venues.create({}, function(err, venue) {
        should.strictEqual(err, null);

        venue.should.be.an.instanceof(Venue);
        venue.playable.should.equal(tour._id);
        venue.playable_type.should.equal('Tour');
        done();
      });
    });
  });

  describe('concat', function() {
    it('concats a child polymorphicly', function(done) {
      tour.venues.concat(venue, function(err, venue) {
        should.strictEqual(err, null);

        should(venue.playable).eql(tour._id);
        should(venue.playable_type).eql('Tour');
        done();
      });
    });
  });

  describe('#find', function() {
    it('builds a ploymorphic query', function() {
      var find = tour.venues.find();
      should(find).be.an.instanceof(mongoose.Query);
      should(find._conditions.playable).eql(tour._id);
      should(find._conditions.playable_type).eql('Tour');
    });
  });
});

describe('hasMany discriminated', function() {
  var departmentSchema, Department, department
    , BaseSchema
    , Product, product
    , DairyProduct, dairy
    , ProduceProduct, produce;

  before(function(){
    var util = require('util');
    function BaseSchema() {
      mongoose.Schema.apply(this, arguments);
      this.belongsTo('department');
    }
    util.inherits(BaseSchema, mongoose.Schema);

    Product = mongoose.model('Product', new BaseSchema());
    DairyProduct = Product.discriminator('DairyProduct', new BaseSchema());
    ProduceProduct = Product.discriminator('ProduceProduct', new BaseSchema());

    departmentSchema = new mongoose.Schema({});
    departmentSchema.hasMany('products');
    departmentSchema.hasMany('dairy_products');
    departmentSchema.hasMany('produce_products');
    Department = mongoose.model('Department', departmentSchema);
    department = new Department;
  });

  describe('#create', function() {
    it('creates associated docs for the correct Model', function(done){
      department.dairy_products.create({}, function(err, dairy_product){
        should(dairy_product.__t).eql('DairyProduct');
        should(dairy_product).be.an.instanceof(DairyProduct);
        should(dairy_product.department).be.eql(department._id);
        done();
      });
    });
  });

  describe('#concat', function() {
    before(function(done){
      Product.remove(done);
    });

    it('concats a hertogenious set of child documents', function(done) {
      var product = new Product()
        , dairy = new DairyProduct()
        , produce = new ProduceProduct();

      department.products.concat([product, dairy, produce], function(err, concatenatedProducts){
        should.strictEqual(err, null);
        concatenatedProducts.forEach(function(concatenatedProduct){
          should(concatenatedProduct).be.an.instanceof(Product);
          should(concatenatedProduct.department).be.eql(department._id);
          if(concatenatedProduct._id == product._id){
            should(concatenatedProduct.__t).eql.undefined;
          }
          else if(concatenatedProduct._id == dairy._id){
            should(concatenatedProduct.__t).eql('DairyProduct');
          }
          else if(concatenatedProduct._id == produce._id){
            should(concatenatedProduct.__t).eql('ProduceProduct');
          }
        });

        department.products.find(function(err, products){
          should(products).have.lengthOf(3);

          department.dairy_products.find(function(err, products){
            should(products).have.lengthOf(1);
            should(products[0].__t).eql('DairyProduct');

            department.produce_products.find(function(err, products){
              should(products).have.lengthOf(1);
              should(products[0].__t).eql('ProduceProduct');

              done();
            });
          });
        });
      });
    });
  });
});
