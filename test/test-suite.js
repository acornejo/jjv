/*jshint expr:true */

var jjv = jjv || require('..');
var env = jjv();
var expect = require('chai').expect;
var fs = require('fs');

var TEST_DIR = __dirname + '/fixtures';
var SKIP_TEST = ["change resolution scope"];

var files = fs.readdirSync(TEST_DIR).filter(function (x) { return x.indexOf('.json') !== -1; }), f;
var tests = [];

env.addSchema('http://json-schema.org/draft-04/schema', require(__dirname + '/draft-04-schema.json'));
env.addSchema('http://localhost:1234/integer.json', {type: 'integer'});
env.addSchema('http://localhost:1234/subSchemas.json', {
                "integer": { "type": "integer" },
                "refToInteger": { "$ref": "#/integer" }
});

function runTest(i, j, k) {
  var schema = tests[i][j].schema;
  var test = tests[i][j].tests[k];
  var validateOptions = test.validateOptions || env.defaultOptions;
  var res = env.validate(schema, test.data, validateOptions);
  it(test.description, function () {
    if (test.valid) {
      expect(res).to.be.equal(null);
      if (test.hasOwnProperty('result'))
        expect(test.data).to.eql(test.result);
    } else {
      expect(res).not.to.be.equal(null);
    }
  });
}

function runSuite(i, j) {
  var suite = tests[i][j];
  if (SKIP_TEST.indexOf(suite.description) !== -1)
    return;
  describe(suite.description, function () {
    for (var k = 0, len = suite.tests.length; k < len; k++)
      runTest(i, j, k);
  });
}

function runGroup(i) {
  return function () {
    for (var j = 0, len = tests[i].length; j < len; j++)
      runSuite(i, j);
  };
}

for (var i = 0; i < files.length; i++) {
    tests.push(require(TEST_DIR + '/' + files[i]));
    describe(files[i], runGroup(i));
}
