

export class Adjustable {
    constructor(inValue, minValue = Number.MIN_SAFE_INTEGER, maxValue = Number.MAX_SAFE_INTEGER, wrap = false) {
        // values and limits
        this.currentValue = inValue;
        this.targetValue = inValue;
        this.hasTarget = false;
        this.deltaValue = 0;
        this.lastDeltaAdjustment = 0;
        this.lowerLimit = minValue;
        this.upperLimit = maxValue;
        // status
        this.lastValueAdjustment = 0;
        this.changing = false;
        this.wrap = wrap;
        // Jiggling
        this.jigStep = 0;
        this.jigLimit = 0;
        this.jigChance = 0;
        // Accelerating
        this.accelerationRate = 0;
        this.accelerationTime = 0;
        this.lastAccelerationAdjustment = 0;
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
            this.accelerateCallback("stop");
        }
        this.deltaValue = 0;
        this.accelerationRate = 0;
        this.changing = false;
    }

    setSpeed(delta, timestamp = false) {
        this.deltaValue = delta / 1000; // We work in millis here
        if (!this.changing) {
            this.changing = Math.abs(delta) > 0;
        }
        if (timestamp) {
            this.lastDeltaAdjustment = timestamp;
        } else {
            this.lastDeltaAdjustment = Date.now();
        }
    }

    setAcceleration(rate, seconds = 0, timestamp = 0, callback = false) {
        this.accelerationRate = rate / 1000; // We work in millis here
        if (seconds > 0) {
            this.accelerationTime = seconds * 1000;
            if (callback) {
                callback(1);
                this.accelerateCallback = callback;
            }
        } else {
            this.accelerationTime = false;
        }
        if (!this.changing) {
            this.changing = Math.abs(rate) > 0;
        }
        if (timestamp) {
            this.lastAccelerationAdjustment = timestamp;
        } else {
            this.lastAccelerationAdjustment = Date.now();
        }
    }

    // Some things need to be kept in step (e.g. size and scale) without triggering
    // an update, so do it here.
    forceValue(value) {
        this.currentValue = value;
        this.targetValue = value;
        this.hasTarget = false;
        this.deltaValue = 0;
        this.changing = false;
    }

    tweak(value) {
        this.currentValue += value;
        this.changing = true;
    }

    setTargetValue(target, seconds = 0, timestamp = false, callback = false) {
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
        }
        if (timestamp) {
            this.lastValueAdjustment = timestamp;
        } else {
            this.lastValueAdjustment = Date.now();
        }
        this.changing = true; // rename this as this.valueUpdate TBD
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
                if (this.swayRate <= 0) {
                    this.swayRate = 1;
                }
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
                // Accleration rate is pixels per second, adjustments are measured in millis, so divide to match
                this.deltaValue += (this.accelerationRate / 1000) * (thisAdjustment - this.lastDeltaAdjustment);
            }
            if (this.accelerationTime !== false) {
                this.accelerationTime -= (thisAdjustment - this.lastAccelerationAdjustment);
                if (this.accelerationTime <= 0) {
                    if (this.accelerateCallback) {
                        this.accelerateCallback(-1);
                    }
                    this.accelerationTime = false;
                    this.accelerationRate = 0;
                }
            }
            this.currentValue += this.deltaValue * (thisAdjustment - this.lastValueAdjustment);
            // Clamp to given limits
            if (this.currentValue < this.lowerLimit) {
                if (this.wrap) {
                    this.currentValue = this.upperLimit;
                } else {
                    this.currentValue = this.lowerLimit;
                }
            } else if (this.currentValue > this.upperLimit) {
                if (this.wrap) {
                    this.currentValue = this.lowerLimit;
                } else {
                    this.currentValue = this.upperLimit;
                }
            }
        }
        this.lastValueAdjustment = thisAdjustment;
        this.lastDeltaAdjustment = thisAdjustment;
        this.lastAccelerationAdjustment = thisAdjustment;
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
