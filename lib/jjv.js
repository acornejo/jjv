/* jshint proto: true */

/**
 * jjv.js -- A javascript library to validate json input through a json-schema.
 *
 * Copyright (c) 2013 Alex Cornejo.
 *
 * Redistributable under a MIT-style open source license.
 */

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

  var handled = {
    'type': true,
    'not': true,
    'anyOf': true,
    'allOf': true,
    'oneOf': true,
    '$ref': true,
    '$schema': true,
    'id': true,
    'exclusiveMaximum': true,
    'exclusiveMininum': true,
    'properties': true,
    'patternProperties': true,
    'additionalProperties': true,
    'items': true,
    'additionalItems': true,
    'required': true,
    'default': true,
    'title': true,
    'description': true,
    'definitions': true,
    'dependencies': true
  };

  var enforceType = {
    'null': function (x) {
      return x === null;
    },
    'string': function (x) {
      return typeof x === 'string';
    },
    'boolean': function (x) {
      return typeof x === 'boolean';
    },
    'number': function (x) {
      return typeof x === 'number';
    },
    'integer': function (x) {
      return typeof x === 'number' && x%1 === 0;
    },
    'object': function (x) {
      return x && typeof x === 'object' && !Array.isArray(x);
    },
    'array': function (x) {
      return Array.isArray(x);
    },
    'date': function (x) {
      return x instanceof Date;
    }
  };

  // missing: uri, date-time, ipv4, ipv6
  var formatField = {
    'alpha': function (v) {
      return (/^[a-zA-Z]+$/).test(v);
    },
    'alphanumeric': function (v) {
      return (/^[a-zA-Z0-9]+$/).test(v);
    },
    'identifier': function (v) {
      return (/^[-_a-zA-Z0-9]+$/).test(v);
    },
    'hexadecimal': function (v) {
      return (/^[a-fA-F0-9]+$/).test(v);
    },
    'numeric': function (v) {
      return (/^[0-9]+$/).test(v);
    },
    'uppercase': function (v) {
      return v === v.toUpperCase();
    },
    'lowercase': function (v) {
      return v === v.toLowerCase();
    },
    'email': function (v) { // email, ipv4 and ipv6 adapted from node-validator
      return (/^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/).test(v);
    },
    'ipv4': function (v) {
      if ((/^(\d?\d?\d)\.(\d?\d?\d)\.(\d?\d?\d)\.(\d?\d?\d)$/).test(v)) {
        var parts = v.split('.').sort();
        if (parts[3] <= 255)
          return true;
      }
      return false;
    },
    'ipv6': function(v) {
      return (/^::|^::1|^([a-fA-F0-9]{1,4}::?){1,7}([a-fA-F0-9]{1,4})$/).test(str);
    }
  };

  var validateField = {
    'readOnly': function (v, p) {
      return false;
    },
    // ****** numeric validation ********
    'minimum': function (v, p, schema) {
      return !(v < p || schema.exclusiveMinimum && v <= p);
    },
    'maximum': function (v, p, schema) {
      return !(v > p || schema.exclusiveMaximum && v >= p);
    },
    'multipleOf': function (v, p) {
      return (v/p)%1 === 0 || typeof v !== 'number';
    },
    // ****** string validation ******
    'pattern': function (v, p) {
      if (typeof v !== 'string')
        return true;
      var pattern, modifiers;
      if (typeof p === 'string')
        pattern=p;
      else {
        pattern=p[0];
        modifiers=p[1];
      }
      var regex = new RegExp(pattern, modifiers);
      return regex.test(v);
    },
    'minLength': function (v, p) {
      return v.length >= p || typeof v !== 'string';
    },
    'maxLength': function (v, p) {
      return v.length <= p || typeof v !== 'string';
    },
    // ***** array validation *****
    'minItems': function (v, p) {
      return v.length >= p || !Array.isArray(v);
    },
    'maxItems': function (v, p) {
      return v.length <= p || !Array.isArray(v);
    },
    'uniqueItems': function (v, p) {
      var hash = {}, key;
      for (var i = 0, len = v.length; i < len; i++) {
        key = JSON.stringify(v[i]);
        if (hash.hasOwnProperty(key))
          return false;
        else
          hash[key] = true;
      }
      return true;
    },
    // ***** object validation ****
    'minProperties': function (v, p) {
      if (typeof v !== 'object')
        return true;
      var count = 0;
      for (var attr in v) if (v.hasOwnProperty(attr)) count = count + 1;
      return count >= p;
    },
    'maxProperties': function (v, p) {
      if (typeof v !== 'object')
        return true;
      var count = 0;
      for (var attr in v) if (v.hasOwnProperty(attr)) count = count + 1;
      return count <= p;
    },
    // ****** all *****
    'enum': function (v, p) {
      var i, len, vs;
      if (typeof v === 'object') {
        vs = JSON.stringify(v);
        for (i = 0, len = p.length; i < len; i++)
          if (vs === JSON.stringify(p[i]))
            return true;
      } else {
        for (i = 0, len = p.length; i < len; i++)
          if (v === p[i])
            return true;
      }
      return false;
    }
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

    if (uri === '')
      return [root_schema, root_schema];

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

  var checkValidity = function (env, root_schema, schema, object, name, options) {
    var p, v, malformed = false, objerrs = {}, objerr, objreq, errors = {}, props, matched, isArray;
    var i, len, count, orig_object = {}, refs, prop;

    if (object.hasOwnProperty(name)) {
      prop = object[name];

      if (schema.hasOwnProperty('$ref')) {
        refs = resolveURI(env, root_schema, schema.$ref);
        if (!refs)
          return {'$ref': schema.$ref};
        else
          return checkValidity(env, refs[0], refs[1], object, name, options);
      }

      if (schema.hasOwnProperty('type')) {
        if (typeof schema.type === 'string') {
          if (!env.enforceType[schema.type](prop))
            return {'type': schema.type};
        } else {
          malformed = true;
          for (i = 0, len = schema.type.length; i < len && malformed; i++)
            if (env.enforceType[schema.type[i]](prop))
              malformed = false;
          if (malformed)
            return {'type': schema.type};
        }
      }

      if (schema.hasOwnProperty('allOf')) {
        for (i = 0, len = schema.allOf.length; i < len; i++) {
          objerr = checkValidity(env, root_schema, schema.allOf[i], object, name, options);
          if (objerr)
            return objerr;
        }
      }

      if (schema.hasOwnProperty('oneOf')) {
        for (i = 0, len = schema.oneOf.length, count = 0; i < len; i++) {
          orig_object[name] = clone(object[name]);
          objerr = checkValidity(env, root_schema, schema.oneOf[i], orig_object, name, options);
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
        objerrs = {};
      }

      if (schema.hasOwnProperty('anyOf')) {
        for (i = 0, len = schema.anyOf.length; i < len; i++) {
          orig_object[name] = clone(object[name]);
          objerr = checkValidity(env, root_schema, schema.anyOf[i], orig_object, name, options);
          if (!objerr) {
            object[name] = orig_object[name];
            break;
          }
        }
        if (objerr)
          return objerr;
      }

      if (schema.hasOwnProperty('not')) {
        orig_object[name] = clone(object[name]);
        objerr = checkValidity(env, root_schema, schema.not, orig_object, name, options);
        if (!objerr)
          return {'not': true};
      }

      if (schema.hasOwnProperty('dependencies')) {
        for (p in schema.dependencies)
          if (schema.dependencies.hasOwnProperty(p) && prop.hasOwnProperty(p)) {
            if (Array.isArray(schema.dependencies[p])) {
              for (i = 0, len = schema.dependencies[p].length; i < len; i++)
                if (!prop.hasOwnProperty(schema.dependencies[p][i])) {
                  return {'dependencies': true};
                }
            } else {
              objerr = checkValidity(env, root_schema, schema.dependencies[p], object, name, options);
              if (objerr)
                return objerr;
            }
          }
      }

      if (!Array.isArray(prop)) {
        props = [];
        objerrs = {};
        for (p in prop)
          if (prop.hasOwnProperty(p))
            props.push(p);

        if (options.checkRequired && schema.required) {
          for (i = 0, len = schema.required.length; i < len; i++)
            if (!prop.hasOwnProperty(schema.required[i])) {
              objerrs[schema.required[i]] = {'required': true};
              malformed = true;
            }
        }

        i = props.length;
        while (i--) {
          matched = false;
          if (schema.properties && schema.properties.hasOwnProperty(props[i])) {
            matched = true;
            objerr = checkValidity(env, root_schema, schema.properties[props[i]], prop, props[i], options);
            if (objerr !== null) {
              objerrs[props[i]] = objerr;
              malformed = true;
            }
          }
          if (schema.patternProperties) {
            for (p in schema.patternProperties)
              if (schema.patternProperties.hasOwnProperty(p) && props[i].match(p)) {
                matched = true;
                objerr = checkValidity(env, root_schema, schema.patternProperties[p], prop, props[i], options);
                if (objerr !== null) {
                  objerrs[props[i]] = objerr;
                  malformed = true;
                }
              }
          }
          if (matched)
            props.splice(i, 1);
        }

        if (options.removeAdditional && schema.additionalProperties !== true && typeof schema.additionalProperties !== 'object') {
          for (i = 0, len = props.length; i < len; i++)
            delete prop[props[i]];
        } else
        if (schema.hasOwnProperty('additionalProperties')) {
          if (typeof schema.additionalProperties === 'boolean') {
            if (!schema.additionalProperties) {
              for (i = 0, len = props.length; i < len; i++) {
                objerrs[props[i]] = {'additional': true};
                malformed = true;
              }
            }
          } else {
            for (i = 0, len = props.length; i < len; i++) {
              objerr = checkValidity(env, root_schema, schema.additionalProperties, prop, props[i], options);
              if (objerr !== null) {
                objerrs[props[i]] = objerr;
                malformed = true;
              }
            }
          }
        }
        if (malformed)
          return {'schema': objerrs};
      } else {
        if (schema.hasOwnProperty('items')) {
          if (Array.isArray(schema.items)) {
            for (i = 0, len = schema.items.length; i < len; i++) {
              objerr = checkValidity(env, root_schema, schema.items[i], prop, i, options);
              if (objerr !== null) {
                objerrs[i] = objerr;
                malformed = true;
              }
            }
            if (prop.length > len && schema.hasOwnProperty('additionalItems')) {
              if (typeof schema.additionalItems === 'boolean') {
                if (!schema.additionalItems)
                  return {'additionalItems': true};
              } else {
                for (i = len, len = prop.length; i < len; i++) {
                  objerr = checkValidity(env, root_schema, schema.additionalItems, prop, i, options);
                  if (objerr !== null) {
                    objerrs[i] = objerr;
                    malformed = true;
                  }
                }
              }
            }
          } else {
            for (i = 0, len = prop.length; i < len; i++) {
              objerr = checkValidity(env, root_schema, schema.items, prop, i, options);
              if (objerr !== null) {
                objerrs[i] = objerr;
                malformed = true;
              }
            }
          }
        } else if (schema.hasOwnProperty('additionalItems')) {
          if (typeof schema.additionalItems !== 'boolean') {
            for (i = 0, len = prop.length; i < len; i++) {
              objerr = checkValidity(env, root_schema, schema.additionalItems, prop, i, options);
              if (objerr !== null) {
                objerrs[i] = objerr;
                malformed = true;
              }
            }
          }
        }
        if (malformed)
          return {'schema': objerrs};
      }

      for (v in schema) {
        if (schema.hasOwnProperty(v) && !handled.hasOwnProperty(v)) {
          if (v === 'format') {
            if (env.formatField.hasOwnProperty(schema[v]) && !env.formatField[schema[v]](prop, schema, name, options)) {
              objerrs[v] = true;
              malformed = true;
            }
          } else {
            if (env.validateField.hasOwnProperty(v) && !env.validateField[v](prop, schema[v], schema, name, options)) {
              objerrs[v] = true;
              malformed = true;
            }
          }
        }
      }
      if (malformed)
        return objerrs;
    } else if (options.useDefault && schema.hasOwnProperty('default')) {
      object[name] = schema['default'];
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
      var refs, errors = null, root_key = '', root_object = {};

      if (typeof name === 'string') {
        refs = resolveURI(this, null, name);
        if (!refs)
          throw new Error('jjv: could not find schema \'' + name + '\'.');
      } else {
        refs = [name, name];
      }

      options = options || {};
      for (var p in defaultOptions)
        if (defaultOptions.hasOwnProperty(p) && !options.hasOwnProperty(p))
          options[p] = defaultOptions[p];

      root_object[root_key] = object;
      errors = checkValidity(this, refs[0], refs[1], root_object, root_key, options);

      if (errors) {
        return {validation: errors.hasOwnProperty('schema') ? errors.schema : errors};
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
