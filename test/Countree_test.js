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

exports['CountResult'] = {
    setUp: function (done) {

        // setup here
        this.countResult = new Countree.CountResult();
        this.countResult.update(123452132);
        done();
    },
    'milliseconds to timeObject converting': function (test) {
        test.expect(6);

        // tests here
        test.equal(this.countResult.overallMillisecondsLeft, 123452132, 'should be awesome.');
        test.equal(this.countResult.getAsTimeObject().milliseconds, 132, 'should be awesome.');
        test.equal(this.countResult.getAsTimeObject().seconds, 32, 'should be awesome.');
        test.equal(this.countResult.getAsTimeObject().minutes, 17, 'should be awesome.');
        test.equal(this.countResult.getAsTimeObject().hours, 10, 'should be awesome.');
        test.equal(this.countResult.getAsTimeObject().days, 1, 'should be awesome.');
        test.done();
    }
};
