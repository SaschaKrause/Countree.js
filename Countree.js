/*
 * Countree
 * https://github.com/SaschaKrause/Countree
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
        ERR_01_OPTIONS_NOT_SET: "ERR-01: Please provide some counter options. You can add them directly add instantiation (e.g. new Countree({})) or after that via countree.setOptions({}). Just make sure that there are options provided before starting the Countree.",
        ERR_02_OPTIONS_COUNT_TYPE_WRONG: "ERR-02: You need to provide (exactly) one of the following object inside your Countree option configuration: 'customTimeCount:{}' OR 'dateTimeCount:{}'",
        ERR_03_OPTIONS_CUSTOM_COUNT_DIRECTION_UNKNOWN: "ERR-03: You need to specify an 'direction' (with 'up' or 'down') or provide an object to the 'stopAt' property",
        ERR_04_OPTIONS_CALLBACK_NOT_PROVIDED: "ERR-04: No 'onInterval'-callback defined in countree options. This callback is necessary as it will be invoked on counting updates at each interval"
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
         * The interval reference is used to identify the active interval, so that it could be cleared (e.g. for suspending
         * or restarting).
         * A counter can only have one interval reference (because a single counter can only create a single interval).
         * @type {Number}
         */

        /**
         * The milliseconds left/to go (depends if counting up or down) to count from/to when resuming the counter after
         * it is suspended.
         * @type {Number}
         */
        var millisecondsForContinuePoint = 0;

        /**
         *
         */
        var countingCallbackFromUser = {
            value: undefined,
            set: function (val) {
                this.value = val;
            },
            get: function () {
                return this.value;
            },
            invoke: function (param) {
                this.value(param);
            }

        };

        /**
         * these properties got filled after the users options are evaluated and have always the
         * @type {{startCounterFromMilliseconds: number, stopCounterAtMilliseconds: number, alreadyPastMilliseconds: number, countingIntervalReference: number}}
         */
        var internalCounterProperties = {
            /**
             *  This should be true after the users options has been set.
             */
            userOptionsProvided: false,
            /**
             *
             */
            startCounterFromMilliseconds: -1,
            /**
             *
             */
            stopCounterAtMilliseconds: -1,
            /**
             *
             */
            alreadyPastMilliseconds: -1,
            /**
             *
             */
            leftMilliseconds: -1,
            /**
             * The interval reference is used to identify the active interval, so that it could be cleared (e.g. for suspending or restarting).
             * A counter can only have one interval reference (because a single counter can only create a single interval).
             */
            countingIntervalReference: -1,
            /**
             *
             */
            onIntervalCallbackFromUser: null
        };

        var internalPropertiesHelper = new InternalPropertiesHelper(internalCounterProperties);


        this.state = COUNTER_STATE.NOT_STARTED;

//      update and extend the default options with the user config options (if provided)
        paramOptions && setOptions(paramOptions);


        // this countResult instance contain all information about the current counter values (e.g. milliseconds left/to go).
        // This result will be provided as parameter to the users interval callback
        var countResult = new CountResult(internalCounterProperties);

        /**
         * Init the countree by calling the user's onInterval-callback ONCE without starting the counter.
         * This is great for updating the view with the calculated starting milliseconds.
         */
        this.init = function init() {
            checkIfOptionsHasBeenSet();
            countResult.update();
            internalCounterProperties.onIntervalCallbackFromUser(countResult);
        };

        /**
         * Kick of the counting interval. Every "interval-tick" the onInterval callback (provided via options) is invoked
         * and the newly calculated countResult is provided as parameter.
         */
        this.start = function start() {
            checkIfOptionsHasBeenSet();
            countResult.update();
            internalCounterProperties.onIntervalCallbackFromUser(countResult);
        };


        this.setOptions = function setOptions(paramOptions) {
            internalPropertiesHelper.updateInternalCountPropertiesFromOptions(paramOptions);
        };


        function checkIfOptionsHasBeenSet() {
            if (!internalCounterProperties.userOptionsProvided) {
                console.error(ERROR_MESSAGES.ERR_01_OPTIONS_NOT_SET);
            }
        }
    }


    /**
     *
     * @constructor
     */
    function CountResult(internalCounterPropertiesRef) {
        var that = this;
        var formattedTimeTmp = new FormattedTime();

        function update() {
            overallMillisecondsLeft = milliseconds;
            formattedTimeTmp.update(milliseconds);
            return overallMillisecondsLeft;
        }

        function getMillisecondsLeft() {
            return overallMillisecondsLeft;
        }

        function formattedTime() {
            return formattedTimeTmp;
        }

        this.update = update;
        this.getMillisecondsLeft = getMillisecondsLeft;
        this.formattedTime = formattedTime;
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
     * @param internalCountPropertiesRef
     * @constructor
     */
    function InternalPropertiesHelper(internalCountPropertiesRef) {

        // fill options with some basic defaults
        var options = {
            updateIntervalInMilliseconds: 1000,
            name: 'untitled'
        };

        this.updateInternalCountPropertiesFromOptions = function updateInternalCountPropertiesWithOptions(optionsFromUser) {
            // Update and extend the default options with the user config options
            extendObjectBy(options, optionsFromUser);

            // Check if there are missing options missing. If so, provide feedback to the user via console.error()
            checkOptionsAndThrowErrorLogMessagesIfNeeded();

            // The user provided some options, so lets set the corresponding value to the internalCountProperties
            internalCountPropertiesRef.userOptionsProvided = true;
            internalCountPropertiesRef.onIntervalCallbackFromUser = optionsFromUser.onInterval || function(){};

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

            var isCustomTimeCount = !!options.customTimeCount && !options.dateTimeCount;
            var isDateTimeCount = !!options.dateTimeCount && !options.customTimeCount;

            if (isCustomTimeCount) {
                fillInternalCounterPropertiesFromCustomTimeCount(options.customTimeCount);
            }
            // counting up to or down to a provided date
            else if (isDateTimeCount) {
                console.log("date time");
            }
            else {
                console.error(ERROR_MESSAGES.ERR_02_OPTIONS_COUNT_TYPE_WRONG);
            }
        }


        function fillInternalCounterPropertiesFromCustomTimeCount(customTimeCount) {
            // set the startCounterFromMilliseconds at the internalCounterProperties. If nothing is provided from the users options, 0 milliseconds will be used as starting point
            internalCountPropertiesRef.startCounterFromMilliseconds = getTotalMillisecondsFromTimeObject(customTimeCount.startFrom || {});

            // set the stopAtMilliseconds at the internalCounterProperties (if there user provided a stopAt object (which is not empty))
            if (customTimeCount.stopAt && !isObjectEmpty(customTimeCount.stopAt)) {
                internalCountPropertiesRef.stopCounterAtMilliseconds = getTotalMillisecondsFromTimeObject(customTimeCount.stopAt);
            }
            else {
                if (!customTimeCount.direction) {
                    console.error(ERROR_MESSAGES.ERR_03_OPTIONS_CUSTOM_COUNT_DIRECTION_UNKNOWN);
                }
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