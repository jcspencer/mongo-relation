require('./spec_helper');

var mongoose = require('mongoose'),
    should   = require('should'),
    uuid     = require('node-uuid'),
    schema;

describe('belongsTo', function() {
  subject = null;

  before(function() {
    var partSchema = new mongoose.Schema({});
    partSchema.belongsTo('Widget');
    schema = mongoose.model('Part_' + uuid.v4(), partSchema).schema;
    subject = schema.paths.widget;
  });

  it('creates a path for widget on the schema', function() {
    should(schema.paths.widget).exist;
  });

  it('sets the relationship type', function() {
    should(subject.options.relationshipType).equal('belongsTo');
  });

  it('sets the instance', function() {
    should(subject.instance).equal('ObjectID');
  });

  it('sets the ref', function() {
    should(subject.options.ref).equal('Widget');
  });

  it('defaults required to undefined', function() {
    should(subject.isRequired).eql(undefined);
  });

  describe('options', function() {
    describe('custom name', function() {
      before(function() {
        partSchema = new mongoose.Schema({});
        partSchema.belongsTo('owner', { modelName: 'Widget', required: true });
        schema = mongoose.model('Part_' + uuid.v4(), partSchema).schema;
        subject = schema.paths.owner;
      });

      it('sets the custom named path', function() {
        should(subject).not.equal(undefined);
      });

      it('sets ref to the passed in modelName', function() {
        should(subject.options.ref).equal('Widget');
      });
    });

    describe('required', function() {
      before(function() {
        partSchema = new mongoose.Schema({});
        partSchema.belongsTo('Widget', { required: true });
        schema = mongoose.model('Part_' + uuid.v4(), partSchema).schema;
        subject = schema.paths.widget;
      });

      it('passes through the required field', function() {
        should(subject.isRequired).be.true;
      });
    });

    describe('polymorphic', function() {
      before(function() {
        var partSchema = new mongoose.Schema({});
        partSchema.belongsTo('Assemblable', { polymorphic: true, required: true });
        schema = mongoose.model('Part_' + uuid.v4(), partSchema).schema;
      });

      describe('ObjectID half', function() {
        before(function() { subject = schema.paths.assemblable; });

        it('exists', function() {
          should(subject).exist;
        });

        it('sets the id property', function() {
          should(subject.instance).equal('ObjectID');
        });

        it('knows it is a part of a polymorphic relationship', function() {
          should(subject.options.polymorphic).be.true;
        });
      });

      describe('Type half', function() {
        before(function() { subject = schema.paths.assemblable_type; });

        it('creates the type path', function() {
          should(subject).not.eql(undefined);
        });

        it('sets the type as String', function() {
          should(subject.instance).equal('String');
        });

        it('passes through options', function() {
          should(subject.isRequired).be.true;
        });
      });
    });
  });
});
