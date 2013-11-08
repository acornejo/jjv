var schemaValidator = require('..');
var expect = require('chai').expect;


describe("test", function () {
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
var object = {'firstname': 'first', 'lastname': 'last'};

  it("required", function () {
    expect(schemaValidator(schema, object)).to.be.null;
    delete object.lastname;
    expect(schemaValidator(schema, object)).to.have.deep.property('validation.lastname.required', true);
    object.lastname = 'last';
  });

  it("additional", function () {
    object.nonexistentfield = 'hello there!';
    expect(schemaValidator(schema, object)).to.have.property('additional').that.contain('nonexistentfield');
    delete object.nonexistentfield;
  });

  it("optional", function () {
    schema.properties.gender = { type: 'string' };
    expect(schemaValidator(schema, object)).to.be.null;
    object.gender = 'vampire';
    expect(schemaValidator(schema, object)).to.be.null;
  });

  it("type", function () {
    schema.properties.gender = { type: 'string' };
    object.gender = 42;
    expect(schemaValidator(schema, object)).to.have.deep.property('validation.gender.type', 'string');
    object.gender = 'whale';
    expect(schemaValidator(schema, object)).to.be.null;
  });

  describe("validators", function () {
    it("isAlpha", function () {
      schema.properties.gender = { type: 'string', isAlpha: true };
      object.gender = 'undisclosed';
      expect(schemaValidator(schema, object)).to.be.null;
      object.gender = '42';
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.gender.isAlpha', true);
    });

    it("endsWith", function () {
      schema.properties.gender = { type: 'string', endsWith: 'ale' };
      object.gender= "undefined";
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.gender.endsWith', true);
      object.gender = "whale";
      expect(schemaValidator(schema, object)).to.be.null;
    });

    it("startsWith", function () {
      schema.properties.gender = { type: 'string', startsWith: 'm' };
      object.gender= "female";
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.gender.startsWith', true);
      object.gender = "male";
      expect(schemaValidator(schema, object)).to.be.null;
    });

    it("isIn", function () {
      schema.properties.gender = { type: 'string', isIn: ["male", "female"] };
      object.gender = 'girl';
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.gender.isIn', true);
      object.gender = 'male';
      expect(schemaValidator(schema, object)).to.be.null;
    });

    it("minLength", function () {
      schema.properties.firstname.minLength=20;
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.firstname.minLength', true);
      schema.properties.firstname.minLength=3;
      expect(schemaValidator(schema, object)).to.be.null;
    });

    it("maxLength", function () {
      schema.properties.firstname.maxLength=4;
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.firstname.maxLength', true);
      schema.properties.firstname.maxLength=20;
      expect(schemaValidator(schema, object)).to.be.null;
    });
  });

  describe("nested objects", function () {
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

    it("optional", function () {
      expect(schemaValidator(schema, object)).to.be.null;
    });

    it("required", function () {
      object.loc = {};
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.loc.schema').that.deep.equals({lat: {required: true}, lon: {required: true}});
    });

    it("type", function () {
      object.loc = {lat: '44', lon: 23};
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.loc.schema.lat.type', 'number');
      object.loc = {lat: 44, lon: 23};
      expect(schemaValidator(schema, object)).to.be.null;
    });
  });

  describe("date", function () {
    it("invalid", function () {
      schema.properties.birthdate = {type: 'date'};
      object.birthdate = '';
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.birthdate.type', 'date');
    });

    it("valid", function () {
      schema.properties.birthdate = {type: 'date'};
      object.birthdate = '03/21/1996';
      expect(schemaValidator(schema, object)).to.be.null;
      object.birthdate = 'now';
      expect(schemaValidator(schema, object)).to.be.null;
    });
  });
});
