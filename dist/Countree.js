/*
 * Countree
 * https://github.com/SaschaKrause/Countree.js
 *
 * Copyright (c) 2013 Sascha Krause
 * Licensed under the MIT license.
 */

(function (exports) {
    /** @constant */
    var TIME_UNIT = {
        MILLISECONDS: 'ms',
        SECONDS: 's',
        MINUTES: 'm',
        HOURS: 'h',
        DAYS: 'd'
    };

    var COUNTER_STATE = {
        COUNTING: 'counting',
        SUSPENDED: 'suspended',
        NOT_STARTED: 'not started'
    };

    var ERROR_MESSAGES = {
        ERR_01_OPTIONS_NOT_SET: "COUNTREE-ERR-01: Please provide some counter options. You can add them directly add instantiation (e.g. new Countree({})) or after that via countree.setOptions({}). Just make sure that there are options provided before starting the Countree.",
        ERR_02_OPTIONS_COUNT_TYPE_WRONG: "COUNTREE-ERR-02: You need to provide one of the following object inside your Countree option configuration: 'customTime:{}' OR 'dateTime:{}'",
        ERR_03_OPTIONS_CUSTOM_COUNT_DIRECTION_UNKNOWN: "COUNTREE-ERR-03: You need to specify an 'direction' (with 'up' or 'down') or provide an object to the 'stopAt' property",
        ERR_04_OPTIONS_CALLBACK_NOT_PROVIDED: "COUNTREE-ERR-04: No 'onInterval'-callback defined in countree options. This callback is necessary as it will be invoked on counting updates at each interval"
    };


    /**
     *
     * @param paramOptions
     * @constructor
     */
    function Countree(paramOptions) {

        var that = this;

        this.version = '0.0.1';

        /**
         * these properties got filled after the users options are evaluated and have always the
         * @type {Object}
         */
        var internalCounterProperties = {
            /**
             *
             */
            nowAsDate: null,
            /**
             *  This should be true after the users options has been set.
             */
            userOptionsProvided: false,
            /**
             *
             */
            startCounterFromMilliseconds: null,
            /**
             *
             */
            stopCounterAtMilliseconds: null,
            /**
             *
             */
            alreadyPassedMilliseconds: -1,
            /**
             *
             */
            isFinished: false,
            /**
             * The interval reference is used to identify the active interval, so that it could be cleared (e.g. for suspending or restarting).
             * A counter can only have one interval reference (because a single counter can only create a single interval).
             */
            countingIntervalReference: null,
            /**
             *
             */
            onIntervalCallbackFromUser: null,
            /**
             *
             */
            countDirection: 'up',
            /**
             *
             */
            countToDate: null
        };

        // fill options with some basic defaults
        var options = {
            updateIntervalInMilliseconds: 1000,
            name: 'untitled',
            stopWhenFinished: false
        };

        var internalPropertiesHelper = new InternalPropertiesHelper(options, internalCounterProperties);

        this.state = COUNTER_STATE.NOT_STARTED;

        this.setOptions = function setOptions(paramOptions) {
            // Update and extend the default options with the user config options
            extendObjectBy(options, paramOptions);
        };

        this.setIntervalCallback = function setIntervalCallback(onInterval) {
            options.onInterval = onInterval;
        };

//      update and extend the default options with the user config options (if provided via constructor)
        paramOptions && this.setOptions(paramOptions);


        // this countResult instance contain all information about the current counter values (e.g. milliseconds left/to go).
        // This result will be provided as parameter to the users interval callback (which is invoked at each interval tick).
        var countResult = new CountResult(this, internalCounterProperties);

        /**
         * Init the countree by calling the user's onInterval-callback ONCE without starting the counter.
         * This is great for updating the view with the calculated starting milliseconds.
         */
        this.init = function init() {
            internalPropertiesHelper.updateInternalCountPropertiesFromOptions(that);
            checkIfOptionsHasBeenSet();
            countResult.init();
            internalCounterProperties.onIntervalCallbackFromUser(countResult);
            internalCounterProperties.alreadyPassedMilliseconds = 0;
            countResult.countNotifier.fireNotificationEvent(countResult.countNotifier.EVENT.ON_INIT);
        };

        /**
         * Kick of the counting interval. Every "interval-tick" the onInterval callback (provided via options) is invoked
         * and the newly calculated countResult is provided as parameter.
         */
        this.start = function start() {
            // clear the interval (so that ONLY ONE COUNTING INTERVAL is present at a time - even if this method is invoked more than once)
            clearCountingInterval();
            countResult.countNotifier.fireNotificationEvent(countResult.countNotifier.EVENT.ON_START);
            this.init();
            internalCounterProperties.isFinished = false;
            countWithInterval(new Date(), false);
        };

        /**
         * Suspend this counter by clearing the counting interval.
         */
        this.suspend = function suspend() {
            clearCountingInterval();
            countResult.countNotifier.fireNotificationEvent(countResult.countNotifier.EVENT.ON_SUSPEND);
        };

        /**
         * Resume this counter. This will only have an effect when the counter has been initialized AND the counter is
         * currently not counting.
         */
        this.resume = function resume() {
            if (!internalCounterProperties.countingIntervalReference) {
                countResult.countNotifier.fireNotificationEvent(countResult.countNotifier.EVENT.ON_RESUME);
                countWithInterval(new Date(), true);
            }
        };


        this.notifyAt = function notifyAt(notifyConfig, callback) {
            countResult.countNotifier.addNotifier(notifyConfig, callback);
        };

        function checkIfOptionsHasBeenSet() {
            if (!internalCounterProperties.userOptionsProvided) {
                console.error(ERROR_MESSAGES.ERR_01_OPTIONS_NOT_SET);
            }
        }

        function clearCountingInterval() {
            clearInterval(internalCounterProperties.countingIntervalReference);
            // indicate that no interval is available anymore.
            internalCounterProperties.countingIntervalReference = null;
        }

        function countWithInterval(countStartDate, resumed) {

            // if the counter has been resumed, we need to add a time offset to the alreadyPassedMilliseconds
            var timeToAddWhenResumed = resumed ? internalCounterProperties.alreadyPassedMilliseconds : 0;

            /**
             * invoked at each interval tick.
             */
            function proceedInterval() {
                var now = new Date();
                // update the passed milliseconds. These will only be used to calculate the countResult when counting from the "customTime" option
                internalCounterProperties.alreadyPassedMilliseconds = (now.getTime() - countStartDate.getTime()) + timeToAddWhenResumed;
                // the nowAsDate property will only be used to calculate the countResult when counting towards the "dateTime" option
                internalCounterProperties.nowAsDate = now;
                // recalculate the countResult based on the updated internalCountProperties
                countResult.update();
                // lets invoke the users callback and provide the countResult as parameter
                internalCounterProperties.onIntervalCallbackFromUser(countResult);
                // check if counter finished. If so - clear the counting interval.
                if (internalCounterProperties.isFinished) {
                    clearCountingInterval();
                    countResult.countNotifier.fireNotificationEvent(countResult.countNotifier.EVENT.ON_FINISH);
                }
            }

            // kick of the interval
            internalCounterProperties.countingIntervalReference = setInterval(proceedInterval, options.updateIntervalInMilliseconds);
        }

    }


    /**
     *
     * @constructor
     */
    function CountResult(countreeRef, internalPropertiesRef) {
        var formattedTimeTmp = new FormattedTime();
        var that = this;
        this.calculatedMilliseconds = 0;
        this.countNotifier = new CountNotifier(countreeRef, internalPropertiesRef);

        /**
         *
         */
        this.init = function init() {
            this.calculatedMilliseconds = internalPropertiesRef.startCounterFromMilliseconds;
            formattedTimeTmp.update(this.calculatedMilliseconds);
        };

        /**
         *
         */
        this.update = function update() {
            this.calculatedMilliseconds = calculateResultAndUpdateInternalProperties(internalPropertiesRef.countDirection);
            formattedTimeTmp.update(this.calculatedMilliseconds);
        };

        /**
         *
         * @returns {FormattedTime}
         */
        this.formattedTime = function formattedTime() {
            return formattedTimeTmp;
        };


        function calculateResultAndUpdateInternalProperties(direction) {
            var result = 0;
            var counterShouldStop = internalPropertiesRef.stopWhenFinished && internalPropertiesRef.stopCounterAtMilliseconds != null;

            // when counting up (and only when the startCounterFromMilliseconds property is set - which is the case when the "customTime" option is provided)
            if (direction === 'up' && internalPropertiesRef.startCounterFromMilliseconds != null) {
                result = internalPropertiesRef.startCounterFromMilliseconds + internalPropertiesRef.alreadyPassedMilliseconds;

                // check if counter should be stopped
                if (counterShouldStop && result >= internalPropertiesRef.stopCounterAtMilliseconds) {
                    internalPropertiesRef.isFinished = true;
                    result = internalPropertiesRef.stopCounterAtMilliseconds;
                }
            }
            // when counting down (and only when the startCounterFromMilliseconds property is set - which is the case when the "customTime" option is provided)
            else if (direction === 'down' && internalPropertiesRef.startCounterFromMilliseconds != null) {
                result = internalPropertiesRef.startCounterFromMilliseconds - internalPropertiesRef.alreadyPassedMilliseconds;

                // check if counter should be stopped
                if (counterShouldStop && result <= internalPropertiesRef.stopCounterAtMilliseconds) {
                    internalPropertiesRef.isFinished = true;
                    result = internalPropertiesRef.stopCounterAtMilliseconds;
                }
            }
            // when counting towards a given date
            else if (internalPropertiesRef.countToDate) {
                var now = internalPropertiesRef.nowAsDate.getTime();
                var countTo = internalPropertiesRef.countToDate.getTime();

                // if now is "after" the date to count to
                if (now > countTo) {
                    result = now - countTo;
                }
                else {
                    result = countTo - now;
                }
            }
            return result;
        }
    }

    function CountNotifier(countreeRef, millisecondsStartingPoint) {
        var notifyAtTimeArray = [];
        var notifyAtEventArray = [];

        this.millisecondsStartingPoint = millisecondsStartingPoint;
        this.countreeReference = countreeRef;

        var WHEN = {
            BEFORE_END: 'beforeEnd',
            AFTER_START: 'afterStart'
        };

        this.EVENT = {
            ON_INIT: 'onInit',
            ON_START: 'onStart',
            ON_FINISH: 'onFinish',
            ON_RESUME: 'onResume',
            ON_SUSPEND: 'onSuspend',
            ON_RESET: 'onReset'
        };


        /**
         * Add a notifier to the CountResult which will invoke the callback when the millisecondsToNotify are reached while counting (notifier will be added to the notifyAtArray property).
         * @param notifyConfig the config which the milliseconds are calculated from (used to get the time at which the
         * callback should be triggered)
         * @param callback triggered when the millisecondsToNotify are reached when counting
         */
        this.addNotifier = function addNotifier(notifyConfig, callback) {

            if (notifyConfig.event) {
                notifyAtEventArray.push({
                    event: notifyConfig.event,
                    callback: callback
                });
            }
        };

        /**
         * Resets the notifier so that it is able to fire again when needed.
         */
        this.resetNotifier = function resetNotifier() {
            for (var i = 0; i < notifyAtEventArray.length; ++i) {
                notifyAtEventArray[i].alreadyFired = false;
            }
        };

        /**
         * Fire events and invoke the callbacks if there are any registered.
         * @param event the fired event name
         * @param milliseconds the milliseconds at the counting time at which the event has been fired
         */
        this.fireNotificationEvent = function fireNotificationEvent(event, milliseconds) {
            for (var i = 0; i < notifyAtEventArray.length; ++i) {
                if (notifyAtEventArray[i].event === event) {
                    notifyAtEventArray[i].callback(countreeRef, milliseconds);
                }
            }
        };
    }

    /**
     * This is a convenience class that wraps some often used time methods for quick access.
     * @constructor
     */
    function FormattedTime() {
        var millisecondsToConvert = 0;
        var timeHelper = new TimeHelper();

        function update(milliseconds) {
            millisecondsToConvert = milliseconds;
        }

        /**
         * Returns the Days out of the CountResult.
         * @param {Number} [digitsToBeFilled] number of leading digits that will be filled with '0', if the resulting
         * number is "too short". If not provided, a Number with the "plain" value is returned.
         * @return {Number|String} the days calculated from the provided milliseconds left/to go.
         */
        function getDays(digitsToBeFilled) {
            return timeHelper.getDigitFromMsForTimeUnit(millisecondsToConvert, TIME_UNIT.DAYS, digitsToBeFilled);
        }

        /**
         * Returns the hours out of the CountResult.
         * @param {Number} [digitsToBeFilled] number of leading digits that will be filled with '0', if the resulting
         * number is "too short". If not provided, a Number with the "plain" value is returned.
         * @return {Number|String} the hours calculated from the provided milliseconds left/to go.
         */
        function getHours(digitsToBeFilled) {
            return timeHelper.getDigitFromMsForTimeUnit(millisecondsToConvert, TIME_UNIT.HOURS, digitsToBeFilled);
        }

        /**
         * Returns the minutes out of the CountResult.
         * @param {Number} [digitsToBeFilled] number of leading digits that will be filled with '0', if the resulting
         * number is "too short". If not provided, a Number with the "plain" value is returned.
         * @return {Number|String} the minutes calculated from the provided milliseconds left/to go.
         */
        function getMinutes(digitsToBeFilled) {
            return timeHelper.getDigitFromMsForTimeUnit(millisecondsToConvert, TIME_UNIT.MINUTES, digitsToBeFilled);
        }

        /**
         * Returns the seconds out of the CountResult.
         * @param {Number} [digitsToBeFilled] number of leading digits that will be filled with '0', if the resulting
         * number is "too short". If not provided, a Number with the "plain" value is returned.
         * @return {Number|String} the seconds calculated from the provided milliseconds left/to go.
         */
        function getSeconds(digitsToBeFilled) {
            return timeHelper.getDigitFromMsForTimeUnit(millisecondsToConvert, TIME_UNIT.SECONDS, digitsToBeFilled);
        }

        /**
         * Returns the milliSeconds out of the CountResult.
         * @param {Number} [digitsToBeFilled] number of leading digits that will be filled with '0', if the resulting
         * number is "too short". If not provided, a Number with the "plain" value is returned.
         * @return {Number|String} the milliSeconds calculated from the provided milliseconds left/to go.
         */
        function getMilliSeconds(digitsToBeFilled) {
            return timeHelper.getDigitFromMsForTimeUnit(millisecondsToConvert, TIME_UNIT.MILLISECONDS, digitsToBeFilled);
        }

        function toString() {
            return getDays() + ", " + getHours(2) + ":" + getMinutes(2) + ":" + getSeconds(2) + ":" + getMilliSeconds(3);
        }

        this.update = update;
        this.getDays = getDays;
        this.getHours = getHours;
        this.getMinutes = getMinutes;
        this.getSeconds = getSeconds;
        this.getMilliSeconds = getMilliSeconds;
        this.toString = toString;
    }


    /**
     *
     * @param options
     * @param internalCountPropertiesRef
     * @constructor
     */
    function InternalPropertiesHelper(options, internalCountPropertiesRef) {


        this.updateInternalCountPropertiesFromOptions = function updateInternalCountPropertiesFromOptions(countreeRef) {

            countreeRef.name = options.name;

            // Check if there are missing options missing. If so, provide feedback to the user via console.error()
            checkOptionsAndThrowErrorLogMessagesIfNeeded();

            // The user provided some options, so lets set the corresponding value to the internalCountProperties
            internalCountPropertiesRef.userOptionsProvided = true;
            internalCountPropertiesRef.stopWhenFinished = !!options.stopWhenFinished;
            internalCountPropertiesRef.onIntervalCallbackFromUser = options.onInterval || function () {
            };

            // now that we have a options object, we need to fill some more internalCounterProperties
            // (because we will do all the calculations based on the internalCounterProperties instead on the options).
            fillInternalCounterPropertiesFromOptions();
        };

        /**
         * Throw some console.error() messages to the user's console if option-properties are not provided
         */
        function checkOptionsAndThrowErrorLogMessagesIfNeeded() {
            // if the onInterval callback is missing
            !options.onInterval && console.error(ERROR_MESSAGES.ERR_04_OPTIONS_CALLBACK_NOT_PROVIDED);
        }


        function fillInternalCounterPropertiesFromOptions() {

            var isCustomTime = !!options.customTime && !options.dateTime;
            var isDateTime = !!options.dateTime && !options.customTime;

            if (isCustomTime) {
                fillFromCustomTime(options.customTime);
            }
            // counting up to or down to a provided date
            else if (isDateTime) {
                fillFromDateTime(options.dateTime.date);
            }
            else {
                console.error(ERROR_MESSAGES.ERR_02_OPTIONS_COUNT_TYPE_WRONG);
            }
        }


        function fillFromCustomTime(customTime) {
            // set the startCounterFromMilliseconds at the internalCounterProperties. If nothing is provided from the users options, 0 milliseconds will be used as starting point
            internalCountPropertiesRef.startCounterFromMilliseconds = getTotalMillisecondsFromTimeObject(customTime.startFrom || {});

            // set the stopAtMilliseconds at the internalCounterProperties (if there user provided a stopAt object (which has do be not empty))
            if (customTime.stopAt && !isObjectEmpty(customTime.stopAt)) {
                internalCountPropertiesRef.stopCounterAtMilliseconds = getTotalMillisecondsFromTimeObject(customTime.stopAt);
                swapCountDirectionIfNeeded();
            }
        }

        function fillFromDateTime(dateTime) {
            console.log(dateTime);
            internalCountPropertiesRef.countToDate = dateTime;
        }

        function swapCountDirectionIfNeeded() {
            if (internalCountPropertiesRef.startCounterFromMilliseconds > internalCountPropertiesRef.stopCounterAtMilliseconds) {
                internalCountPropertiesRef.countDirection = 'down';
            }
        }
    }

    /**
     * A utility 'class' to extract information from a time value, specified in with milliseconds.
     *
     * Called 'TimeHelper' - instead of 'TimeUtil' - for better readability. Remember that we're going to
     * publish TIME_UNIT member at the end of this file!
     *
     * @constructor
     */
    function TimeHelper() {
        /**
         * Extracts the "digit of the measured time": For instance, if 6033 milliseconds were
         * passed, '6' would be the return value for TIME_UNIT.SECONDS and '33' the return
         * value for TIME_UNIT.MILLISECONDS.
         *
         * @param passedMilliseconds a non-zero integer representing the passed time, measured in passedMilliseconds
         * @param timeUnit one of TIME_UNIT's value to convert the measured time to
         * @param {Number} [digitsToBeFilled] number of leading digits that will be filled with '0', if the resulting number is "too short".
         * @return {Number|String} the result of the TIME_UNIT. Its a Number if no <code>digitsToBeFilled<code> is provided, otherwise a String is returned
         */
        function getDigitFromMsForTimeUnit(passedMilliseconds, timeUnit, digitsToBeFilled) {
            var result = 0;
            if (TIME_UNIT.MILLISECONDS === timeUnit) {
                result = passedMilliseconds % 1000;
            } else if (TIME_UNIT.SECONDS === timeUnit) {
                result = Math.floor(passedMilliseconds / 1000) % 60;
            } else if (TIME_UNIT.MINUTES === timeUnit) {
                result = Math.floor(passedMilliseconds / 1000 / 60) % 60;
            } else if (TIME_UNIT.HOURS === timeUnit) {
                result = Math.floor(passedMilliseconds / 1000 / 60 / 60) % 24;
            } else if (TIME_UNIT.DAYS === timeUnit) {
                result = Math.floor(passedMilliseconds / 1000 / 60 / 60 / 24);
            }

            return digitsToBeFilled === undefined ? result : fillLeftZero(result, digitsToBeFilled);
        }

        this.getDigitFromMsForTimeUnit = getDigitFromMsForTimeUnit;
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

    function isObjectEmpty(o) {
        for (var p in o) {
            if (o.hasOwnProperty(p)) {
                return false;
            }
        }
        return true;
    }

    function fillLeftZero(target, targetLength) {
        var result = '' + target;

        while (result.length < targetLength) {
            result = '0' + result;
        }
        return result;
    }

    function getTotalMillisecondsFromTimeObject(timeObject) {

        return timeObject.milliseconds || 0 +
            ((timeObject.seconds || 0) * 1e3) + // 1000
            ((timeObject.minutes || 0) * 6e4) + // 1000 * 60
            ((timeObject.hours || 0) * 36e5) + // 1000 * 60 * 60
            ((timeObject.days || 0) * 864e5);  // 1000 * 60 * 60 * 24
    }


    /************************************
     Exports
     ************************************/

    /*global define:false */
    if (typeof define === "function" && define.amd) {
        define([], function () {
            return Countree;
        });
    }
    else {
        exports.Countree = Countree;
    }

}(typeof exports === 'object' && exports || window));