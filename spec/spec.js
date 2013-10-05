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

    expect(schemaValidator(schema, object).validation.lastname.required).toBeDefined();

    object.lastname = 'last';

    expect(schemaValidator(schema, object)).toEqual({});

    schema.properties.gender = { type: 'string' };

    expect(schemaValidator(schema, object)).toEqual({});

    object.gender = 'vampire';

    expect(schemaValidator(schema, object)).toEqual({});

    schema.properties.gender.isAlpha = true;

    expect(schemaValidator(schema, object)).toEqual({});

    object.gender = '42';

    expect(schemaValidator(schema, object).validation.gender.isAlpha).toBeDefined();

    delete schema.properties.gender.isAlpha;

    object.gender = 42;

    expect(schemaValidator(schema, object).validation.gender.type).toBeDefined();

    object.gender = 'whale';

    expect(schemaValidator(schema, object)).toEqual({});

    schema.properties.gender.endsWith = 'ale';

    expect(schemaValidator(schema, object)).toEqual({});

    schema.properties.gender.endsWith = 'xale';

    expect(schemaValidator(schema, object).validation.gender.endsWith).toBeDefined();

    delete schema.properties.gender.endsWith;

    schema.properties.gender.isIn = ['male', 'female'];

    expect(schemaValidator(schema, object).validation.gender.isIn).toBeDefined();

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

    expect(schemaValidator(schema, object).validation.loc).toBeDefined();
    expect(schemaValidator(schema, object).validation.loc.schema.lat.required).toBeDefined();
    expect(schemaValidator(schema, object).validation.loc.schema.lon.required).toBeDefined();

    object.loc = {lat: '44', lon: 23};

    expect(schemaValidator(schema, object).validation.loc).toBeDefined();
    expect(schemaValidator(schema, object).validation.loc.schema.lat.type).toBe('number');

    object.loc = {lat: 44, lon: 23};

    expect(schemaValidator(schema, object)).toEqual({});

    object.nonexistentfield = 'hello there!';

    expect(schemaValidator(schema, object).additional).toContain('nonexistentfield');

    delete object.nonexistentfield;
  });
});
