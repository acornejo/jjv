/*jshint expr:true */

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
    delete object.lastname;
    expect(schemaValidator(schema, object)).to.have.deep.property('validation.lastname.required', true);
    object.lastname = 'last';
    expect(schemaValidator(schema, object)).to.be.null;
  });

  it("additional", function () {
    object.nonexistentfield = 'hello there!';
    expect(schemaValidator(schema, object)).to.have.property('additional').that.contain('nonexistentfield');
    delete object.nonexistentfield;
    expect(schemaValidator(schema, object)).to.be.null;
  });

  it("optional", function () {
    schema.properties.gender = { type: 'string' };
    delete object.gender;
    expect(schemaValidator(schema, object)).to.be.null;
    object.gender = 'vampire';
    expect(schemaValidator(schema, object)).to.be.null;
  });

  describe("type", function () {
    it("string", function () {
      schema.properties.gender = { type: 'string' };
      object.gender = 42;
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.gender.type', 'string');
      object.gender = 'whale';
      expect(schemaValidator(schema, object)).to.be.null;
    });

    it("number", function () {
      schema.properties.gender = { type: 'number' };
      object.gender = 'whale';
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.gender.type', 'number');
      object.gender = 42.5;
      expect(schemaValidator(schema, object)).to.be.null;
    });

    it("integer", function () {
      schema.properties.gender = { type: 'integer' };
      object.gender = 42.5;
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.gender.type', 'integer');
      object.gender = 1;
      expect(schemaValidator(schema, object)).to.be.null;
    });

    it("boolean", function () {
      schema.properties.verified = { type: 'boolean' };
      object.verified = 33;
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.verified.type', 'boolean');
      object.verified = false;
      expect(schemaValidator(schema, object)).to.be.null;
    });

    it("date", function () {
      schema.properties.birthdate = {type: 'date'};
      object.birthdate = '';
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.birthdate.type', 'date');
      object.birthdate = '55a';
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.birthdate.type', 'date');
      object.birthdate = '03/21/1996';
      expect(schemaValidator(schema, object)).to.be.null;
      object.birthdate = 'now';
      expect(schemaValidator(schema, object)).to.be.null;
    });
  });

  describe("format", function () {
    it("alpha", function () {
      schema.properties.gender = { type: 'string', format: "alpha" };
      object.gender = 'a42';
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.gender.format', true);
      object.gender = 'undisclosed';
      expect(schemaValidator(schema, object)).to.be.null;
    });

    it("numeric", function () {
      schema.properties.gender = { type: 'string', format: "numeric" };
      object.gender = 'a42';
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.gender.format', true);
      object.gender = '42';
      expect(schemaValidator(schema, object)).to.be.null;
    });

    it("alphanumeric", function () {
      schema.properties.gender = { type: 'string', format: "alphanumeric" };
      object.gender = 'test%-';
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.gender.format', true);
      object.gender = 'a42';
      expect(schemaValidator(schema, object)).to.be.null;
    });

    it("hexadecimal", function () {
      schema.properties.gender = { type: 'string', format: "hexadecimal" };
      object.gender = 'x44';
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.gender.format', true);
      object.gender = 'deadbeef';
      expect(schemaValidator(schema, object)).to.be.null;
    });
  });

  describe("generic validators", function () {
    it("pattern", function () {
      schema.properties.gender = { type: 'string', pattern: 'ale$' };
      object.gender = 'girl';
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.gender.pattern', true);
      object.gender = 'male';
      expect(schemaValidator(schema, object)).to.be.null;
    });

    it("enum", function () {
      schema.properties.gender = { type: 'string', 'enum': ["male", "female"] };
      object.gender = 'girl';
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.gender.enum', true);
      object.gender = 'male';
      expect(schemaValidator(schema, object)).to.be.null;
    });
  });

  describe("number validators", function () {
    it("multipleOf", function () {
      schema.properties.age = { type: 'number', multipleOf: 10 };
      object.age = 21;
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.age.multipleOf', true);
      object.age = 20;
      expect(schemaValidator(schema, object)).to.be.null;
    });

    it("minimum", function () {
      schema.properties.age = { type: 'number', minimum: 18 };
      object.age = 17;
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.age.minimum', true);
      object.age = 18;
      expect(schemaValidator(schema, object)).to.be.null;
    });

    it("maximum", function () {
      schema.properties.age = { type: 'number', maximum: 100 };
      object.age = 101;
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.age.maximum', true);
      object.age = 28;
      expect(schemaValidator(schema, object)).to.be.null;
    });
  });

  describe('oneof', function () {
    beforeEach(function () {
    schema.properties.role = {
      oneOf: [
        {
          type: 'object',
          properties: {
            role_name: {
              type: 'string',
              'enum': ['admin']
            },
            owner_of: {
              type: 'array'
            }
          },
          required: ['role_name', 'owner_of']
        },
        {
          type: 'object',
          properties: {
            role_name: {
              type: 'string',
              'enum': ['user']
            },
            member_of: {
              type: 'array'
            }
          },
          required: ['role_name', 'member_of']
        }
      ]
    };
    });

    it('invalid', function () {
      object.role = {role_name: 'guest'};
      console.log(JSON.stringify(schemaValidator(schema, object)));
      expect(schemaValidator(schema, object)).to.have.deep.property('validation.role');
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
  });
});
