import { Globals } from "./globals.js";

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
            if (this.deltaValue != 0) {
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
            } else {
                this.changing = false;
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

export class Adjustable2 {
    constructor() {
        // Modifier stack
        this.modifiers = [];
        this.currentValue = 0;
    }

    addModifier(modifier) {
        this.modifiers.push(modifier);
    }

    removeModifier(id) {
        for (let i = 0; i < this.modifiers.length; i++) {
            if (this.modifiers[i].id == id) {
                this.modifiers.splice(i,1);
                break;
            }
        }
    }
}

class Modifier {
    constructor(now) {
        this.currentValue = 0;
        this.lastUpdate = Date.now();
        this.id = Globals.unique("mod");
        this.expired = false;
        this.startTime = now;
    }

    getValue() {
        return this.value;
    }

    setLast(now) {
        this.lastUpdate = now;
    }
}

export class Sawtooth extends Modifier {
    constructor(now, limit, period) {
        super(now);
        this.limit = limit;
        this.period = period;
    }

    update(now, current = false) {
        const delta = (this.limit * 2) * ((now - this.lastUpdate) / this.period);
        this.value += delta;
        if (this.value > this.limit) {
            this.value = this.limit * -1;
        }
        this.setLast(now);
        return true;
    }
}

export class TriangleWave extends Modifier {
    constructor(now, limit, period) {
        super(now);
        this.limit = limit;
        this.period = period;
        this.rising = true;
    }

    update(now, current = false) {
        const delta = (this.limit * 2) * ((now - this.lastUpdate) / (this.period / 2));
        if (this.rising) {
            this.value += delta;
            if (this.value >= this.limit) {
                this.value = this.limit;
                this.rising = false;
            }
        } else { // falling
            this.value -= delta;
            if (this.value <= this.limit * -1) {
                this.value = this.limit * -1;
                this.rising = true;
            }
        }
        this.setLast(now);
        return true;
    }
}

export class RandomWalk extends Modifier {
    constructor(now, limit, stepSize, frequency, chance = 100) {
        this.limit = limit;
        this.stepSize = stepSize;
        this.frequency = frequency;
        this.chance = chance;
        super(now);
    }

    update(now, current = false) {
        if ((now - this.lastUpdate) > this.frequency) {
            if ((chance < 100) && ((Math.random() * 100) > this.chance)) {
                this.setLast(now);
                return false;
            }
            const step = (this.stepSize * -1) + (Math.Random() * (this.stepSize * 2));
            this.value += step;
            if (this.value >= this.limit) {
                this.value = this.limit;
            } else if (this.value <= this.limit * -1) {
                this.value = this.limit * -1;
            }
        }
        this.setLast(now)
        return true;
    }
}

export class Linear extends Modifier {
    constructor(now, speed, target = false, duration = false, callback = false) {
        // speed is pixels per second, convert to millis
        this.speed = speed / 1000;
        this.target = target;
        // duration is seconds, convert to millis
        this.duration = 0 / 1000;
        this.callback = callback;
        super(now);
    }

    update(now, current = false) {
        if (this.expired) {
            return false;
        }
        let delta = (now - this.lastUpdate) * this.speed;
        if (current) {
            const newValue = current + delta;
            if (target) { // if we have the current value, check target
                if (this.speed < 0) {
                    if (newValue < this.target) {
                        delta = this.target - current;
                        this.expired = true;
                    }
                } else {
                    if (newValue > this.target) {
                        delta = current - this.target;
                        this.expired = true;
                    }
                }
            }
        }
        if ((this.startTime - now) > this.duration) {
            this.expired = true;
        }
        if (this.expired && this.callback) {
            this.callback();
        }
        this.value = delta;
        return true;
    }
}

export class Accel {
    constructor(now, rate, speed, target = false, duration = false, callback = false) {
        // rate is pixels per second per second, convert to millis
        this.rate = rate / 1000;
        this.speed = speed;
        this.target = target;
        // duration is seconds, convert to millis
        this.duration = 0 / 1000;
        this.callback = callback;
        super(now);
    }

    update(now, current = false) {
        if (this.expired) {
            return false;
        }
        const deltaSquared = (now - this.lastUpdate) * this.rate;
        if (current) {
            if (target) { // if we have the current value, check target
                if (this.speed < 0) {
                    if (this.speed < this.target) {
                        deltaSquared = this.target - this.speed;
                        this.expired = true;
                    }
                } else {
                    if (this.speed > this.target) {
                        deltaSquared = this.speed - this.target;
                        this.expired = true;
                    }
                }
            }
        }
        const delta = this.speed + deltaSquared;
        if ((this.startTime - now) > this.duration) {
            this.expired = true;
        }
        if (this.expired && this.callback) {
            this.callback();
        }
        this.value = delta;
        return true;
    }
}


