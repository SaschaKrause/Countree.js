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

function createCountResultUpdatedToMilliseconds(milliseconds) {
    var countResult = new Countree.CountResult();
    countResult.update(milliseconds);
    return countResult;
}

exports['CountResult'] = {
    /*setUp: function (done) {
        done();
    },*/
    'milliseconds to timeObject converting: valid': function (test) {
        var countResult = createCountResultUpdatedToMilliseconds(446582010);

        test.expect(6);
        test.equal(countResult.getMillisecondsLeft(), 446582010);
        test.equal(countResult.getAsTimeObject().milliseconds, 10);
        test.equal(countResult.getAsTimeObject().seconds, 2);
        test.equal(countResult.getAsTimeObject().minutes, 3);
        test.equal(countResult.getAsTimeObject().hours, 4);
        test.equal(countResult.getAsTimeObject().days, 5);
        test.done();
    },
    'milliseconds to timeObject converting: invalid': function (test) {
        var countResult = createCountResultUpdatedToMilliseconds(446582010);

        test.expect(6);
        test.notEqual(countResult.overallMillisecondsLeft, 446582011, 'should be invalid');
        test.notEqual(countResult.getAsTimeObject().milliseconds, 11, 'should be invalid');
        test.notEqual(countResult.getAsTimeObject().seconds, 21, 'should be invalid');
        test.notEqual(countResult.getAsTimeObject().minutes, 31, 'should be invalid');
        test.notEqual(countResult.getAsTimeObject().hours, 41, 'should be invalid');
        test.notEqual(countResult.getAsTimeObject().days, 51, 'should be invalid');
        test.done();
    },
    'milliseconds to doubleDigit timeObject strings: valid': function (test) {
        var countResult = createCountResultUpdatedToMilliseconds(446582010);

        test.expect(4);
        test.equal(countResult.getAsTimeObject().getMillisecondsAsTripleDigitString(), '010');
        test.equal(countResult.getAsTimeObject().getSecondsAsDoubleDigitString(), '02');
        test.equal(countResult.getAsTimeObject().getMinutesAsDoubleDigitString(), '03');
        test.equal(countResult.getAsTimeObject().getHoursAsDoubleDigitString(), '04');
        test.done();
    },
    'milliseconds to doubleDigit timeObject strings: invalid': function (test) {
        var countResult = createCountResultUpdatedToMilliseconds(446582010);

        test.expect(4);
        test.notEqual(countResult.getAsTimeObject().getMillisecondsAsTripleDigitString(), '011', 'should be invalid');
        test.notEqual(countResult.getAsTimeObject().getSecondsAsDoubleDigitString(), '2', 'should be invalid');
        test.notEqual(countResult.getAsTimeObject().getMinutesAsDoubleDigitString(), '04', 'should be invalid');
        test.notEqual(countResult.getAsTimeObject().getHoursAsDoubleDigitString(), '5', 'should be invalid');
        test.done();
    }
};
