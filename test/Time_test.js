/*global require:true */
var Countree = require('../Countree.js');

/*
 ======== A Handy Little Nodeunit Reference ========
 https://github.com/caolan/nodeunit

 Test methods:
 test.expect(numAssertions)
 test.done()
 Test assertions:
 test.ok(value, [message])
 test.equal(actual, expected, [message])
 test.notEqual(actual, expected, [message])
 test.deepEqual(actual, expected, [message])
 test.notDeepEqual(actual, expected, [message])
 test.strictEqual(actual, expected, [message])
 test.notStrictEqual(actual, expected, [message])
 test.throws(block, [error], [message])
 test.doesNotThrow(block, [error], [message])
 test.ifError(value)
 */

exports['Time'] = {
    'Time(0) creates zeros at each digit': function (test) {
        test.expect(1);
        test.equal(false, false, 'message');
        test.done();
    },
    '...': function (test) {

        test.expect(1);
        test.notEqual(true, false, 'should be invalid');

        test.done();
    }
};
