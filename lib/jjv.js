/* jshint proto: true */

/**
 * jjv.js -- A javascript library to validate json input through a json-schema.
 *
 * Copyright (c) 2013 Alex Cornejo.
 *
 * Redistributable under a MIT-style open source license.
 */

// TODO: id, $schema, patternProperties, not, dependencies

(function () {
  var clone = function (obj) {
      // Handle the 3 simple types, and null or undefined
      if (obj === null || typeof obj !== 'object') return obj;
      var copy;

      // Handle Date
      if (obj instanceof Date) {
          copy = new Date();
          copy.setTime(obj.getTime());
          return copy;
      }

      // handle RegExp
      if (obj instanceof RegExp) {
        copy = new RegExp(obj);
        return copy;
      }

      // Handle Array
      if (obj instanceof Array) {
          copy = [];
          for (var i = 0, len = obj.length; i < len; i++)
              copy[i] = clone(obj[i]);
          return copy;
      }

      // Handle Object
      if (obj instanceof Object) {
          copy = {};
          copy = Object.create(Object.getPrototypeOf(obj));
          for (var attr in obj) {
              if (obj.hasOwnProperty(attr))
                copy[attr] = clone(obj[attr]);
          }
          return copy;
      }

      throw new Error("Unable to clone object!");
  };

  var enforceType = {
    'null': function (x) {
      if (x !== null)
        throw new Error('is not null');
      return x;
    },
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
      if (!x || typeof x !== 'object' || !(x instanceof Array))
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
  var formatField = {
    'alpha': function (v) {
      if (typeof v !== 'string' ||  !(/^[a-zA-Z]+$/.test(v)))
        throw new Error('is not alpha');
    },
    'alphanumeric': function (v) {
      if (typeof v !== 'string' || !(/^[a-zA-Z0-9]+$/.test(v)))
        throw new Error('is not alpha numeric');
    },
    'identifier': function (v) {
      if (typeof v !== 'string' || !(/^[-_a-zA-Z0-9]+$/.test(v)))
        throw new Error('is not a username');
    },
    'hexadecimal': function (v) {
      if (typeof v !== 'string' || !(/^[a-fA-F0-9]+$/.test(v)))
        throw new Error('is not hexadecimal');
    },
    'numeric': function (v) {
      if (typeof v !== 'string' || !(/^[0-9]+$/.test(v)))
        throw new Error('is not numeric');
    },
    'uppercase': function (v) {
      if (typeof v !== 'string' || v !== v.toUpperCase())
        throw new Error('is not uppercase');
    },
    'lowercase': function (v) {
      if (typeof v !== 'string' || v !== v.toLowerCase())
        throw new Error('is not lowercase');
    },
    'email': function (v) { // email, ipv4 and ipv6 adapted from node-validator
      if (typeof v !== 'string' || !(/^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/.test(v)))
        throw new Error('is not email');
    },
    'ipv4': function (v) {
      if (/^(\d?\d?\d)\.(\d?\d?\d)\.(\d?\d?\d)\.(\d?\d?\d)$/.test(v)) {
        var parts = v.split('.').sort();
        if (parts[3] <= 255)
          return;
      }
      throw new Error('not ipv4');
    },
    'ipv6': function(v) {
      if (!(/^::|^::1|^([a-fA-F0-9]{1,4}::?){1,7}([a-fA-F0-9]{1,4})$/.test(str)))
        throw new Error('not ipv6');
    }
  };

  var validateField = {
    'readOnly': function (v, p) {
      throw new Error('is read only');
    },
    // ****** numeric validation ********
    'minimum': function (v, p, schema) {
      if (v < p || schema.exclusiveMinimum && v <= p)
        throw new Error('too small');
    },
    'maximum': function (v, p, schema) {
      if (v > p || schema.exclusiveMaximum && v >= p)
        throw new Error('too large');
    },
    'exclusiveMinimum': function (v, p) {},
    'exclusiveMaximum': function (v, p) {},
    'multipleOf': function (v, p) {
      if (v%p !== 0)
        throw new Error('not multiple of');
    },
    // ****** string validation ******
    'pattern': function (v, p) {
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
    },
    'minLength': function (v, p) {
      if (v.length < p)
        throw new Error('too small');
    },
    'maxLength': function (v, p) {
      if (v.length > p)
        throw new Error('too large');
    },
    // ***** array validation *****
    'minItems': function (v, p) {
      if (v.length < p)
        throw new Error('too small');
    },
    'maxItems': function (v, p) {
      if (v.length > p)
        throw new Error('too large');
    },
    'uniqueItems': function (v, p) {
      var hash = {}, key;
      for (var i = 0, len = v.length; i < len; i++) {
        key = JSON.stringify(v[i]);
        if (hash.hasOwnProperty(key))
          throw new Error('items not unique');
        else
          hash[key] = true;
      }
    },
    // ***** object validation ****
    'minProperties': function (v, p) {
      var count = 0;
      for (var prop in v) if (v.hasOwnProperty(prop)) count = count + 1;
      if (count < p)
        throw new Error('too few properties');
    },
    'maxProperties': function (v, p) {
      var count = 0;
      for (var prop in v) if (v.hasOwnProperty(prop)) count = count + 1;
      if (count > p)
        throw new Error('too few properties');
    },
    // ****** all *****
    'enum': function (v, p) {
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
      throw new Error('not found in set');
    }
  };

  var isRequired = function (p, required) {
    var i, len;
    if (!(required instanceof Array))
      return false;
    for (i = 0, len = required.length; i<len; i++)
      if (required[i] === p)
        return true;
    return false;
  };

  var resolveURI = function (env, root_schema, uri) {
    var components, curschema, hash_idx, name;

    if (uri === '#') {
      if (root_schema)
        return [root_schema, root_schema];
      else
        return null;
    }

    hash_idx = uri.indexOf('#');

    if (hash_idx === -1) {
      if (!env.schema.hasOwnProperty(uri))
        return null;
      return [env.schema[uri], env.schema[uri]];
    }

    if (hash_idx > 0) {
      name = uri.substr(0, hash_idx);
      uri = uri.substr(hash_idx+1);
      if (!env.schema.hasOwnProperty(name))
        return null;
      root_schema = env.schema[name];
    } else {
      if (!root_schema)
        return null;
      uri = uri.substr(1);
    }

    if (uri.charAt(0) === '/') {
      uri = uri.substr(1);

      curschema = root_schema;
      components = uri.split('/');
      while (components.length > 0) {
        if (!curschema.hasOwnProperty(components[0]))
          return null;
        curschema = curschema[components[0]];
        components.shift();
      }
      return [root_schema, curschema];
    } else // FIX: should look for subschemas of root_schema whose id matches uri
      return null;
  };

  var checkValidity = function (env, root_schema, schema, object, name, required, options) {
    var p, v, malformed = false, objerrs = {}, objerr, objreq, errors = {};
    var i, len, count, orig_object = {}, refs;

    if (schema.hasOwnProperty('$ref')) {
      refs = resolveURI(env, root_schema, schema.$ref);
      if (!refs)
        throw new Error('jjv: in property \'' + name + '\' couldn\'t resolve reference to \'' + schema.$ref + '\'.');
      return checkValidity(env, refs[0], refs[1], object, name, required, options);
    } else if (schema.hasOwnProperty('allOf')) {
      if (!(schema.allOf instanceof Array) || schema.allOf.length === 0)
        throw new Error('jjv: in property \'' + name + '\' allOf is not a schema array.');
      for (i = 0, len = schema.allOf.length; i < len; i++) {
        objerr = checkValidity(env, root_schema, schema.allOf[i], object[name], name, required, options);
        if (objerr)
          return objerr;
      }
      return null;
    } else if (schema.hasOwnProperty('oneOf')) {
      if (!(schema.oneOf instanceof Array) || schema.oneOf.length === 0)
        throw new Error('jjv: in property \'' + name + '\' oneOf is not a schema array.');
      for (i = 0, len = schema.oneOf.length, count = 0; i < len; i++) {
        orig_object[name] = clone(object[name]);
        objerr = checkValidity(env, root_schema, schema.oneOf[i], orig_object, name, required, options);
        if (!objerr) {
          count = count + 1;
          if (count > 1)
            break;
          else
            object[name] = orig_object[name];
        } else {
          objerrs = objerr;
        }
      }
      if (count > 1)
        return {'oneOf': true};
      else if (count < 1)
        return objerrs;
      else
        return null;
    } else if (schema.hasOwnProperty('anyOf')) {
      if (!(schema.anyOf instanceof Array) || schema.anyOf.length === 0)
        throw new Error('jjv: in property \'' + name + '\' anyOf is not a schema array.');
      for (i = 0, len = schema.anyOf.length; i < len; i++) {
        orig_object[name] = clone(object[name]);
        objerr = checkValidity(env, root_schema, schema.anyOf[i], orig_object, name, required, options);
        if (!objerr) {
          object[name] = orig_object[name];
          return null;
        }
      }
      return objerr;
    }

    if (object.hasOwnProperty(name)) {
      // enforce type for object
      if (schema.hasOwnProperty('type')) {
        if (typeof schema.type === 'string') {
          try {
            object[name] = env.enforceType[schema.type](object[name]);
          } catch (err) {
            return {'type': schema.type};
          }
        } else {
          malformed = true;
          for (i = 0, len = schema.type.length; i < len && malformed; i++) {
            try {
              object[name] = env.enforceType[schema.type[i]](object[name]);
              malformed = false;
            } catch (err) { }
          }
          if (malformed)
            return {'type': schema.type};
        }
      }

      if (schema.hasOwnProperty('properties')) {
        objerrs = {};
        objreq = [];
        for (p in schema.properties) {
          objerr = checkValidity(env, root_schema, schema.properties[p], object[name], p, schema.required, options);
          if (objerr !== null) {
            objerrs[p] = objerr;
            malformed = true;
          }
        }
        if (schema.hasOwnProperty('additionalProperties')) {
          if (typeof schema.additionalProperties === 'boolean') {
            if (!schema.additionalProperties) {
              if (options.removeAdditional) {
                for (p in object[name])
                  if (object[name].hasOwnProperty(p) && !schema.properties.hasOwnProperty(p))
                    delete object[name][p];
              } else {
                for (p in object[name])
                  if (object[name].hasOwnProperty(p) && !schema.properties.hasOwnProperty(p)) {
                    objerrs[p] = {'additional': true};
                    malformed = true;
                  }
              }
            }
          } else {
            for (p in object[name])
              if (object[name].hasOwnProperty(p) && !schema.properties.hasOwnProperty(p)) {
                objerr = checkValidity(env, root_schema, schema.additionalProperties, object[name], p, schema.required, options);
                if (objerr !== null) {
                  objerrs[p] = objerr;
                  malformed = true;
                }
              }
          }
        }
        if (malformed)
          return {'schema': objerrs};
      } else if (schema.hasOwnProperty('additionalProperties')) {
        objerrs = {};
        if (typeof schema.additionalProperties === 'boolean') {
          if (!schema.additionalProperties) {
            if (!options.removeAdditional)
              for (p in object[name])
                if (object[name].hasOwnProperty(p)) {
                  objerrs[p] = {'additional': true};
                  malformed = true;
                }
            else
              for (p in object[name])
                if (object[name].hasOwnProperty(p))
                  delete object[name][p];
          }
        } else {
          for (p in object[name])
            if (object[name].hasOwnProperty(p)) {
              objerr = checkValidity(env, root_schema, schema.additionalProperties, object[name], p, schema.required, options);
              if (objerr !== null) {
                objerrs[p] = objerr;
                malformed = true;
              }
            }
        }
        if (malformed)
          return {'schema': objerrs};
      }

      if (schema.hasOwnProperty('items')) {
        malformed = false;
        objerrs = {};
        if (schema.items instanceof Array) {
          for (i = 0, len = schema.items.length; i < len; i++) {
            objerr = checkValidity(env, root_schema, schema.items[i], object[name], i, schema.required, options);
            if (objerr !== null) {
              objerrs[i] = objerr;
              malformed = true;
            }
          }
          if (object[name].length > len && schema.hasOwnProperty('additionalItems')) {
            if (typeof schema.additionalItems === 'boolean') {
              if (!schema.additionalItems)
                return {'additionalItems': true};
            } else {
              for (i = len, len = object[name].length; i < len; i++) {
                objerr = checkValidity(env, root_schema, schema.additionalItems, object[name], i, schema.required, options);
                if (objerr !== null) {
                  objerrs[i] = objerr;
                  malformed = true;
                }
              }
            }
          }
        } else {
          for (i = 0, len = object[name].length; i < len; i++) {
            objerr = checkValidity(env, root_schema, schema.items, object[name], i, schema.required, options);
            if (objerr !== null) {
              objerrs[i] = objerr;
              malformed = true;
            }
          }
        }
        if (malformed)
          return {'schema': objerrs};
      } else if (schema.hasOwnProperty('additionalItems')) {
        if (typeof schema.additionalItems === 'boolean') {
          if (!schema.additionalItems)
            if (object[name].length > 0)
              return {'additionalItems': true};
        } else {
          objerrs = {};
          for (i = 0, len = object[name].length; i < len; i++) {
            objerr = checkValidity(env, root_schema, schema.additionalItems, object[name], i, schema.required, options);
            if (objerr !== null) {
              objerrs[i] = objerr;
              malformed = true;
            }
          }
        }
        if (malformed)
          return {'schema': objerrs};
      }

      malformed = false;
      objerrs = {};

      for (v in schema) {
        if (schema.hasOwnProperty(v) && v !== 'properties' && v !== 'additionalProperties' && v !== 'items' && v !== 'additionalItems' && v !== 'type' && v !== 'required' && v !== 'default' && v !== 'title' && v !== 'description' && v !== 'definitions' && v !== '$ref' && v !== '$schema') {
          if (v === 'format') {
            if (typeof schema[v] !== 'string')
              throw new Error('jjv: format must be a string');
            if (!env.formatField.hasOwnProperty(schema[v]))
              throw new Error('jjv: property \'' + name + '\' has unsupported format \'' + schema[v] + '\'.');
            try {
              env.formatField[schema[v]](object[name], name, options);
            } catch(err) {
              objerrs[v] = true;
              malformed = true;
            }
          } else {
            if (!env.validateField.hasOwnProperty(v))
              throw new Error('jjv: property \'' + name + '\' has unsupported validation \'' + v + '\'.');
            try {
              env.validateField[v](object[name], schema[v], schema, name, options);
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
      if (options.checkRequired && required && isRequired(name, required))
        return {'required': true};
      else if (options.useDefault && schema.hasOwnProperty('default')) {
        try {
          object[name] = env.enforceType[schema.type](schema['default']);
        } catch (err) {
          return {'default': schema.type};
        }
      }
    }

    return null;
  };

  var defaultOptions = {
    useDefault: true,
    checkRequired: true,
    removeAdditional: false
  };

  function Environment() {
    if (!(this instanceof Environment))
      return new Environment();

    this.enforceType = clone(enforceType);
    this.validateField = clone(validateField);
    this.formatField = clone(formatField);
    this.schema = {};
  }

  Environment.prototype = {
    validate: function (name, object, options) {
      var refs;

      if (typeof name === 'string') {
        refs = resolveURI(this, null, name);
        if (!refs)
          throw new Error('jjv: could not find schema \'' + name + '\'.');
      } else {
        refs = [name, name];
      }

      var errors, validation = null, properr, root_key = '', root_object = {};

      options = options || {};
      for (var p in defaultOptions)
        if (defaultOptions.hasOwnProperty(p) && !options.hasOwnProperty(p))
          options[p] = defaultOptions[p];

      root_object[root_key] = object;
      properr = checkValidity(this, refs[0], refs[1], root_object, root_key, [root_key], options);
      if (properr)
        validation = properr.hasOwnProperty('schema') ? properr.schema : properr;

      if (validation) {
        return {validation: validation};
      } else
        return null;
    },

    addType: function (name, func) {
      this.enforceType[name] = func;
    },

    addCheck: function (name, func) {
      this.validateField[name] = func;
    },

    addFormat: function (name, func) {
      this.formatField[name] = func;
    },

    addSchema: function (name, schema) {
      if (!schema && name) {
        schema = name;
        name = undefined;
      }
      if (schema.hasOwnProperty('id') && typeof schema.id === 'string' && schema.id !== name) {
        if (schema.id.charAt(0) === '/')
          throw new Error('jjv: schema id\'s starting with / are invalid.');
        this.schema[schema.id] = schema;
      } else if (!name) {
        throw new Error('jjv: schema needs either a name or id attribute.');
      }
      if (name)
        this.schema[name] = schema;
    }
  };

  // Export for use in server and client.
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = Environment;
  else if (typeof define === 'function' && define.amd)
    define(function () {return Environment;});
  else
    window.jjv = Environment;
})();
