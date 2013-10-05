/**
 * schema-validator.js -- A javascript library to validate json input
 * with a schema.
 *
 *  Copyright (c) 2013 Alex Cornejo.
 *
 * Redistributable under a MIT-style open source license.
 *
 * schema-validator depends on node-validator. 
 */

(function () {
  // TODO: Date, Time, Binary
  var enforceType = {
    'string': function (x) {
      if (typeof x !== 'string')
        throw new Error('is not a string');
      return x;
    },
    'boolean': function (x) {
      if (typeof x !== 'boolean')
        throw new Error('is not a boolean');
      return x;
    },
    'number': function (x) {
      if (typeof x !== 'number')
        throw new Error('is not a number');
      return x;
    },
    'integer': function (x) {
      if (typeof x !== 'number' || x % 1 !== 0)
        throw new Error('is not an integer');
      return x;
    },
    'object': function (x) {
      if (!x || typeof x !== 'object')
        throw new Error('is not an object');
      return x;
    },
    'array': function (x) {
      if (!x || typeof x !== 'object' || typeof x.length !== 'number' || toString.call(x) !== '[object Array]')
        throw new Error('is not an array');
      return x;
    }
  };

  // TODO: rewrite, isIn, notIn, 
  // equals?, contains? isAfter, isBefore?
  var validateField = function () {
    var list = [
      'isAlpha', 'isAlphanumeric', 'isEmail', 'isUrl', 'isIP', 'isIPv4',
      'isIPv6', 'isCreditCard', 'isUUID', 'isUUIDv3', 'isUUIDv4',
      'isDate', 'isHexadecimal', 'isHexColor', 'isLowercase',
      'isUppercase', 'notEmpty', 'isAfter', 'isBefore', 'regex',
      'notRegex', 'equals', 'contains', 'notContains', 'isIn', 'notIn'];
    var i, d = {};

    function makeFunction(f) {
      return function (v, p) { check(v)[f](p); };
    }

    for (i = 0; i<list.length; i++) {
      d[list[i]] = makeFunction(list[i]);
    }

    d.minLength = function (v, p) {
      if (v.length < p)
        throw new Error('too small');
    };

    d.maxLength = function (v, p) {
      if (v.length > p)
        throw new Error('too large');
    };

    d.min = function (v, p) {
      if (v < p)
        throw new Error('too small');
    };

    d.max = function (v, p) {
      if (v > p)
        throw new Error('too large');
    };

    d.startsWith = function (v, p) {
      if (typeof v !== 'string' || v.indexOf(p) !== 0)
        throw new Error('does not start with prefix');
    };

    d.endsWith = function (v, p) {
      if (typeof v !== 'string' || typeof p !== 'string' || v.indexOf(p, v.length - p.length) === -1)
        throw new Error('does not end with suffix');
    };

    return d;
  }();

  var isRequired = function (p, required) {
    var i;
    if (typeof required !== 'object' || toString.call(required) !== '[object Array]')
      return false;
    for (i = 0; i<required.length; i++)
      if (required[i] === p)
        return true;
    return false;
  };

  var checkProperty = function (schema, object, name, required) {
    var p, v, malformed, objerrs, objerr, objreq, errors = {};

    if (!schema.hasOwnProperty('type'))
      throw new Error('schema: property \'' + name + '\' is missing a type.');

    if (!enforceType.hasOwnProperty(schema.type))
      throw new Error('schema: property \'' + name + '\' uses invalid type \'' + schema.type + '\'.');

    if (object.hasOwnProperty(name)) {
      // enforce type for object
      try {
        object[name] = enforceType[schema.type](object[name]);
      } catch (err) {
        return {'type': schema.type};
      }

      if (schema.type === 'object' && schema.hasOwnProperty('properties')) {
        malformed = false;
        objerrs = {};
        objreq = [];
        for (p in schema.properties) {
          objerr = checkProperty(schema.properties[p], object[name], p, schema.required);
          if (objerr !== null) {
            objerrs[p] = objerr;
            malformed = true;
          }
        }
        if (malformed)
          return {'schema': objerrs};
      } else if (schema.type === 'array' && schema.hasOwnProperty('items')) {
        malformed = false;
        objerrs = {};
        for (i = 0; i<object[name].length; i++) {
          objerr = checkProperty(schema.items, object[name], i, schema.required);
          if (objerr !== null) {
            objerrs[i] = objerr;
            malformed = true;
          }
        }
        if (malformed)
          return {'schema': objerrs};
      }

      malformed = false;
      objerrs = {};
      for (v in schema) {
        if (schema.hasOwnProperty(v) && v !== 'properties' && v !== 'items' && v !== 'type' && v !== 'meta' && v !== 'required') {
          if (!validateField.hasOwnProperty(v))
            throw new Error('schema: property \'' + name + '\' has non-existent validation \'' + v + '\'.');
          try {
            validateField[v](object[name], schema[v]);
          } catch(err) {
            objerrs[v] = true;
            malformed = true;
          }
        }
      }
      if (malformed)
        return objerrs;
    } else {
      if (isRequired(name, required)) 
        return {'required': true};
    }

    return null;
  };

  var checkExtra = function (schema, object, name, prefix, remove) {
    var extraFields = [];
    var subfields;
    var p, i, j;

    remove = typeof remove !== undefined ? remove : false;

    if (typeof schema !== 'object' || !schema.hasOwnProperty('type')) {
      extraFields.push(prefix + (prefix.length > 0 ? '.' : '') + name);
      if (remove)
        delete object[name];
    } else if (schema.type === 'object' && schema.hasOwnProperty('properties')) {
      for (p in object[name])  {
        if (object[name].hasOwnProperty(p)) {
          subfields = checkExtra(schema.properties[p], object[name], p, prefix + name, remove);
          for (j = 0; j<subfields.length; j++)
            extraFields.push(subfields[j]);
        }
      }
    } else if (schema.type === 'array' && schema.hasOwnProperty('items')) {
      for (i = 0; i<object[name].length; i++)  {
        subfields = checkExtra(schema.items, object[name], i, prefix + name + '[' + i.toString() + ']', remove);
        for (j = 0; j<subfields.length; j++)
          extraFields.push(subfields[j]);
      }
    }

    return extraFields;
  };

  var schemaValidator = function (schema, object) {
    var errors = {};
    var validation = null;
    var additional = [];
    var p, properr;

    if (!schema.hasOwnProperty('type') && schema.type == 'object')
      throw new Error('schema: root schema must be of type \'object\'.');
    if (schema.hasOwnProperty('properties')) {
      var root_key = '';
      var root_object = {};
      root_object[root_key] = object;
      properr = checkProperty(schema, root_object, root_key, [root_key]);
      if (properr !== null && properr.hasOwnProperty('schema'))
        validation = properr.schema;
      additional = checkExtra(schema, root_object, root_key, '', true);
    }

    if (validation)
      errors.validation = validation;
    if (additional.length > 0)
      errors.additional = additional;
    return errors;
  };

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = schemaValidator;
    } 
    exports.schemaValidator = schemaValidator;
  } else {
    this.schemaValidator = schemaValidator;
  }
}).call(this);
