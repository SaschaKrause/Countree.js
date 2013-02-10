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

exports['TimeMeasurement'] = {
    'TimeMeasurement(0) creates zeros for each digit': function (test) {
        var time = new Countree.TimeMeasurement(0);

        test.expect(5);
        test.equal(time.getDigitForTimeUnit(Countree.TIME_UNIT.MILLISECONDS), 0, 'Retained digit is incorrect.');
        test.equal(time.getDigitForTimeUnit(Countree.TIME_UNIT.SECONDS), 0, 'Retained digit is incorrect.');
        test.equal(time.getDigitForTimeUnit(Countree.TIME_UNIT.MINUTES), 0, 'Retained digit is incorrect.');
        test.equal(time.getDigitForTimeUnit(Countree.TIME_UNIT.HOURS), 0, 'Retained digit is incorrect.');
        test.equal(time.getDigitForTimeUnit(Countree.TIME_UNIT.DAYS), 0, 'Retained digit is incorrect.');
        test.done();
    },
    'TimeMeasurement(446582010) creates correct digits for each digit': function (test) {
        var time = new Countree.TimeMeasurement(446582010);

        test.expect(5);
        test.equal(time.getDigitForTimeUnit(Countree.TIME_UNIT.MILLISECONDS), 10, 'Retained digit is incorrect.');
        test.equal(time.getDigitForTimeUnit(Countree.TIME_UNIT.SECONDS), 2, 'Retained digit is incorrect.');
        test.equal(time.getDigitForTimeUnit(Countree.TIME_UNIT.MINUTES), 3, 'Retained digit is incorrect.');
        test.equal(time.getDigitForTimeUnit(Countree.TIME_UNIT.HOURS), 4, 'Retained digit is incorrect.');
        test.equal(time.getDigitForTimeUnit(Countree.TIME_UNIT.DAYS), 5, 'Retained digit is incorrect.');
        test.done();
    }
};

