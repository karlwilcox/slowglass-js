

export class Adjustable {
    constructor(inValue, minValue = Number.MIN_SAFE_INTEGER, maxValue = Number.MAX_SAFE_INTEGER, wrap = true) {
        if (arguments.length < 4) {
            wrap = false;
        }
        // values and limits
        this.currentValue = inValue;
        this.targetValue = inValue;
        this.hasTarget = false;
        this.deltaValue = 0;
        this.lowerLimit = minValue;
        this.upperLimit = maxValue;
        // status
        this.lastAdjustment = 0;
        this.changing = false;
        this.wrap = wrap;
        // Jiggling
        this.jigStep = 0;
        this.jigLimit = 0;
        this.jigChance = 0;
        // Accelerating
        this.accelerationRate = 0;
        this.accelerationTime = 0;
        // Callbacks
        this.positionCallback = false;
        this.accelerateCallback = false;
        // Swaying
        this.swayLimit = 0;
        this.swayStep = 0;
        this.swayRate = 0;
        this.swayUp = false;
        this.swayChance = 0;
        this.lastSway = 0;
    }

    value() {
        return this.currentValue + this.jigStep + this.swayStep;
    }

    speed() {
        return this.deltaValue;
    }

    swayStop() {
        this.swayLimit = 0;
        this.swayStep = 0;
        this.swayRate = 0;
        this.swayChance = 0;
    }

    swayStart(limit, rate, chance) {
        this.swayLimit = limit;
        this.swayRate = rate * 1000; // convert to milliseconds
        this.swayChance = chance;
        this.swayStep = 0;
        this.swayUp = true;
        this.lastSway = Date.now();
    }

    stop() {
        if (typeof this.positionCallback === "function") {
            this.positionCallback(-1);
        }
        if (typeof this.accelerationCallback === "function") {
            this.accelerationCallback("stop");
        }
        this.deltaValue = 0;
        this.accelerationRate = 0;
        this.changing = false;
    }

    setSpeed(delta) {
        this.deltaValue = delta / 1000; // We work in millis here
        if (!this.changing) {
            this.changing = Math.abs(delta) > 0;
        }
    }

    setAcceleration(rate, seconds = 0, callback = false) {
        this.accelerationRate = rate / 1000; // We work in millis here
        if (seconds > 0) {
            this.accelerationTime = seconds * 1000;
            if (callback) {
                callback(2);
                this.accelerateCallback = callback;
            }
        } else {
            this.accelerationTime = false;
        }
        if (!this.changing) {
            this.changing = Math.abs(rate) > 0;
        }
    }

    adjustDelta(newDelta) {
        this.deltaValue += newDelta;
    }

    // Some things need to be kept in step (e.g. size and scale) without triggering
    // an update, so do it here.
    forceValue(value) {
        this.currentValue = value;
        this.targettValue = value;
        this.deltaValue = 0;
        this.changing = false;
    }
     tweak(value) {
        this.currentValue += value;
        this.changing = true;
     }

    setTargetValue(target, seconds = 0, timestamp = null, callback = false) {
        if (timestamp == null) {
            timestamp = Date.now();
        }
        this.positionCallback = callback;
        if (target < this.lowerLimit) {
            target = this.lowerLimit;
        } else if (target > this.upperLimit) {
            target = this.upperLimit;
        }
        this.targetValue = target;
        if (seconds == 0) {
            this.currentValue = target;
            this.deltaValue = 0;
            this.hasTarget = false;
            if (this.positionCallback) {
                this.positionCallback(-1);
                this.positionCallback = false;
            }
        } else {
            this.hasTarget = true;
            this.deltaValue = (this.targetValue - this.currentValue) / (seconds * 1000);
            this.lastAdjustment = timestamp;
        }
        this.changing = true;
    }

    updateValue() {
        let updated = false;
        let thisAdjustment = Date.now();
        // Are we jiggly?
        if (this.jigLimit > 0 && this.jigChance > 0) {
            if (Math.random() * 100 < this.jigChance ) { // lets jiggle
                updated = true;
                this.jigStep += (this.jigLimit / 4) - (Math.random() * (this.jigLimit / 2));
                if (this.jigStep > this.jigLimit) {
                    this.jigStep = this.jigLimit;
                } else if (this.jigStep < (this.jigLimit * -1)) {
                    this.jigStep = this.jigLimit * -1;
                }
            }
        }
        // Are we swaying?
        if (this.swayLimit > 0) {
            if (Math.random() * 100 < this.swayChance ) { // lets sway
                // this should probably be sine wave rather than a sawtooth...?
                let step = (this.swayLimit / this.swayRate) * (thisAdjustment - this.lastSway);
                if (this.swayUp) {
                    this.swayStep += step;
                    if (this.swayStep > this.swayLimit) {
                        this.swayStep = this.swayLimit;
                        this.swayUp = false;
                    }
                } else { // swaying down
                    this.swayStep -= step;
                    if (this.swayStep < this.swayLimit * -1) {
                        this.swayStep = this.swayLimit * -1;
                        this.swayUp = true;
                    }
                }
                this.lastSway = thisAdjustment;
                updated = true;
            }
        }
        // Are we still changing?
        if (!this.changing) {
            return updated;
        }
        // Are we there yet?
        if (this.hasTarget && (((this.deltaValue < 0) && (this.currentValue < this.targetValue)) // undershot
            || ((this.deltaValue > 0) && (this.currentValue > this.targetValue)) // overshot
            || (Math.abs(this.currentValue - this.targetValue) <= this.deltaValue))) { // almost there
            this.currentValue = this.targetValue;
            this.deltaValue = 0;
            this.changing = false;
            if (this.positionCallback) {
                this.positionCallback(-1);
                this.positionCallback = false;
            }
        } else {
            // Accelerate!
            if (this.accelerationRate != 0) {
                this.deltaValue += this.accelerationRate / (thisAdjustment - this.lastAdjustment);
            }
            if (this.accelerationTime !== false) {
                this.accelerationTime -= (thisAdjustment - this.lastAdjustment);
                if (this.accelerationTime <= 0) {
                    if (this.accelerateCallback) {
                        this.accelerateCallback(-1);
                    }
                    this.accelerationTime = false;
                    this.accelerationRate = 0;
                }
            }
            this.currentValue += this.deltaValue * (thisAdjustment - this.lastAdjustment);
            this.lastAdjustment = thisAdjustment;
        }
        return true;
    }

    jiggle_stop() {
        this.jigStep = 0;
        this.jigLimit = 0;
        this.jigChance = 0;
    }

    jiggle_start(limit, chance) {
        this.jigLimit = limit;
        this.jigChance = chance;
    }

}
