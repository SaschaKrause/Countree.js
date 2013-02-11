/*
 * Countree
 * https://github.com/SaschaKrause/Countree
 *
 * Copyright (c) 2013 Sascha Krause
 * Licensed under the MIT license.
 */

// TODO: [FEATURE]  provide the possibility to register some kind of event listener to a countree which is called on custom events (e.g. "5 minutes before counter ends")
// TODO: [FEATURE]  be able to add the configOptions after instantiation (e.g. setOptions(options))
// TODO: [FEATURE]  get progress in % (e.g. 13% are already counted down/up)
// TODO: [FEATURE]  add AMD-loader ability
// TODO: [FEATURE]  provide option: CONTINUE_AFTER_FINISH and STOP_AFTER_FINISH (e.g. when counting from 10, should the counter stop at 0, or should it go further [e.g. to -100])
// TODO: [FEATURE]  provide the possibility to not just only count the time, but also other numeric stuff (e.g. count +1 every time one hits a button)
// TODO: [BUG]      when not displaying the milliseconds to the user, it seems like a bug (to him) that a second is "missing" (because of rounding issues)
// TODO: [BUG]      Error handling strategy (and convenience methods!) for public methods
// TODO: [TEST]     add some Jasmine tests
// TODO: [DEMO]     use a templating framework (e.g. handlebars) to demonstrate the power of the CountResult.getTimeObject()

