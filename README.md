# JJV: Javascript JSON Validator

A simple and extensible Javascript json-schema validator. Runs in the
browser and in the server (through node.js), it has no dependencies and
out-of-the-box AMD support.

See [json-schema.org](http://json-schema.org) for examples and detailed
documentation on the specification of JSON-schema. JJV supports the
latest (v4) JSON Schema Core draft, but due to performance and security
concerns remote schemas are not fetched.

## Basic Usage

In the most basic usage an environment must be created, and one or more
named schemas are registered in the environment. Javascript objects can
then be validated against any registered schema.

```javascript
    // create new JJV environment
    var env = jjv();

    // Register a `user` schema
    env.addSchema('user', {
        type: 'object',
        properties: {
            firstname: {
                type: 'string',
                minLength: 2
                maxLength: 15
            },
            lastname: {
                type: 'string',
                minLength: 2
                maxLength: 25
            },
            gender: {
                type: 'string',
                enum: ['male', 'female']
            },
            email: {
                type: 'string',
                format: 'email'
            },
            password: {
                type: 'string',
                minLength: 8
            }
        },
        required: ['firstname', 'lastname', 'email', 'password']
    });

    // Perform validation against an incomplete user object (errors will be reported)
    var errors = env.validate('user', {firstname: 'John', lastname: 'Smith'});

    // validation was successful
    if (!errors) {
        alert('User has been validated.')
    } else {
        alert('Failed with error object ' + JSON.stringify(errors));
    }

```

## Advanced Usage

There is built-in support for types `string`, `boolean`, `number`,
`integer`, `object`, `array` and `date`. The types `date` and `integer`
are custom JJV extensions not part of the JSON-Schema specification. JJV
provides mechanisms to add support for custom types, custom formats, and
custom checks.

### Custom Types

Support for additional types can be added through the `addType`
function. For example, a simple implementation of the `date` type (very
close to the internal implementation) would be the following:

```javascript

   // create JJV environment
   var env = jjv();

   env.addType('date', function (v) {
      var d = new Date(v);
      if (isNaN(d.getTime()))
          throw new Error('is not a date');
      return d;
   });
```

### Custom Formats

It is also possible to add support for additional string formats through
the `addFormat` function. For example, the internal implementation of
the `hexadecimal` string format could be implemented as follows:

```javascript
    // create JJV environment
    var env = jjv();

    env.addFormat('hexadecimal', function (v) {
        if (typeof v !== 'string' || !(/^[a-fA-F0-9]+$/.test(v)))
            throw new Error('is not hexadecimal');
    });
```

### Custom Checks

Finally, it is possible to add support for custom checks (i.e.,
`minItems`, `maxItems`, `minLength`, `maxLength`, etc.) through the
`addCheck` function. For example, the internal implementation of the
`minLength` check could be implemented as follows:

```javascript
    // create JJV environment
    var env = jjv();

    env.addCheck('minLength', function (v) {
        if (v.length < p)
            throw new Error('too small');
    });
```
