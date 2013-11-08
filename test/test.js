var schemaValidator = require('..');
var expect = require('chai').expect;

describe("test", function () {
  it("test2", function () {
    var schema = {
      type: 'object',
      properties: {
        firstname: {
          type: 'string'
        },
        lastname: {
          type: 'string'
        }
      },
      required: ['firstname', 'lastname']
    };
    var object = {'firstname': 'first'};

    expect(schemaValidator(schema, object)).to.have.deep.property('validation.lastname.required', true);

    object.lastname = 'last';

    expect(schemaValidator(schema, object)).to.be.null;

    schema.properties.gender = { type: 'string' };

    expect(schemaValidator(schema, object)).to.be.null;

    object.gender = 'vampire';

    expect(schemaValidator(schema, object)).to.be.null;

    schema.properties.gender.isAlpha = true;

    expect(schemaValidator(schema, object)).to.be.null;

    object.gender = '42';

    expect(schemaValidator(schema, object)).to.have.deep.property('validation.gender.isAlpha', true);

    delete schema.properties.gender.isAlpha;

    object.gender = 42;

    expect(schemaValidator(schema, object)).to.have.deep.property('validation.gender.type', 'string');

    object.gender = 'whale';

    expect(schemaValidator(schema, object)).to.be.null;

    schema.properties.gender.endsWith = 'ale';

    expect(schemaValidator(schema, object)).to.be.null;

    schema.properties.gender.endsWith = 'xale';

    expect(schemaValidator(schema, object)).to.have.deep.property('validation.gender.endsWith', true);

    delete schema.properties.gender.endsWith;

    schema.properties.gender.isIn = ['male', 'female'];

    expect(schemaValidator(schema, object)).to.have.deep.property('validation.gender.isIn', true);

    object.gender = 'male';

    expect(schemaValidator(schema, object)).to.be.null;

    schema.properties.loc = {
      type: 'object',
      properties: {
        lat: {
          type: 'number'
        },
        lon: {
          type: 'number'
        }
      },
      required: ["lat", "lon"]
    };

    expect(schemaValidator(schema, object)).to.be.null;

    object.loc = {};

    expect(schemaValidator(schema, object)).to.have.deep.property('validation.loc.schema').that.deep.equals({lat: {required: true}, lon: {required: true}});

    object.loc = {lat: '44', lon: 23};

    expect(schemaValidator(schema, object)).to.have.deep.property('validation.loc.schema.lat.type', 'number');

    object.loc = {lat: 44, lon: 23};

    expect(schemaValidator(schema, object)).to.be.null;

    object.nonexistentfield = 'hello there!';

    expect(schemaValidator(schema, object)).to.have.property('additional').that.contain('nonexistentfield');

    delete object.nonexistentfield;

    schema.properties.birthdate = {type: 'date'};

    expect(schemaValidator(schema, object)).to.be.null;

    object.birthdate = '';

    expect(schemaValidator(schema, object)).to.have.deep.property('validation.birthdate.type', 'date');

    object.birthdate = '03/21/1996';

    expect(schemaValidator(schema, object)).to.be.null;
  });
});
