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

// TODO: additionalItems, additionalProperties, patternProperties, not

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

  // missing: uri, date-time, ipv4, ipv6
  var formatField = function () {
    var d = {};

    d.alpha = function (v) {
      if (typeof v !== 'string' ||  !(/^[a-zA-Z]+$/.test(v)))
        throw new Error('is not alpha');
    };

    d.alphanumeric = function (v) {
      if (typeof v !== 'string' || !(/^[a-zA-Z0-9]+$/.test(v)))
        throw new Error('is not alpha numeric');
    };

    d.hexadecimal = function (v) {
      if (typeof v !== 'string' || !(/^[a-fA-F0-9]+$/.test(v)))
        throw new Error('is not hexadecimal');
    };

    d.numeric = function (v) {
      if (typeof v !== 'string' || !(/^[0-9]+$/.test(v)))
        throw new Error('is not numeric');
    };

    d.uppercase = function (v) {
      if (typeof v !== 'string' || v !== v.toUpperCase())
        throw new Error('is not uppercase');
    };

    d.lowercase = function (v) {
      if (typeof v !== 'string' || v !== v.toLowerCase())
        throw new Error('is not lowercase');
    };

    // email, ipv4 and ipv6 adapted from node-validator
    d.email = function (v) {
      if (typeof v !== 'string' || !(/^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/.test(v))) 
        throw new Error('is not email');
    };

    d.ipv4 = function (v) {
      if (/^(\d?\d?\d)\.(\d?\d?\d)\.(\d?\d?\d)\.(\d?\d?\d)$/.test(v)) {
        var parts = v.split('.').sort();
        if (parts[3] <= 255) 
          return;
      }
      throw new Error('not ipv4');
    };

    d.ipv6 = function(v) {
      if (!(/^::|^::1|^([a-fA-F0-9]{1,4}::?){1,7}([a-fA-F0-9]{1,4})$/.test(str)))
        throw new Error('not ipv6');
    };
    
    return d;
  }();

  var validateField = function () {
    var d = {};

    d.readOnly = function (v, p, name, options) {
      throw new Error('is read only');
    };

    // numeric validation
    d.minimum = function (v, p) {
      if (v < p)
        throw new Error('too small');
    };

    d.maximum = function (v, p) {
      if (v > p)
        throw new Error('too large');
    };

    d.multipleOf = function (v, p) {
      if (v%p !== 0)
        throw new Error('not multiple of');
    };

    // string validation
    d.pattern = function (v, p) {
      var pattern, modifiers;
      if (typeof p === 'string')
        pattern=p;
      else {
        pattern=p[0];
        modifiers=p[1];
      }
      var regex = new RegExp(pattern, modifiers);
      if (!regex.test(v))
        throw new Error('does not match regex');
    };

    d.minLength = function (v, p) {
      if (v.length < p)
        throw new Error('too small');
    };

    d.maxLength = function (v, p) {
      if (v.length > p)
        throw new Error('too large');
    };

    // array validation
    d.minItems = function (v, p) {
      if (v.length < p)
        throw new Error('too small');
    };

    d.maxItems = function (v, p) {
      if (v.length > p)
        throw new Error('too large');
    };

    d.uniqueItems = function (v, p) {
      var hash = {}, key;
      for (var i = 0, len = v.length; i < len; i++) {
        key = JSON.stringify(v[i]);
        if (hash.hasOwnProperty(key))
          throw new Error('items not unique');
        else
          hash[key] = true;
      }
    };

    // object validation
    d.minProperties = function (v, p) {
      var count = 0;
      for (var prop in v) if (v.hasOwnProperty(prop)) count = count + 1;
      if (count < p)
        throw new Error('too few properties');
    };

    d.maxProperties = function (v, p) {
      var count = 0;
      for (var prop in v) if (v.hasOwnProperty(prop)) count = count + 1;
      if (count > p)
        throw new Error('too few properties');
    };

    // for all 
    d['enum'] = function (v, p) {
      if (typeof v === typeof p[0]) {
        var i, len, vs;
        if (typeof v === 'object') {
          vs = JSON.stringify(v);
          for (i = 0, len = p.length; i < len; i++)
            if (vs === JSON.stringify(p[i]))
              return;
        } else {
          for (i = 0, len = p.length; i < len; i++)
            if (v === p[i])
              return;
        }
      }
      throw new Error('not found in set');
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
    var i, len, count;

    if (schema.hasOwnProperty('allOf')) {
      if (toString.call(schema.allOf) !== '[object Array]')
        throw new Error('schema: in property \'' + name + '\' allOf is not a schema array.');
      for (i = 0, len = schema.allOf; i < len; i++) {
        objerr = checkValidity(schema.allOf[i], object, name, required, options);
        if (objerr)
          return objerr;
      }
      return null;
    } else if (schema.hasOwnProperty('oneOf')) {
      if (toString.call(schema.oneOf) !== '[object Array]')
        throw new Error('schema: in property \'' + name + '\' oneOf is not a schema array.');
      for (i = 0, len = schema.oneOf, count = 0; i < len; i++) {
        objerr = checkValidity(schema.oneOf[i], object, name, required, options);
        if (!objerr) {
          count = count + 1;
          if (count > 1)
            break;
        } else objerrs = objerr;
      }
      if (count === 0)
        return {'oneOf': true};
      else if (count === 1)
        return null;
      else
        return objerrs;
    } else if (schema.hasOwnProperty('anyOf')) {
      if (toString.call(schema.anyOf) !== '[object Array]')
        throw new Error('schema: in property \'' + name + '\' anyOf is not a schema array.');
      for (i = 0, len = schema.anyOf; i < len; i++) {
        objerr = checkValidity(schema.anyOf[i], object, name, required, options);
        if (!objerr)
          return null;
      }
      return objerr;
    } else if (schema.hasOwnProperty('type')) {
      if (typeof schema.type !== 'string' || !enforceType.hasOwnProperty(schema.type))
        throw new Error('schema: property \'' + name + '\' uses invalid type \'' + schema.type + '\'.');
    } else
      throw new Error('schema: property \'' + name + '\' is missing a type.');
      
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
        if (schema.hasOwnProperty(v) && v !== 'properties' && v !== 'items' && v !== 'type' && v !== 'required' && v !== 'default' && v !== 'title' && v !== 'description') {
          if (v === 'format') {
            if (typeof schema[v] !== 'string')
              throw new Error('schema: format must be a string');
            if (!formatField.hasOwnProperty(schema[v]))
              throw new Error('schema: property \'' + name + '\' has unsupported format \'' + schema[v] + '\'.');
            try {
              formatField[schema.format](object[name], name, options);
            } catch(err) {
              objerrs[v] = true;
              malformed = true;
            }
          } else {
            if (!validateField.hasOwnProperty(v))
              throw new Error('schema: property \'' + name + '\' has unsupported validation \'' + v + '\'.');
            try {
              validateField[v](object[name], schema[v], name, options);
            } catch(err) {
              objerrs[v] = true;
              malformed = true;
            }
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

    if (typeof schema !== 'object') {
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

  var defaultOptions = {
    useDefault: true,
    checkRequired: true,
    checkAdditional: true,
    removeAdditional: true
  };

  var schemaValidator = function (schema, object, options) {
    var errors;
    var validation = null;
    var additional = [];
    var p, properr;

    options = options || {};
    for (p in defaultOptions)
      if (defaultOptions.hasOwnProperty(p) && !options.hasOwnProperty(p))
        options[p] = defaultOptions[p];

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
  schemaValidator.addFormat = function (name, func) {
    formatField[name] = func;
  };

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = schemaValidator;
  } else {
    this.schemaValidator = schemaValidator;
  }
}).call(this);
