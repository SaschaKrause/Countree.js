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
        ERR_03_OPTIONS_CUSTOM_COUNT_DIRECTION_UNKNOWN: "ERR-03: You need to specify an 'direction' (with 'up' or 'down') or provide an object to the 'stopAt' property"
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
             * The interval reference is used to identify the active interval, so that it could be cleared (e.g. for suspending or restarting).
             * A counter can only have one interval reference (because a single counter can only create a single interval).
             */
            countingIntervalReference: -1,
            /**
             *
             */
            countingCallbackFromUser: null
        };


        // fill options with some basic defaults
        this.options = {
            updateIntervalInMilliseconds: 1000,
            name: 'untitled'
        };

        this.state = COUNTER_STATE.NOT_STARTED;

//      update and extend the default options with the user config options (if provided)
        paramOptions && setOptions(paramOptions);

        function start(callback) {

            checkIfOptionsHasBeenSet();
            //remember the users callback to be able to continue the counter without providing the callback again later (on resume())
            internalCounterProperties.countingCallbackFromUser = callback;

        }

        function init() {

        }

        function setOptions(paramOptions) {
            internalCounterProperties.userOptionsProvided = true;
            // update and extend the default options with the user config options
            extendObjectBy(that.options, paramOptions);
            // now that we have a options object, we need to fill the internalCounterProperties
            // (because we will do all the calculations based on the internalCounterProperties rather than on the options).
            fillInternalCounterPropertiesFromOptions();
        }


        function fillInternalCounterPropertiesFromOptions() {

            var isCustomTimeCount = !!that.options.customTimeCount && !that.options.dateTimeCount;
            var isDateTimeCount = !!that.options.dateTimeCount && !that.options.customTimeCount;

            if (isCustomTimeCount) {
                fillInternalCounterPropertiesFromCustomTimeCount(that.options.customTimeCount);
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
            internalCounterProperties.startCounterFromMilliseconds = getTotalMillisecondsFromTimeObject(customTimeCount.startFrom || {});

            // set the stopAtMilliseconds at the internalCounterProperties (if there user provided a stopAt object (which is not empty))
            if(customTimeCount.stopAt && !isObjectEmpty(customTimeCount.stopAt)){
                internalCounterProperties.stopCounterAtMilliseconds = getTotalMillisecondsFromTimeObject(customTimeCount.stopAt);
            }
            else {
                if(!customTimeCount.direction) {
                    console.error(ERROR_MESSAGES.ERR_03_OPTIONS_CUSTOM_COUNT_DIRECTION_UNKNOWN);
                }
            }
        }

        function checkIfOptionsHasBeenSet() {
            if (!internalCounterProperties.userOptionsProvided) {
                console.error(ERROR_MESSAGES.ERR_01_OPTIONS_NOT_SET);
            }
        }

        this.start = start;
        this.setOptions = setOptions;
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

    function isObjectEmpty( o ) {
        for ( var p in o ) {
            if ( o.hasOwnProperty( p ) ) { return false; }
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