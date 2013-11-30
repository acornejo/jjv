/*jshint expr:true */

var jjv = require('..');
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
    expect(jjv(schema, object)).to.have.deep.property('validation.lastname.required', true);
    object.lastname = 'last';
    expect(jjv(schema, object)).to.be.null;
  });

  it("additional", function () {
    object.nonexistentfield = 'hello there!';
    expect(jjv(schema, object)).to.have.property('additional').that.contain('nonexistentfield');
    delete object.nonexistentfield;
    expect(jjv(schema, object)).to.be.null;
  });

  it("optional", function () {
    schema.properties.gender = { type: 'string' };
    delete object.gender;
    expect(jjv(schema, object)).to.be.null;
    object.gender = 'vampire';
    expect(jjv(schema, object)).to.be.null;
  });

  describe("type", function () {
    it("string", function () {
      schema.properties.gender = { type: 'string' };
      object.gender = 42;
      expect(jjv(schema, object)).to.have.deep.property('validation.gender.type', 'string');
      object.gender = 'whale';
      expect(jjv(schema, object)).to.be.null;
    });

    it("number", function () {
      schema.properties.gender = { type: 'number' };
      object.gender = 'whale';
      expect(jjv(schema, object)).to.have.deep.property('validation.gender.type', 'number');
      object.gender = 42.5;
      expect(jjv(schema, object)).to.be.null;
    });

    it("integer", function () {
      schema.properties.gender = { type: 'integer' };
      object.gender = 42.5;
      expect(jjv(schema, object)).to.have.deep.property('validation.gender.type', 'integer');
      object.gender = 1;
      expect(jjv(schema, object)).to.be.null;
    });

    it("boolean", function () {
      schema.properties.verified = { type: 'boolean' };
      object.verified = 33;
      expect(jjv(schema, object)).to.have.deep.property('validation.verified.type', 'boolean');
      object.verified = false;
      expect(jjv(schema, object)).to.be.null;
    });

    it("date", function () {
      schema.properties.birthdate = {type: 'date'};
      object.birthdate = '';
      expect(jjv(schema, object)).to.have.deep.property('validation.birthdate.type', 'date');
      object.birthdate = '55a';
      expect(jjv(schema, object)).to.have.deep.property('validation.birthdate.type', 'date');
      object.birthdate = '03/21/1996';
      expect(jjv(schema, object)).to.be.null;
      object.birthdate = 'now';
      expect(jjv(schema, object)).to.be.null;
    });
  });

  describe("format", function () {
    it("alpha", function () {
      schema.properties.gender = { type: 'string', format: "alpha" };
      object.gender = 'a42';
      expect(jjv(schema, object)).to.have.deep.property('validation.gender.format', true);
      object.gender = 'undisclosed';
      expect(jjv(schema, object)).to.be.null;
    });

    it("numeric", function () {
      schema.properties.gender = { type: 'string', format: "numeric" };
      object.gender = 'a42';
      expect(jjv(schema, object)).to.have.deep.property('validation.gender.format', true);
      object.gender = '42';
      expect(jjv(schema, object)).to.be.null;
    });

    it("alphanumeric", function () {
      schema.properties.gender = { type: 'string', format: "alphanumeric" };
      object.gender = 'test%-';
      expect(jjv(schema, object)).to.have.deep.property('validation.gender.format', true);
      object.gender = 'a42';
      expect(jjv(schema, object)).to.be.null;
    });

    it("hexadecimal", function () {
      schema.properties.gender = { type: 'string', format: "hexadecimal" };
      object.gender = 'x44';
      expect(jjv(schema, object)).to.have.deep.property('validation.gender.format', true);
      object.gender = 'deadbeef';
      expect(jjv(schema, object)).to.be.null;
    });
  });

  describe("generic validators", function () {
    it("pattern", function () {
      schema.properties.gender = { type: 'string', pattern: 'ale$' };
      object.gender = 'girl';
      expect(jjv(schema, object)).to.have.deep.property('validation.gender.pattern', true);
      object.gender = 'male';
      expect(jjv(schema, object)).to.be.null;
    });

    it("enum", function () {
      schema.properties.gender = { type: 'string', 'enum': ["male", "female"] };
      object.gender = 'girl';
      expect(jjv(schema, object)).to.have.deep.property('validation.gender.enum', true);
      object.gender = 'male';
      expect(jjv(schema, object)).to.be.null;
    });
  });

  describe("number validators", function () {
    it("multipleOf", function () {
      schema.properties.age = { type: 'number', multipleOf: 10 };
      object.age = 21;
      expect(jjv(schema, object)).to.have.deep.property('validation.age.multipleOf', true);
      object.age = 20;
      expect(jjv(schema, object)).to.be.null;
    });

    it("minimum", function () {
      schema.properties.age = { type: 'number', minimum: 18 };
      object.age = 17;
      expect(jjv(schema, object)).to.have.deep.property('validation.age.minimum', true);
      object.age = 18;
      expect(jjv(schema, object)).to.be.null;
    });

    it("maximum", function () {
      schema.properties.age = { type: 'number', maximum: 100 };
      object.age = 101;
      expect(jjv(schema, object)).to.have.deep.property('validation.age.maximum', true);
      object.age = 28;
      expect(jjv(schema, object)).to.be.null;
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
      expect(jjv(schema, object)).to.have.deep.property('validation.role');
      object.role = {role_name: 'user'};
      expect(jjv(schema, object)).to.have.deep.property('validation.role');
      object.role = {role_name: 'admin'};
      expect(jjv(schema, object)).to.have.deep.property('validation.role');
      object.role = {role_name: 'admin', member_of: []};
      expect(jjv(schema, object)).to.have.deep.property('validation.role');
      object.role = {role_name: 'user', owner_of: []};
      expect(jjv(schema, object)).to.have.deep.property('validation.role');
    });

    it('valid', function () {
      object.role = {role_name: 'admin', owner_of: []};
      expect(jjv(schema, object)).to.be.null;
      object.role = {role_name: 'user', member_of: []};
      expect(jjv(schema, object)).to.be.null;
    });
  });


  describe("nested objects", function () {
    schema.definitions = {
      location: {
        type: 'object',
        properties: {
          address: {
            type: 'string'
          },
          latlng: {
            type: 'object',
            properties: {
              lat: {
                type: 'number'
              },
              lon: {
                type: 'number'
              }
            },
            required: ['lat', 'lon']
          }
        },
        required: ['address', 'latlng']
      }
    };
    schema.properties.loc = { $ref: '#/definitions/location' };

    it("optional", function () {
      expect(jjv(schema, object)).to.be.null;
    });

    it("required", function () {
      object.loc = {};
      expect(jjv(schema, object)).to.have.deep.property('validation.loc.schema').that.deep.equals({address: {required: true}, latlng: {required: true}});
    });

    it("type", function () {
      object.loc = {latlng: {lat: 44, lon: 23}};
      expect(jjv(schema, object)).to.have.deep.property('validation.loc.schema.address.required');
      object.loc = {address: 'some street address', latlng: {lat: 44, lon: 23}};
      expect(jjv(schema, object)).to.be.null;
    });
  });

  describe("date", function () {
  });
});
