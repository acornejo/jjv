# JJV: JJV JSON Validator

A simple and extensible json-schema validator written in javascript. JJV
runs in the browser and in the server (through node.js), it has no
dependencies and has out-of-the-box AMD support.

JJV implements the latest (v4) JSON Schema Core draft, however due to
performance and security concerns remote schemas are not fetched. To
ensure compliance JJV is tested against JSON Schema Test Suite published
by json-schema.org (and passes all tests). For examples and a detailed
description of the JSON-schema specification visit
[json-schema.org](http://json-schema.org).

JJV is fast! For a detailed performance comparison visit z-schema's
[benchmarks](https://rawgithub.com/zaggino/z-schema/master/benchmark/results.html)
website, which compares various javascript JSON schema validators.

## Basic Usage

In the most basic usage an environment must be created, and one or more
named schemas are registered in the environment (it is also possible to
register schemas with remote URI's in the same way). Javascript
objects can then be validated against any registered schema.

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

It is also possible to validate objects against unregistered and/or
unnamed schemas by supplying the schema object directly. For example:

```javascript
var env = jjv();

var errors = jjv.validate({
    type: 'object',
    properties: {
        x: {
            type: 'number'
        },
        y: {
            type: 'number'
        }
    },
    required: ['x', 'y']
 }, {x: 20, y: 50});

```

## Advanced Usage

JJV provides mechanisms to add support for custom types, custom formats,
and custom checks.

### Custom Types

Support for additional types can be added through the `addType`
function. For example, a simple implementation of the `date` type could
be the following:

```javascript
env.addType('date', function (v) {
  return !isNan(Date.parse(v));
});
```

### Custom Formats

It is also possible to add support for additional string formats through
the `addFormat` function. For example, an implementation of the
`hexadecimal` string format (already included) could be as follows:

```javascript
env.addFormat('hexadecimal', function (v) {
    return (/^[a-fA-F0-9]+$/).test(v);
});
```

### Custom Checks

Finally, it is possible to add support for custom checks (i.e.,
`minItems`, `maxItems`, `minLength`, `maxLength`, etc.) through the
`addCheck` function. For example, an implementation for an `exactLength`
validation keyword that supports arrays and strings can be achieved with
the following:

```javascript
env.addCheck('exactLength', function (v, p) {
    return v.length === p;
});
```
