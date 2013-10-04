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
    var noParam = ['isAlpha', 'isAlphanumeric', 'isEmail', 'isUrl', 'isIP', 'isIPv4', 'isIPv6', 'isCreditCard', 'isUUID', 'isUUIDv3', 'isUUIDv4', 'isDate', 'isHexadecimal', 'isHexColor', 'isLowercase', 'isUppercase', 'notEmpty'];
    var withParam = ['isAfter', 'isBefore', 'regex', 'equals', 'contains', 'notContains', 'isIn', 'notIn', 'min', 'max', 'minLength', 'maxLength'];
    var i, d = {};

    function makeNoParam(x, name) {
      return function (x) { check(x)[name](); };
    }

    function makeWithParam(x, y, name) {
      return function (x) { check(x)[name](y); };
    }

    for (i = 0; i<noParam.length; i++) {
      d[noParam[i]] = makeNoParam(x, noParam[i]);
    }

    for (i = 0; i<withParam.length; i++) {
      d[withParam[i]] = makeWithParam(x, y, withParam[i]);
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

  var checkProperty = function (schema, object, name) {
    var p, v, malformed, objerrs, objerr, errors = [];

    if (!schema.hasOwnProperty('type'))
      throw new Error('schema: property \'' + name + '\' is missing a type.');

    if (!enforceType.hasOwnProperty(schema.type))
      throw new Error('schema: property \'' + name + '\' uses invalid type \'' + schema.type + '\'.');

    if (object.hasOwnProperty(name)) {
      // enforce type for object
      try {
        object[name] = enforceType[schema.type][object];
      } catch (err) {
        return [{name: 'type', args: schema.type, message: err.message}];
      }

      if (type === 'object' && schema.hasOwnProperty('properties')) {
        malformed = false;
        objerrs = {};
        for (p in schema.properties) {
          objerr = checkProperty(schema.properties[p], object[name], p);
          if (objerr !== null) {
            objerrs[p] = objerr;
            malformed = true;
          }
        }
        if (malformed)
          return [{name: 'malformed', args: objerrs, message: 'is malformed.'}];
      } else if (type === 'array' && schema.hasOwnProperty('items')) {
        malformed = false;
        objerrs = {};
        for (i = 0; i<object[name].length; i++) {
          objerr = checkProperty(schema.items, object[name][i], i);
          if (objerr !== null) {
            objerrs[i] = objerr;
            malformed = true;
          }
        }
        if (malformed)
          return [{name: 'malformed', args: objerrs, message: 'has malformed items.'}];
      }

      for (v in schema) {
        if (schema.hasOwnProperty(v) && v !== 'properties' && v !== 'items' && v !== 'type' && v !== 'meta') {
          if (!validateField.hasOwnProperty(v))
            throw new Error('schema: property \'' + name + '\' has non-existent validation \'' + v + '\'.');
          try {
            validateField[v](object[name], schema[v]);
          } catch(err) {
            errors.push({name: v, message: err.message});
          }
        }
      }
    } else {
      if (isRequired(name, schema.required)) 
        return [{name: 'required', message: 'is required.'}];
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
    var hasValidationErrors = false;
    var validationErrors = {};
    var extraFields;
    var p, properr;

    if (!schema.hasOwnProperty('type') && schema.type == 'object')
      throw new Error('schema: root schema must be of type \'object\'.');
    if (schema.hasOwnProperty('properties')) {
      for (p in schema.properties) {
        properr = checkProperty(schema.properties[p], object, p);
        if (properr.length > 0){
          validationErrors[p] = properr;
          hasValidationErrors = true;
        }
      }
      extraFields = checkExtra(schema, object);
    }

    if (hasValidationErrors)
      errors.validationErrors = validationErrors;
    if (extraFields > 0)
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
