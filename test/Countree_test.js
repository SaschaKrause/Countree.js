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

        // setup
        this.countResult = new Countree.CountResult();
        this.countResult.update(446582010);
        done();
    },
    'milliseconds to timeObject converting: valid': function (test) {
        test.expect(6);

        test.equal(this.countResult.getMillisecondsLeft(), 446582010);
        test.equal(this.countResult.getAsTimeObject().milliseconds, 10);
        test.equal(this.countResult.getAsTimeObject().seconds, 2);
        test.equal(this.countResult.getAsTimeObject().minutes, 3);
        test.equal(this.countResult.getAsTimeObject().hours, 4);
        test.equal(this.countResult.getAsTimeObject().days, 5);
        test.done();
    },
    'milliseconds to timeObject converting: invalid': function (test) {
        test.expect(6);

        test.notEqual(this.countResult.overallMillisecondsLeft, 446582011, 'should be invalid');
        test.notEqual(this.countResult.getAsTimeObject().milliseconds, 11, 'should be invalid');
        test.notEqual(this.countResult.getAsTimeObject().seconds, 21, 'should be invalid');
        test.notEqual(this.countResult.getAsTimeObject().minutes, 31, 'should be invalid');
        test.notEqual(this.countResult.getAsTimeObject().hours, 41, 'should be invalid');
        test.notEqual(this.countResult.getAsTimeObject().days, 51, 'should be invalid');
        test.done();
    },
    'milliseconds to doubleDigit timeObject strings: valid': function (test) {
        test.expect(4);

        test.equal(this.countResult.getAsTimeObject().getMillisecondsAsTripleDigitString(), '010');
        test.equal(this.countResult.getAsTimeObject().getSecondsAsDoubleDigitString(), '02');
        test.equal(this.countResult.getAsTimeObject().getMinutesAsDoubleDigitString(), '03');
        test.equal(this.countResult.getAsTimeObject().getHoursAsDoubleDigitString(), '04');
        test.done();
    },
    'milliseconds to doubleDigit timeObject strings: invalid': function (test) {
        test.expect(4);

        test.notEqual(this.countResult.getAsTimeObject().getMillisecondsAsTripleDigitString(), '011', 'should be invalid');
        test.notEqual(this.countResult.getAsTimeObject().getSecondsAsDoubleDigitString(), '2', 'should be invalid');
        test.notEqual(this.countResult.getAsTimeObject().getMinutesAsDoubleDigitString(), '04', 'should be invalid');
        test.notEqual(this.countResult.getAsTimeObject().getHoursAsDoubleDigitString(), '5', 'should be invalid');
        test.done();
    }
};
