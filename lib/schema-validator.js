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
    },
    'date': function (x) {
      if (x === 'now') return new Date();
      var d = new Date(x);
      if (isNaN(d.getTime()))
          throw new Error('is not a date');
      return d;
    }
  };

  // TODO: rewrite, equals?, contains? isAfter, isBefore?
  var validateField = function () {
    var list = [
      'isAlpha', 'isAlphanumeric', 'isEmail', 'isUrl', 'isIP', 'isIPv4',
      'isIPv6', 'isCreditCard', 'isUUID', 'isUUIDv3', 'isUUIDv4',
      'isDate', 'isHexadecimal', 'isHexColor', 'isLowercase',
      'isUppercase', 'notEmpty', 'isAfter', 'isBefore', 'regex',
      'notRegex', 'equals', 'contains', 'notContains'];
    var i, d = {};

    if (typeof check === 'undefined' && typeof require !== 'undefined')
      check = require('validator').check;

    function makeFunction(f) {
      return function (v, p, q) { check(v)[f](p, q); };
    }

    for (i = 0; i<list.length; i++) {
      d[list[i]] = makeFunction(list[i]);
    }

    d.readOnly = function (v, p, name, options) {
      if (options !== undefined && options.ignoreReadOnly) {
        if (typeof options.ignoreReadOnly === 'boolean')
          return;
        for (var i = 0; i<options.ignoreReadOnly.length; i++)
          if (options.ignoreReadOnly[i] === name)
            return;
      } 
      throw new Error('is read only');
    };

    d.notIn = function (v, p) {
      for (var i = 0; i < p.length; i++)
        if (v === p[i])
          throw new Error('found in set');
    };

    d.isIn = function (v, p) {
      for (var i = 0; i < p.length; i++)
        if (v === p[i]) return;
      throw new Error('not found in set');
    };

    d.len = function (v, p) {
      if (v.length !== p)
        throw new Error('wrong length');
    };

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

  var checkValidity = function (schema, object, name, required, options) {
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
          objerr = checkValidity(schema.properties[p], object[name], p, schema.required, options);
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
          objerr = checkValidity(schema.items, object[name], i, schema.required, options);
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
        if (schema.hasOwnProperty(v) && v !== 'properties' && v !== 'items' && v !== 'type' && v !== 'required' && v !== 'default' && v !== 'description') {
          if (!validateField.hasOwnProperty(v))
            throw new Error('schema: property \'' + name + '\' has non-existent validation \'' + v + '\'.');
          try {
            validateField[v](object[name], schema[v], name, options);
          } catch(err) {
            objerrs[v] = true;
            malformed = true;
          }
        }
      }
      if (malformed)
        return objerrs;
    } else {
      if (options.checkRequired && isRequired(name, required)) 
        return {'required': true};
      else if (options.useDefault && schema.hasOwnProperty('default')) {
        try {
          object[name] = enforceType[schema.type](schema['default']);
        } catch (err) {
          return {'type': schema.type};
        }
      }
    }

    return null;
  };

  var checkExtra = function (schema, object, name, prefix, options) {
    var extraFields = [];
    var subfields;
    var p, i, j;

    if (typeof schema !== 'object' || !schema.hasOwnProperty('type')) {
      extraFields.push(prefix + (prefix.length > 0 ? '.' : '') + name);
      if (options.removeAdditional)
        delete object[name];
    } else if (schema.type === 'object' && schema.hasOwnProperty('properties')) {
      for (p in object[name])  {
        if (object[name].hasOwnProperty(p)) {
          subfields = checkExtra(schema.properties[p], object[name], p, prefix + name, options);
          for (j = 0; j<subfields.length; j++)
            extraFields.push(subfields[j]);
        }
      }
    } else if (schema.type === 'array' && schema.hasOwnProperty('items')) {
      for (i = 0; i<object[name].length; i++)  {
        subfields = checkExtra(schema.items, object[name], i, prefix + name + '[' + i.toString() + ']', options);
        for (j = 0; j<subfields.length; j++)
          extraFields.push(subfields[j]);
      }
    }

    return extraFields;
  };

  var schemaValidator = function (schema, object, options) {
    var errors;
    var validation = null;
    var additional = [];
    var p, properr;

    options = options || {};
    options.useDefault = options.hasOwnProperty('useDefault') ? options.useDefault: true;
    options.checkRequired = options.hasOwnProperty('checkRequired') ? options.checkRequired: true;
    options.checkAdditional = options.hasOwnProperty('checkAdditional') ? options.checkAdditional: true;
    options.removeAdditional = options.hasOwnProperty('removeAdditional') ? options.removeAdditional : true;

    if (!schema.hasOwnProperty('type') && schema.type == 'object')
      throw new Error('schema: root schema must be of type \'object\'.');
    if (schema.hasOwnProperty('properties')) {
      var root_key = '';
      var root_object = {};
      root_object[root_key] = object;
      properr = checkValidity(schema, root_object, root_key, [root_key], options);
      if (properr !== null && properr.hasOwnProperty('schema'))
        validation = properr.schema;
      if (options.checkAdditional)
        additional = checkExtra(schema, root_object, root_key, '', options);
    }

    if (validation || additional.length > 0) {
      errors = {};
      if (validation)
        errors.validation = validation;
      if (additional.length > 0)
        errors.additional = additional;
      return errors;
    } else
      return null;
  };

  schemaValidator.validate = schemaValidator;
  schemaValidator.addType = function (name, func) {
    enforceType[name] = func;
  };
  schemaValidator.addCheck = function (name, func) {
    validateField[name] = func;
  };

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = schemaValidator;
  } else {
    this.schemaValidator = schemaValidator;
  }
}).call(this);
