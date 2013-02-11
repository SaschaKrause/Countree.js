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
        test.equal(countResult.formattedTime().getMilliSeconds(), 10);
        test.equal(countResult.formattedTime().getSeconds(), 2);
        test.equal(countResult.formattedTime().getMinutes(), 3);
        test.equal(countResult.formattedTime().getHours(), 4);
        test.equal(countResult.formattedTime().getDays(), 5);
        test.done();
    },
    'test for invalid data': function (test) {
        var countResult = createCountResultUpdatedToMilliseconds(446582010);
        var ms = countResult.getMillisecondsLeft();

        test.expect(6);
        test.notEqual(countResult.getMillisecondsLeft(), 446582011, 'should be invalid');
        test.notEqual(countResult.formattedTime().getMilliSeconds(), 11, 'should be invalid');
        test.notEqual(countResult.formattedTime().getSeconds(), 21, 'should be invalid');
        test.notEqual(countResult.formattedTime().getMinutes(), 31, 'should be invalid');
        test.notEqual(countResult.formattedTime().getHours(), 41, 'should be invalid');
        test.notEqual(countResult.formattedTime().getDays(), 51, 'should be invalid');
        test.done();
    },
    'fill digits for valid data': function (test) {
        var countResult = createCountResultUpdatedToMilliseconds(446582010);
        var ms = countResult.getMillisecondsLeft();

        test.expect(6);
        test.equal(countResult.getMillisecondsLeft(), 446582010);
        test.equal(countResult.formattedTime().getMilliSeconds(3), '010');
        test.equal(countResult.formattedTime().getSeconds(2), '02');
        test.equal(countResult.formattedTime().getMinutes(2), '03');
        test.equal(countResult.formattedTime().getHours(2), '04');
        test.equal(countResult.formattedTime().getDays(3), '005');
        test.done();
    },
    'fill digits for invalid data': function (test) {
        var countResult = createCountResultUpdatedToMilliseconds(446582010);
        var ms = countResult.getMillisecondsLeft();

        test.expect(6);
        test.notEqual(countResult.getMillisecondsLeft(), 446582011);
        test.notEqual(countResult.formattedTime().getMilliSeconds(3), '011');
        test.notEqual(countResult.formattedTime().getSeconds(2), '002');
        test.notEqual(countResult.formattedTime().getMinutes(2), '3');
        test.notEqual(countResult.formattedTime().getHours(2), '05');
        test.notEqual(countResult.formattedTime().getDays(3), '050');
        test.done();
    }
};
