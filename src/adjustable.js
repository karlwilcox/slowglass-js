

export class Adjustable {
    constructor(inValue, minValue, maxValue, wrap) {
        if (arguments.length < 4) {
            wrap = false;
        }
        // values and limits
        this.currentValue = inValue;
        this.targetValue = inValue;
        this.deltaValue = 0;
        if (arguments.length >= 3) {
            this.lowerLimit = minValue;
            this.upperLimit = maxValue;
        } else {
            this.lowerLimit = Number.MIN_SAFE_INTEGER;
            this.upperLimit = Number.MAX_SAFE_INTEGER;
        }
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
        this.positionCallback = null;
        this.accelerateCallback = null;
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

    sway_stop() {
        this.swayLimit = 0;
        this.swayStep = 0;
        this.swayRate = 0;
        this.swayChance = 0;
    }

    sway_start(limit, rate, chance) {
        this.swayLimit = limit;
        this.swayRate = rate * 1000; // convert to milliseconds
        this.swayChance = chance;
        this.swayStep = 0;
        this.swayUp = true;
        this.lastSway = Date.now();
    }

    stop() {
        if (typeof this.positionCallback === "function") {
            this.positionCallback("stop");
        }
        if (typeof this.accelerationCallback === "function") {
            this.accelerationCallback("stop");
        }
        this.deltaValue = 0;
        this.changing = false;
    }

    set_speed(delta) {
        if (Math.abs(delta) > 0) {
            this.deltaValue = delta;
            this.changing = true;
        }
    }

    accelerate(rate, seconds, timestamp, callback) {
        if (arguments.length == 1) {
            seconds = 0;
        }
        if (arguments.length == 2) {
            timestamp = Date.now();
        }
        if (arguments.length > 3) {
            this.accelerationCallback = callback;
        }
        this.accelerationRate = rate;
    }

    // adjust(delta) {
    //     let newValue = this.value + delta;
    //     // but check limits
    //     if ( newValue < this.lowerLimit ) {
    //         newValue = this.wrap ? this.upperLimit : this.lowerLimit;
    //     } else if ( newValue > this.upperLimit ) {
    //         newValue = this.wrap ? this.lowerLimit : this.upperLimit;
    //     }
    //     this.value = this.newValue;
    // }

    // Some things need to be kept in step (e.g. size and scale) without triggering
    // an update, so do it here.
    forceValue(value) {
        this.value = value;
        this.deltaValue = 0;
        this.changing = false;
    }

    setTargetValue(target, seconds, timestamp, callback) {
        if (arguments.length == 1) {
            seconds = 0;
        }
        if (arguments.length == 2) {
            timestamp = Date.now();
        }
        if (arguments.length > 3) {
            this.positionCallback = callback;
        }
        if (target < this.lowerLimit) {
            target = this.lowerLimit;
        } else if (target > this.upperLimit) {
            target = this.upperLimit;
        }
        this.targetValue = target;
        if (seconds == 0) {
            this.currentValue = target;
            this.deltaValue = 0;
            if ( this.callback != null ) {
                this.positionCallback("adjustable");
            }
        } else {
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
        if (((this.deltaValue < 0) && (this.currentValue < this.targetValue)) // undershot
            || ((this.deltaValue > 0) && (this.currentValue > this.targetValue)) // overshot
            || (Math.abs(this.currentValue - this.targetValue) < this.deltaValue)) { // almost there
            this.currentValue = this.targetValue;
            this.deltaValue = 0;
            this.changing = false;
            if (this.callback != null) {
                this.positionCallback("adjustable");
            }
        } else {
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
