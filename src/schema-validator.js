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
        throw new Error('is not a string.');
      return x;
    },
    'boolean': function (x) {
      if (typeof x !== 'boolean')
        throw new Error('is not a boolean.');
      return x;
    },
    'number': function (x) {
      if (typeof x !== 'number')
        throw new Error('is not a number.');
      return x;
    },
    'integer': function (x) {
      if (typeof x !== 'number' || x % 1 !== 0)
        throw new Error('is not an integer.');
      return x;
    },
    'object': function (x) {
      if (!x || typeof x !== 'object')
        throw new Error('is not an object.');
      return x;
    },
    'array': function (x) {
      if (!x || typeof x !== 'object' || typeof x.length !== 'number' || toString.call(x) !== '[object Array]')
        throw new Error('is not an array.');
      return x;
    }
  };

  // Relies on node-validator
  var validateField = function () {
    var list = [
      'isAlpha', 'isAlphanumeric', 'isEmail', 'isUrl', 'isIP', 'isIPv4',
      'isIPv6', 'isCreditCard', 'isUUID', 'isUUIDv3', 'isUUIDv4',
      'isDate', 'isHexadecimal', 'isHexColor', 'isLowercase',
      'isUppercase', 'notEmpty', 'isAfter', 'isBefore', 'regex',
      'equals', 'contains', 'notContains', 'isIn', 'notIn', 'min',
      'max', 'minLength', 'maxLength'];
    var i, d = {};

    function makeFunction(f) {
      return function (v, p) { check(v)[f](p); };
    }

    for (i = 0; i<list.length; i++) {
      d[list[i]] = makeFunction(list[i]);
    }

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
    var p, v, malformed, objerrs, objerr, errors = [];

    if (!schema.hasOwnProperty('type'))
      throw new Error('schema: property \'' + name + '\' is missing a type.');

    if (!enforceType.hasOwnProperty(schema.type))
      throw new Error('schema: property \'' + name + '\' uses invalid type \'' + schema.type + '\'.');

    if (object.hasOwnProperty(name)) {
      // enforce type for object
      try {
        object[name] = enforceType[schema.type](object[name]);
      } catch (err) {
        return [{type: 'type', args: schema.type, message: err.message}];
      }

      if (schema.type === 'object' && schema.hasOwnProperty('properties')) {
        malformed = false;
        objerrs = {};
        for (p in schema.properties) {
          objerr = checkProperty(schema.properties[p], object[name], p, schema.required);
          if (objerr.length > 0) {
            objerrs[p] = objerr;
            malformed = true;
          }
        }
        if (malformed)
          return [{type: 'malformed', args: objerrs, message: 'is malformed.'}];
      } else if (schema.type === 'array' && schema.hasOwnProperty('items')) {
        malformed = false;
        objerrs = {};
        for (i = 0; i<object[name].length; i++) {
          objerr = checkProperty(schema.items, object[name][i], schema.required);
          if (objerr.length > 0 ) {
            objerrs[i] = objerr;
            malformed = true;
          }
        }
        if (malformed)
          return [{type: 'malformed', args: objerrs, message: 'has malformed items.'}];
      }

      for (v in schema) {
        if (schema.hasOwnProperty(v) && v !== 'properties' && v !== 'items' && v !== 'type' && v !== 'meta' && v !== 'required') {
          if (!validateField.hasOwnProperty(v))
            throw new Error('schema: property \'' + name + '\' has non-existent validation \'' + v + '\'.');
          try {
            console.log('validating ' + name + ' with value ' + object[name]);
            validateField[v](object[name], schema[v]);
          } catch(err) {
            errors.push({type: v, message: err.message});
          }
        }
      }
    } else {
      if (isRequired(name, required)) 
        return [{type: 'required', message: 'is required.'}];
    }

    return errors;
  };

  var checkExtra = function (schema, object, name, remove) {
    var extraFields = [];
    var subfields;
    var p, v, i;

    remove = typeof remove !== undefined ? remove : false;

    if (typeof schema !== 'object' || !schema.hasOwnProperty('type')) {
      extraFields.push(name);
      if (remove)
        delete object[name];
    } else if (schema.type === 'object' && schema.hasOwnProperty('properties')) {
      for (p in object[name])  {
        if (object[name].hasOwnProperty(p)) {
          subfields = checkExtra(schema.properties[p], object[name], p, remove);
          for (v in subfields) {
            if (subfields.hasOwnProperty(v))
              extraFields.push(name + '.' + v);
          }
        }
      }
    } else if (schema.type === 'array' && schema.hasOwnProperty('items')) {
      for (i = 0; i<object[name].length; i++)  {
        subfields = checkExtra(schema.items, object[name], i, remove);
        for (v in subfields) {
          if (subfields.hasOwnProperty(v))
            extraFields.push(name + '[' + i.toString() + '].' + v);
        }
      }
    }

    return extraFields;
  };

  var schemaValidator = function (schema, object) {
    var errors = {};
    var hasValidationErrors = false;
    var validationErrors = {};
    var extraFields;
    var p, properr;

    if (!schema.hasOwnProperty('type') && schema.type == 'object')
      throw new Error('schema: root schema must be of type \'object\'.');
    if (schema.hasOwnProperty('properties')) {
      for (p in schema.properties) {
        if (schema.properties.hasOwnProperty(p)) {
          properr = checkProperty(schema.properties[p], object, p, schema.required);
          if (properr.length > 0){
            validationErrors[p] = properr;
            hasValidationErrors = true;
          }
        }
      }
      extraFields = checkExtra(schema, object);
    }

    if (hasValidationErrors)
      errors.validationErrors = validationErrors;
    if (extraFields.length > 0)
      errors.extraFields = extraFields;
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
