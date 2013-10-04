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

    expect(schemaValidator(schema, object).validationErrors.lastname[0].type).toEqual('required');

    object.lastname = 'last';

    expect(schemaValidator(schema, object)).toEqual({});

    schema.properties.gender = { type: 'string' };

    expect(schemaValidator(schema, object)).toEqual({});

    object.gender = 'vampire';

    expect(schemaValidator(schema, object)).toEqual({});

    schema.properties.gender.isAlpha = true;

    expect(schemaValidator(schema, object)).toEqual({});

    object.gender = '42';

    expect(schemaValidator(schema, object).validationErrors.gender[0].type).toEqual('isAlpha');

    delete schema.properties.gender.isAlpha;
    schema.properties.gender.isIn = ['male', 'female'];

    expect(schemaValidator(schema, object).validationErrors.gender[0].type).toEqual('isIn');

    object.gender = 'male';

    expect(schemaValidator(schema, object)).toEqual({});

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

    expect(schemaValidator(schema, object)).toEqual({});

    object.loc = {};

    expect(schemaValidator(schema, object).validationErrors.loc[0].type).toEqual('malformed');
    expect(schemaValidator(schema, object).validationErrors.loc[0].args.lat[0].type).toEqual('required');
    expect(schemaValidator(schema, object).validationErrors.loc[0].args.lon[0].type).toEqual('required');

    object.loc = {lat: '44', lon: 23};

    expect(schemaValidator(schema, object).validationErrors.loc[0].type).toEqual('malformed');
    expect(schemaValidator(schema, object).validationErrors.loc[0].args.lat[0].type).toEqual('type');

    object.loc = {lat: 44, lon: 23};

    expect(schemaValidator(schema, object)).toEqual({});

    object.nonexistentfield = 'hello there!';

    expect(schemaValidator(schema, object)).toEqual({});

  });
});
