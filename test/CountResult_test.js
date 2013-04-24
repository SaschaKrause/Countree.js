/*global require:true */
var countreeLib = require('../Countree.js');

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

function createCounterFromObject(timeObject, callback) {

    var customTimeCounterOption = {
        customTime: timeObject,
        onInterval: callback
    };

    var counter = new countreeLib.Countree();
    counter.setOptions(customTimeCounterOption);
    counter.init();
    return counter;
}

exports['CountResult'] = {
    setUp: function (done) {
        done();
    },
    /**
     * no time passed
     * @param test
     */
    'no time passed': function (test) {
        var counterTimeOption = {};
        createCounterFromObject(counterTimeOption,countingCallback);

        test.expect(6);

        function countingCallback(countResult) {
            test.equal(countResult.calculatedMilliseconds, 0);
            test.equal(countResult.formattedTime().getMilliSeconds(), 0);
            test.equal(countResult.formattedTime().getSeconds(), 0);
            test.equal(countResult.formattedTime().getMinutes(), 0);
            test.equal(countResult.formattedTime().getHours(), 0);
            test.equal(countResult.formattedTime().getDays(), 0);
        }

        test.done();
    },
    /**
     * added custom time (part 1)
     * @param test
     */
    'added custom time (part 1)': function (test) {
        var counterTimeOption = {
            startFrom: {
                seconds: '10'
            }
        };
        createCounterFromObject(counterTimeOption,countingCallback);

        test.expect(6);

        function countingCallback(countResult) {
            test.equal(countResult.calculatedMilliseconds, 10000);
            test.equal(countResult.formattedTime().getMilliSeconds(), 0);
            test.equal(countResult.formattedTime().getSeconds(), 10);
            test.equal(countResult.formattedTime().getMinutes(), 0);
            test.equal(countResult.formattedTime().getHours(), 0);
            test.equal(countResult.formattedTime().getDays(), 0);
        }

        test.done();
    },
    /**
     * added custom time (part 2)
     * @param test
     */
    'added custom time (part 2)': function (test) {
        var counterTimeOption = {
            startFrom: {
                days: '2',
                hours: '5',
                minutes: '3',
                seconds: '10'
            }
        };
        createCounterFromObject(counterTimeOption,countingCallback);

        test.expect(6);

        function countingCallback(countResult) {
            test.equal(countResult.calculatedMilliseconds, 190990000);
            test.equal(countResult.formattedTime().getMilliSeconds(), 0);
            test.equal(countResult.formattedTime().getSeconds(), 10);
            test.equal(countResult.formattedTime().getMinutes(), 3);
            test.equal(countResult.formattedTime().getHours(), 5);
            test.equal(countResult.formattedTime().getDays(), 2);
        }

        test.done();
    },
    /**
     * added custom time and fill digits with left zeros
     * @param test
     */
    'added custom time and fill digits with left zeros': function (test) {
        var counterTimeOption = {
            startFrom: {
                days: '2',
                hours: '5',
                minutes: '3',
                seconds: '10'
            }
        };
        createCounterFromObject(counterTimeOption,countingCallback);

        test.expect(6);

        function countingCallback(countResult) {
            test.equal(countResult.calculatedMilliseconds, 190990000);
            test.equal(countResult.formattedTime().getMilliSeconds(3), '000');
            test.equal(countResult.formattedTime().getSeconds(2), '10');
            test.equal(countResult.formattedTime().getMinutes(2), '03');
            test.equal(countResult.formattedTime().getHours(2), '05');
            test.equal(countResult.formattedTime().getDays(1), '2');
        }

        test.done();
    }

};
