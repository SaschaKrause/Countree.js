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
    setUp: function (done) {
        done();
    },
    'no time passed': function (test) {
        var countResult = createCountResultUpdatedToMilliseconds(446582010);
        var ms = countResult.getMillisecondsLeft();

        test.expect(6);
        test.equal(countResult.getMillisecondsLeft(), 446582010);
        test.equal(Countree.TIME_UTIL.getDigitFromMsForTimeUnit(ms, Countree.TIME_UNIT.MILLISECONDS), 10);
        test.equal(Countree.TIME_UTIL.getDigitFromMsForTimeUnit(ms, Countree.TIME_UNIT.SECONDS), 2);
        test.equal(Countree.TIME_UTIL.getDigitFromMsForTimeUnit(ms, Countree.TIME_UNIT.MINUTES), 3);
        test.equal(Countree.TIME_UTIL.getDigitFromMsForTimeUnit(ms, Countree.TIME_UNIT.HOURS), 4);
        test.equal(Countree.TIME_UTIL.getDigitFromMsForTimeUnit(ms, Countree.TIME_UNIT.DAYS), 5);
        test.done();
    },
    'test for invalid data': function (test) {
        var countResult = createCountResultUpdatedToMilliseconds(446582010);
        var ms = countResult.getMillisecondsLeft();

        test.expect(6);
        test.notEqual(countResult.getMillisecondsLeft(), 446582011, 'should be invalid');
        test.notEqual(Countree.TIME_UTIL.getDigitFromMsForTimeUnit(ms, Countree.TIME_UNIT.MILLISECONDS), 11, 'should be invalid');
        test.notEqual(Countree.TIME_UTIL.getDigitFromMsForTimeUnit(ms, Countree.TIME_UNIT.SECONDS), 21, 'should be invalid');
        test.notEqual(Countree.TIME_UTIL.getDigitFromMsForTimeUnit(ms, Countree.TIME_UNIT.MINUTES), 31, 'should be invalid');
        test.notEqual(Countree.TIME_UTIL.getDigitFromMsForTimeUnit(ms, Countree.TIME_UNIT.HOURS), 41, 'should be invalid');
        test.notEqual(Countree.TIME_UTIL.getDigitFromMsForTimeUnit(ms, Countree.TIME_UNIT.DAYS), 51, 'should be invalid');
        test.done();
    }
};
