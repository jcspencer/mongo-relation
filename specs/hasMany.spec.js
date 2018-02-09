require('./');

let mongoose = require('mongoose')
  , async    = require('async')
  , should   = require('should')
  , uuid     = require('node-uuid');

describe('hasMany without options', function(){
  let userSchema, User, user, widgetSchema, Widget, widget;

  before(function(){
    widgetSchema = mongoose.Schema({ name: String });
    widgetSchema.belongsTo('user');
    Widget = mongoose.model('Widget', widgetSchema);

    userSchema = new mongoose.Schema({});
    userSchema.hasMany('widgets');
    userSchema.hasMany('wadgets', { modelName: 'Widget' });
    User = mongoose.model('User', userSchema);
  });

  describe('schema', function(){
    it('has a virtual to represent the relationship', function(){
      should(userSchema.virtuals.widgets).not.equal(undefined);
      should(userSchema.virtuals.widgets.path).equal('widgets');
      should(userSchema.virtuals.wadgets).not.equal(undefined);
      should(userSchema.virtuals.wadgets.path).equal('wadgets');
      should((new User).wadgets.associationModelName).equal('Widget');
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

    it.skip('instantiates many children documents', function() {
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

    it('creates many child documents', function(done) {
      user.widgets.create({}, {}, function(err, widget1, widget2) {
        should.strictEqual(err, null);

        should(widget1).be.an.instanceof(Widget);
        should(widget1.user).equal(user._id);

        should(widget2).be.an.instanceof(Widget);
        should(widget2.user).equal(user._id);

        done();
      });
    });

    it('supports promises', function () {
      return user.widgets.create({ name: 'Beam' }).then(function(widget) {
        should(widget).be.an.instanceof(Widget);
        should(widget.name).equal('Beam')
        should(widget.user).equal(user._id);
      });
    });
  });

  describe('find', function(){
    let find;

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

    describe('handling promises', function () {
      before(function(){
        return Widget.remove().then(function () {
          return user.widgets.create({ }, { });
        });
      });

      it('with conditions, fields, options', function() {
        find = user.widgets.find({}, null, null)
        should(find).be.instanceOf(mongoose.Query);

        return find.exec().then(function(widgets){
          should(widgets).have.lengthOf(2);
          widgets.forEach(function(widget){
            should(widget).be.an.instanceof(Widget);
          });
        });
      });

      it('with conditions, fields', function() {
        find = user.widgets.find({}, null);
        should(find).be.instanceOf(mongoose.Query);

        return find.exec().then(function(widgets){
          should(widgets).have.lengthOf(2);
          widgets.forEach(function(widget){
            should(widget).be.an.instanceof(Widget);
          });
        });
      });

      it('with conditions', function() {
        find = user.widgets.find({});
        should(find).be.instanceOf(mongoose.Query);

        return find.exec().then(function(widgets){
          should(widgets).have.lengthOf(2);
          widgets.forEach(function(widget){
            should(widget).be.an.instanceof(Widget);
          });
        });
      });

      it('no args', function() {
        find = user.widgets.find();
        should(find).be.instanceOf(mongoose.Query);

        return find.exec().then(function(widgets){
          should(widgets).have.lengthOf(2);
          widgets.forEach(function(widget){
            should(widget).be.an.instanceof(Widget);
          });
        });
      });
    });

    describe('handling callbacks', function(){
      before(function(done){
        Widget.remove(function () {
          user.widgets.create({ }, { }, done);
        });
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
    let find;

    before(function(done){
      user = new User();
      user.widgets.create({ }, { }, done);
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
    let other_widget;

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
      user.widgets.concat(widget, otherWidget, function(err, concatenatedWidget1, concatenatedWidget2){
        should(widget._id).eql(concatenatedWidget1._id);
        should(widget.user).eql(user._id);
        should(widget.isNew).be.false;
        should(concatenatedWidget1.user).eql(user._id);
        should(concatenatedWidget1.isNew).be.false;

        should(otherWidget._id).eql(concatenatedWidget2._id);
        should(otherWidget.user).eql(user._id);
        should(otherWidget.isNew).be.false;
        should(concatenatedWidget2.user).eql(user._id);
        should(concatenatedWidget2.isNew).be.false;

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
    let otherWidget;

    before(function(){
      user = new User({});
      widget = new Widget({});
      otherWidget = new Widget({});
      should(widget.user).eql(undefined);
      should(otherWidget.user).eql(undefined);
    });

    it('adds relationship information to the child', function(){
      let returnedWidget = user.widgets.push(widget);
      should(widget.user).eql(user._id);
      should(returnedWidget.user).eql(user._id);
      should(returnedWidget._id).eql(widget._id);
    });

    it('adds relationship information to many children', function(){
      let returnedWidgets = user.widgets.push([ widget, otherWidget ]);
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
  let postSchema, Post, post
    , likeSchema, Like, like, likeEventCalled = false
    , favoriteSchema, Favorite, favorite, favoriteEventCalled = false
    , repostSchema, Repost, repost, repostEventCalled = false;

  //before(function(done){
  before(function(){
    likeSchema = mongoose.Schema({});
    likeSchema.belongsTo('post');
    //likeSchema.pre('remove', function(next){ Like.emit('destroy-test-event', this); next(); });
    Like = mongoose.model('Like', likeSchema);
    //Like.once('destroy-test-event', function(){ likeEventCalled = true; });

    favoriteSchema = mongoose.Schema({});
    favoriteSchema.belongsTo('post');
    //favoriteSchema.pre('remove', function(next){ Favorite.emit('destroy-test-event', this); next(); });
    Favorite = mongoose.model('Favorite', favoriteSchema);
    //Favorite.once('destroy-test-event', function(){ favoriteEventCalled = true; });

    repostSchema = mongoose.Schema({});
    repostSchema.belongsTo('post');
    //repostSchema.pre('remove', function(next){ Repost.emit('destroy-test-event', this); next(); });
    Repost = mongoose.model('Repost', repostSchema);
    //Repost.once('destroy-test-event', function(){ repostEventCalled = true; });

    postSchema = new mongoose.Schema({});
    postSchema.hasMany('likes', { dependent: 'delete' });
    postSchema.hasMany('favorites', { dependent: 'destroy' });
    postSchema.hasMany('reposts', { dependent: 'nullify' });
    Post = mongoose.model('Post', postSchema);

    return new Post({}).save().then(function(post){
      return Promise.all([
        post.likes.create({}),
        post.favorites.create({}),
        post.reposts.create({})
      ]).then(function (values) {
        like = values[0];
        favorite = values[1];
        repost = values[2];
        return post.remove();
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
      Favorite.findById(favorite._id, function(err, doc){
        should.strictEqual(doc, null);
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
  let tourSchema, Tour, tour, venueSchema, Venue, venue;

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
      let find = tour.venues.find();
      should(find).be.an.instanceof(mongoose.Query);
      should(find._conditions.playable).eql(tour._id);
      should(find._conditions.playable_type).eql('Tour');
    });
  });
});

describe('hasMany inverse_of', function() {
  let Reader, reader, Book;

  before(function(){
    readerSchema = mongoose.Schema({ });
    readerSchema.hasMany('books', { inverse_of: 'owner' });
    Reader = mongoose.model('Reader', readerSchema);
    reader = new Reader();

    bookSchema = new mongoose.Schema({});
    bookSchema.belongsTo('owner', { modelName: 'Reader' });
    Book = mongoose.model('Book', bookSchema);
  });

  describe('create', function() {
    it('sets the correct foreign key', function(done) {
      reader.books.create({}, function(err, book) {
        should.strictEqual(err, null);

        book.should.be.an.instanceof(Book);
        book.owner.should.equal(reader._id);
        done();
      });
    });
  });
});

describe('hasMany discriminated', function() {
  let departmentSchema, Department, department
    , BaseSchema
    , Product, product
    , DairyProduct, dairy
    , ProduceProduct, produce;

  before(function(){
    let util = require('util');
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
      let product = new Product()
        , dairy = new DairyProduct()
        , produce = new ProduceProduct();

      department.products.concat(product, dairy, produce, function(err, concatenatedProduct1, concatenatedProduct2, concatenatedProduct3){
        should.strictEqual(err, null);

        should(concatenatedProduct1).be.an.instanceof(Product);
        should(concatenatedProduct1.department).be.eql(department._id);
        should(concatenatedProduct1.__t).eql.undefined;

        should(concatenatedProduct2).be.an.instanceof(Product);
        should(concatenatedProduct2.department).be.eql(department._id);
        should(concatenatedProduct2.__t).eql('DairyProduct');

        should(concatenatedProduct3).be.an.instanceof(Product);
        should(concatenatedProduct3.department).be.eql(department._id);
        should(concatenatedProduct3.__t).eql('ProduceProduct');

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

describe('#__touch', function(){
  let postSchema, Post, post;

  before(function(){
    postSchema = mongoose.Schema({ body: String });
    postSchema.hasMany('comments');
    Post = mongoose.model('Post_' + uuid.v4(), postSchema);
  });

  it('has a method called touch', function(){
    should(postSchema.methods.__touch).be.a.Function;
  });

  it('saves the document when called', function(done){
    post = new Post;
    post.save(function (err) {
      let version = post.__v;
      post.__touch(function(err){
        should(post.__v).not.eql(version);
        done();
      });
    });
  });
});
