require('./spec_helper');

var mongoose = require('mongoose'),
    should   = require('should');

describe('hasOne', function() {
  var schema, model, subject, Publisher;
  before(function(){
    schema = new mongoose.Schema({})
    schema.belongsTo('manual');
    Publisher = mongoose.model('Publisher', schema);

    schema = new mongoose.Schema({});
    schema.hasOne('publisher');
    model = mongoose.model('Manual', schema);
  });

  context('schema', function(){
    before(function(){
      subject = model.schema;
    });

    it('adds a virtual to the model', function(){
      should(subject.virtuals.publisher).not.equal(undefined);
    });
  });

  context('instance', function(){
    var criteria;

    before(function(){
      subject = new model();
      criteria = subject.publisher;
    });

    it('returns a criteria when called with no args', function(){
      should(criteria).be.instanceOf(mongoose.Query);
    });

    it('looks for the corrct path', function(){
      should(criteria._conditions).have.key('manual');
    });

    it('looks by the correct id', function(){
      should(criteria._conditions.manual).eql(subject._id);
    });

    it('looks on the correct model', function(){
      should(criteria.model.modelName).eql('Publisher');
    });

    context('finding', function(){
      before(function(done){
        new Publisher({ manual: subject._id }).save(done);
      });

      it('finds the correct document', function(done){
        criteria.exec(function(err, publisher){
          should(publisher.manual).eql(subject._id);
          done();
        });
      });
    });
  });
});
