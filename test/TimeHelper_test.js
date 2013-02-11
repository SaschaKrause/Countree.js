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

exports['TimeHelper'] = {
    'setUp':function (done) {
        this.msToDigit = Countree.TIME_HELPER.getDigitFromMsForTimeUnitLeftFilled; // aliasing for better readability
        this.unitMillis = Countree.TIME_UNIT.MILLISECONDS;
        this.unitSecs = Countree.TIME_UNIT.SECONDS;
        this.unitMins = Countree.TIME_UNIT.MINUTES;
        this.unitHours = Countree.TIME_UNIT.HOURS;
        this.unitDays = Countree.TIME_UNIT.DAYS;
        done();
    },
    'TimeHelper(0) creates zeros for each digit':function (test) {
        var ms = 0;

        test.expect(5);
        test.equal(this.msToDigit(ms, this.unitMillis), 0, 'Retained digit is incorrect.');
        test.equal(this.msToDigit(ms, this.unitSecs), 0, 'Retained digit is incorrect.');
        test.equal(this.msToDigit(ms, this.unitMins), 0, 'Retained digit is incorrect.');
        test.equal(this.msToDigit(ms, this.unitHours), 0, 'Retained digit is incorrect.');
        test.equal(this.msToDigit(ms, this.unitDays), 0, 'Retained digit is incorrect.');
        test.done();
    },
    'TimeHelper(446582010) creates correct digits for each digit':function (test) {
        var ms = 446582010;

        test.expect(5);
        test.equal(this.msToDigit(ms, this.unitMillis), 10, 'Retained digit is incorrect.');
        test.equal(this.msToDigit(ms, this.unitSecs), 2, 'Retained digit is incorrect.');
        test.equal(this.msToDigit(ms, this.unitMins), 3, 'Retained digit is incorrect.');
        test.equal(this.msToDigit(ms, this.unitHours), 4, 'Retained digit is incorrect.');
        test.equal(this.msToDigit(ms, this.unitDays), 5, 'Retained digit is incorrect.');
        test.done();
    },
    'Fill digits of 0':function (test) {
        var ms = 0;

        test.expect(1);
        test.ok(this.msToDigit(ms, this.unitMillis, 3) === '000', 'Retained digit is incorrect.');
        test.done();
    },
    'Fill digits for 446582010':function (test) {
        var ms = 446582010;

        test.expect(4);
        test.ok(this.msToDigit(ms, this.unitMillis, 3) === '010', 'Retained digit is incorrect.');
        test.ok(this.msToDigit(ms, this.unitSecs, 2) === '02', 'Retained digit is incorrect.');
        test.ok(this.msToDigit(ms, this.unitMins, 2) === '03', 'Retained digit is incorrect.');
        test.ok(this.msToDigit(ms, this.unitHours, 2) === '04', 'Retained digit is incorrect.');
        test.done();
    }
};