(function (exports) {

    /** @constant */
    var COUNT_DIRECTION = {
        DOWN: 'down',
        UP: 'up'
    };

    /** @constant */
    var TIME_UNIT =  {
        MILLISECONDS: 'ms',
        SECONDS: 's',
        MINUTES: 'm',
        HOURS: 'h',
        DAYS: 'd'
    };

    /**
     *
     * @param configOptions
     * @constructor
     */
    function Countree(configOptions) {

        var that = this;

        /**
         * The interval reference is used to identify the active interval, so that it could be cleared (e.g. for suspending
         * or restarting).
         * A counter can only have one interval reference (because a single counter can only create a single interval).
         * @type {Number}
         */
        var intervalRef;

        /**
         * The milliseconds left/to go (depends if counting up or down) to count from/to when resuming the counter after
         * it is suspended.
         * @type {Number}
         */
        var millisecondsForContinuePoint = 0;

        /**
         *
         */
        var intervalCallbackRef;


        this.version = '0.0.1';

        // fill options with defaults
        // furthermore, this gives an overview of the available (and settable) user configurable options.
        this.options = {
            milliseconds: 0,
            seconds: 0,
            minutes: 0,
            hours: 0,
            days: 0,
            updateIntervalInMilliseconds: 1000,
            direction: COUNT_DIRECTION.UP,
            name: 'untitled'
        };
        // update/extend the default options with the user config options
        extendObjectBy(this.options, configOptions);

        // this countResult instance contain all information about the current counter values (e.g. milliseconds left/to go).
        // This result will be provided as parameter to the users callback (@see start(callback))
        this.countResult = new CountResult(this, getTotalMillisecondsFromObject(this.options));

        /**
         * Indicates if the counter is currently active by counting down or up.
         * @type {Boolean}
         */
        this.isCounting = false;


        function onCountingInterval(callback, countStartDate, totalMillisecondsToGo, resumed) {
            //directly update the countResult BEFORE the interval starts (so that the users callback is invoked immediately)
            updateCounterBeforeIntervalStart(totalMillisecondsToGo, callback);

            var timeToAddWhenResumed = resumed ? millisecondsForContinuePoint : 0;

            var calculateMilliseconds = function () {
                if (countDirectionIs(COUNT_DIRECTION.DOWN)) {
                    millisecondsForContinuePoint = totalMillisecondsToGo - (new Date().getTime() - countStartDate.getTime());
                }
                else if (countDirectionIs(COUNT_DIRECTION.UP)) {
                    millisecondsForContinuePoint = (new Date().getTime() + timeToAddWhenResumed) - countStartDate.getTime();
                }

                // update the result and forward it to the users callback as a countResult object
                that.countResult.update(millisecondsForContinuePoint);
                callback(that.countResult);

                // need to check if the counter is done with counting
                checkIfCounterFinished(millisecondsForContinuePoint, getTotalMillisecondsFromObject(that.options), callback);
            };

            return setInterval(calculateMilliseconds, that.options.updateIntervalInMilliseconds);
        }

        /**
         * @private
         */
        function countDirectionIs(countDirection) {
            return that.options.direction === countDirection;
        }

        /**
         * Before the interval starts counting, the result should be forwarded to the callback with its initial value
         * @param totalMillisecondsToGo
         * @param callback
         */
        function updateCounterBeforeIntervalStart(totalMillisecondsToGo, callback) {
            if (countDirectionIs(COUNT_DIRECTION.DOWN)) {
                that.countResult.update(totalMillisecondsToGo);
            }
            //when counting up
            else if (countDirectionIs(COUNT_DIRECTION.UP)) {
                that.countResult.update(0);
            }

            callback(that.countResult);
        }


        function checkIfCounterFinished(millisecondsProceeded, totalMillisecondsToGo, callback) {
            if (countDirectionIs(COUNT_DIRECTION.UP)) {
                if (millisecondsProceeded >= totalMillisecondsToGo) {
                    that.countResult.countNotifier.fireNotificationEvent(that.countResult.countNotifier.EVENT.ON_FINISH, millisecondsProceeded);
                    clearIntervalFromCountree();
                }
            }
            else if (countDirectionIs(COUNT_DIRECTION.DOWN)) {
                if (millisecondsProceeded <= 0) {
                    that.countResult.update(0);
//                callback(that.countResult);
                    that.countResult.countNotifier.fireNotificationEvent(that.countResult.countNotifier.EVENT.ON_FINISH, millisecondsProceeded);
                    clearIntervalFromCountree();
                }
            }
        }

        function clearIntervalFromCountree() {
            clearInterval(intervalRef);
        }


        function start(callback) {
            var millisecondsAtStart = countDirectionIs(COUNT_DIRECTION.DOWN) ? getTotalMillisecondsFromObject(that.options) : 0;

            //remember the users callback to be able to continue the counter without providing the callback again later (on resume())
            intervalCallbackRef = callback;

            // clear the interval if there is one (so that a "clean restart" is possible)
            if (intervalRef) {
                clearInterval(intervalRef);
            }


            // start the counter and remember the intervalId as reference for later (e.g. for restarting or suspending)
            intervalRef = onCountingInterval(intervalCallbackRef, new Date(), getTotalMillisecondsFromObject(that.options), false);
            that.countResult.countNotifier.resetNotifier();

            that.countResult.countNotifier.fireNotificationEvent(that.countResult.countNotifier.EVENT.ON_START, millisecondsAtStart);
            that.isCounting = true;
        }

        function suspend() {
            // clear the interval as it stops the further counting
            clearIntervalFromCountree();
            if(that.isCounting){
                that.countResult.countNotifier.fireNotificationEvent(that.countResult.countNotifier.EVENT.ON_SUSPEND, millisecondsForContinuePoint);
            }
            that.isCounting = false;
        }

        function resume() {
            // only continue counting if the counter isn't already active and the users callback is available
            if (!that.isCounting && intervalCallbackRef) {
                intervalRef = onCountingInterval(intervalCallbackRef, new Date(), millisecondsForContinuePoint, true);
                that.countResult.countNotifier.fireNotificationEvent(that.countResult.countNotifier.EVENT.ON_RESUME, millisecondsForContinuePoint);
                that.isCounting = true;
            }
        }

        function notifyAt(notifyConfig, callback) {
            that.countResult.countNotifier.addNotifier(notifyConfig, callback, that.options.direction);
        }


        this.start = start;
        this.suspend = suspend;
        this.resume = resume;
        this.notifyAt = notifyAt;
    }

    /**
     *
     * @constructor
     */
    function CountResult(countreeRef, millisecondsStartingPoint) {
        var that = this;
        var overallMillisecondsLeft = 0;

        this.countNotifier = new CountNotifier(countreeRef, this.millisecondsStartingPoint);


        function update(milliseconds) {
            overallMillisecondsLeft = milliseconds;
            //every time the milliseconds are updated, we need to check if there is a notifier that listens to that
            that.countNotifier.notifyIfNecessary(milliseconds);
            return overallMillisecondsLeft;
        }

        /**
         * @return a {@link TimeMeasurement} representing the passed time for this Countree
         */
        function getPassedTime() {
            return new TimeMeasurement(overallMillisecondsLeft);
        }

        function getMillisecondsLeft() {
          return overallMillisecondsLeft;
        }


        this.update = update;
        this.getMillisecondsLeft = getMillisecondsLeft;
        this.getPassedTime = getPassedTime;
    }

    function CountNotifier(countreeRef, millisecondsStartingPoint) {
        var that = this;
        var notifyAtTimeArray = [];
        var notifyAtEventArray = [];

        this.millisecondsStartingPoint = millisecondsStartingPoint;
        this.countreeReference = countreeRef;

        var WHEN = {
            BEFORE_END: 'beforeEnd',
            AFTER_START: 'afterStart'
        };

        this.EVENT = {
            ON_START: 'onStart',
            ON_FINISH: 'onFinish',
            ON_RESUME: 'onResume',
            ON_SUSPEND: 'onSuspend'
        };

        /**
         * Add a notifier to the CountResult which will invoke the callback when the millisecondsToNotify are reached while counting (notifier will be added to the notifyAtArray property).
         * @param notifyConfig the config which the milliseconds are calculated from (used to get the time at which the
         * callback should be triggered)
         * @param callback triggered when the millisecondsToNotify are reached when counting
         * @param countingDirection the direction the counter is currently counting ('down' or 'up')
         */
        function addNotifier(notifyConfig, callback, countingDirection) {
            if (notifyConfig.event) {
                notifyAtEventArray.push({
                    event: notifyConfig.event,
                    callback: callback,
                    countingDirection: countingDirection
                });
            }
            else {
                notifyAtTimeArray.push({
                    millisecondsToNotify: getTotalMillisecondsFromObject(notifyConfig),
                    when: notifyConfig.when || WHEN.BEFORE_END,
                    callback: callback,
                    alreadyFired: false,
                    countingDirection: countingDirection
                });
            }
        }

        /**
         * Resets the notifier so that it is able to fire again when needed.
         */
        function resetNotifier() {
            for (var i = 0; i < notifyAtTimeArray.length; ++i) {
                notifyAtTimeArray[i].alreadyFired = false;
            }
            for (var k = 0; k < notifyAtTimeArray.length; ++k) {
                notifyAtTimeArray[k].alreadyFired = false;
            }
        }

        function notifyIfNecessary(milliseconds) {
            var notifyTmp = {};
            var needToNotifyWhenCountingDownBeforeEnd = false;
            var needToNotifyWhenCountingDownAfterStart = false;
            var needToNotifyWhenCountingUpBeforeEnd = false;
            var needToNotifyWhenCountingUpAfterStart = false;


            // loop through all time notifications
            for (var i = 0; i < notifyAtTimeArray.length; ++i) {
                notifyTmp = notifyAtTimeArray[i];
                needToNotifyWhenCountingDownBeforeEnd = (!notifyTmp.alreadyFired &&
                    notifyTmp.countingDirection === COUNT_DIRECTION.DOWN &&
                    notifyTmp.when === WHEN.BEFORE_END &&
                    notifyTmp.millisecondsToNotify >= milliseconds);

                needToNotifyWhenCountingDownAfterStart = (!notifyTmp.alreadyFired &&
                    notifyTmp.countingDirection === COUNT_DIRECTION.DOWN &&
                    notifyTmp.when === WHEN.AFTER_START &&
                    that.millisecondsStartingPoint - notifyTmp.millisecondsToNotify >= milliseconds);

                needToNotifyWhenCountingUpBeforeEnd = (!notifyTmp.alreadyFired &&
                    notifyTmp.countingDirection === COUNT_DIRECTION.UP &&
                    notifyTmp.when === WHEN.BEFORE_END &&
                    that.millisecondsStartingPoint - notifyTmp.millisecondsToNotify <= milliseconds);

                needToNotifyWhenCountingUpAfterStart = (!notifyTmp.alreadyFired &&
                    notifyTmp.countingDirection === COUNT_DIRECTION.UP &&
                    notifyTmp.when === WHEN.AFTER_START &&
                    notifyTmp.millisecondsToNotify <= milliseconds);

                if (needToNotifyWhenCountingDownBeforeEnd || needToNotifyWhenCountingDownAfterStart ||
                    needToNotifyWhenCountingUpBeforeEnd || needToNotifyWhenCountingUpAfterStart) {
                    notifyTmp.alreadyFired = true;
                    notifyTmp.callback(that.countreeReference, milliseconds);
                }
            }
        }

        /**
         * Fire events and invoke the callbacks if there are any registered.
         * @param event the fired event name
         * @param milliseconds the milliseconds at the counting time at which the event has been fired
         */
        function fireNotificationEvent(event, milliseconds) {
            for (var i = 0; i < notifyAtEventArray.length; ++i) {
                if (notifyAtEventArray[i].event === event) {
                    notifyAtEventArray[i].callback(that.countreeReference, milliseconds);
                }
            }
        }


        this.addNotifier = addNotifier;
        this.resetNotifier = resetNotifier;
        this.notifyIfNecessary = notifyIfNecessary;
        this.fireNotificationEvent = fireNotificationEvent;
    }

    /**
     * A time measurement with "millisecond precision".
     *
     * @param passedMilliseconds a non-zero integer representing the passed time, measured in passedMilliseconds
     * @constructor
     */
    function TimeMeasurement(passedMilliseconds) {
        /**
         * Extracts the "digit of the measured time": For instance, if 6033 passedMilliseconds
         * passed, '6' would be the return value for TIME_UNIT.SECONDS.
         *
         * @param timeUnit one of TIME_UNIT's value to convert the measured time to
         * @return digit of the TIME_UNIT of the the measured time
         */
        function getDigitForTimeUnit(timeUnit) {
            if (TIME_UNIT.MILLISECONDS === timeUnit) {
                return passedMilliseconds % 1000;
            } else if (TIME_UNIT.SECONDS === timeUnit) {
                return Math.floor(passedMilliseconds / 1000) % 60;
            } else if (TIME_UNIT.MINUTES === timeUnit) {
                return Math.floor(passedMilliseconds / 1000 / 60) % 60;
            } else if (TIME_UNIT.HOURS === timeUnit) {
                return Math.floor(passedMilliseconds / 1000 / 60 / 60) % 24;
            } else if (TIME_UNIT.DAYS === timeUnit) {
                return Math.floor(passedMilliseconds / 1000 / 60 / 60 / 24);
            }
            return 0;
        }

        /**
         * Works as 'getDigitForTimeUnit()' but converts result to String and fills
         * leading digits with '0's, if the resulting number is "to short".
         *
         * @param timeUnit one of TIME_UNIT's value to convert the measured time to
         * @param digitsToBeFilled number of leading digits that will be filled with '0', if the resulting number is "too short".
         * @return digit of the TIME_UNIT of the the measured time
         */
        function getDigitForTimeUnitLeftFilled(timeUnit, digitsToBeFilled) {
            return fillLeftZero(getDigitForTimeUnit(timeUnit), digitsToBeFilled || 2);
        }

        function toString() {
            var d = getDigitForTimeUnit(TIME_UNIT.DAYS);
            var h = getDigitForTimeUnit(TIME_UNIT.HOURS);
            var m = getDigitForTimeUnit(TIME_UNIT.MINUTES);
            var s = getDigitForTimeUnit(TIME_UNIT.SECONDS);
            var ms = getDigitForTimeUnit(TIME_UNIT.MILLISECONDS);
            var pastTimeFormatted = d + "d,  " + h + 'h:' + m + 'm ' + s + 's:' + ms + ' ms';
            return 'TimeMeasurement['+passedMilliseconds+' ms. passed = ' + pastTimeFormatted + ']';
        }

        this.getDigitForTimeUnit = getDigitForTimeUnit;
        this.getDigitForTimeUnitLeftFilled = getDigitForTimeUnitLeftFilled;
        this.toString = toString;
    }



    /************************************
     Helpers
     ************************************/

    function extendObjectBy(a, b) {
        for (var i in b) {
            if (b.hasOwnProperty(i)) {
                a[i] = b[i];
            }
        }
        return a;
    }

    function fillLeftZero(target, targetLength) {
        var result = '' + target;

        while (result.length < targetLength) {
            result = '0' + result;
        }
        return result;
    }


    function getTotalMillisecondsFromObject(object) {

        return object.milliseconds || 0 +
            ((object.seconds || 0) * 1e3) + // 1000
            ((object.minutes || 0) * 6e4) + // 1000 * 60
            ((object.hours || 0) * 36e5) + // 1000 * 60 * 60
            ((object.days || 0) * 864e5);  // 1000 * 60 * 60 * 24
    }


    /************************************
     Exports
     ************************************/

    exports.Countree = Countree;
    exports.CountResult = CountResult;
    exports.TimeMeasurement = TimeMeasurement;
    exports.TIME_UNIT = TIME_UNIT;

}(typeof exports === 'object' && exports || window));