import { Globals } from "./globals.js";
import defaults from "./defaults.js";

class Modifier {
    constructor(now, callback = false) {
        this.value = 0;
        this.lastUpdate = now;
        this.expired = false;
        this.startTime = now;
        this.callback = callback;
    }

    getValue() {
        return this.value;
    }

    setLast(now) {
        this.lastUpdate = now;
    }

    stop() {
        if (this.callback) {
            this.callback();
        }
    }
}

export class Sawtooth extends Modifier {
    constructor(now, limit, rate, period = false) {
        super(now);
        this.limit = limit;
        if (period && period > 0) { 
            this.rate = this.limit / period;
        } else {
            this.rate = rate;
        }
        // rate is per second, convert to per millisecond
        this.rate /= 1000;
        this.waveValue = 0;
    }

    update(now, current) {
        const delta = (now - this.lastUpdate) * this.rate;
        this.waveValue += delta;
        if (this.waveValue > this.limit) {
            this.waveValue = 0;
        }
        this.value = current + this.waveValue;
        this.setLast(now);
        return true;
    }
}

export class TriangleWave extends Modifier {
    constructor(now, limit, rate, period = false) {
        super(now);
        this.limit = limit;
        if (period && period > 0) { 
            this.rate = this.limit / (period / 2);
        } else {
            this.rate = rate;
        }
        // rate is per second, convert to per millisecond
        this.rate /= 1000;
        this.rising = true;
        this.waveValue = 0;
    }

    update(now, current) {
        const delta = (now - this.lastUpdate) * this.rate;
        if (this.rising) {
            this.waveValue += delta;
            if (this.waveValue >= this.limit) {
                this.waveValue = this.limit;
                this.rising = false;
            }
        } else { // falling
            this.waveValue -= delta;
            if (this.waveValue <= 0) {
                this.waveValue = 0;
                this.rising = true;
            }
        }
        this.value = current + this.waveValue;
        this.setLast(now);
        return true;
    }
}

export class SineWave extends Modifier {
    constructor(now, limit, period, offset = 0) {
        super(now);
        this.limit = limit;
        // period is in seconds, convert to millis
        this.period = period * 1000;
        this.offset = offset;
        this.waveValue = 0;
    }

    update(now, current) {
        const radians = ((now - this.lastUpdate) / this.period) * 2 * Math.PI;
        this.value = current + (Math.sin(radians) * this.limit) + this.offset;
        if ((now - this.lastUpdate) > this.period) {
            this.setLast(now);
        }
        return true;
    }
}

export class CosineWave extends Modifier {
    constructor(now, limit, period, offset = 0) {
        super(now);
        this.limit = limit;
        // period is in seconds, convert to millis
        this.period = period * 1000;
        this.offset = offset;
        this.waveValue = 0;
    }

    update(now, current) {
        const radians = ((now - this.lastUpdate) / this.period) * 2 * Math.PI;
        this.value = current + (Math.cos(radians) * this.limit) + this.offset;
        if ((now - this.lastUpdate) > this.period) {
            this.setLast(now);
        }
        return true;
    }
}

export class RandomWalk extends Modifier {
    constructor(now, limit, stepSize, frequency, chance = 100) {
        super(now);
        this.limit = limit;
        this.stepSize = stepSize;
        this.frequency = frequency;
        this.chance = chance;
        this.walkLocation = 0;
    }

    update(now, current) {
        if ((now - this.lastUpdate) > this.frequency) {
            if ((this.chance < 100) && ((Math.random() * 100) > this.chance)) {
                this.setLast(now);
                return false;
            }
            const step = (this.stepSize * -1) + (Math.random() * (this.stepSize * 2));
            this.walkLocation += step;
            if (this.walkLocation >= this.limit) {
                this.walkLocation = this.limit;
            } else if (this.value <= this.limit * -1) {
                this.walkLocation = this.limit * -1;
            }
        }
        this.value = current + this.walkLocation;
        this.setLast(now)
        return true;
    }
}

export class LinearRate extends Modifier {
    constructor(now, rate, duration = false, callback = false) {
        super(now, callback);
        // rate is per second, need as millis
        this.rate = rate / 1000;
        if (duration !== false && duration > 0) {
            // duration is seconds, convert to millis
            this.duration = duration * 1000;
        }
    }

    update(now, current) {
        if (this.expired) {
            return false;
        }
        let delta = (now - this.lastUpdate) * this.rate;
        if (this.duration !== false && (now - this.startTime) > this.duration) {
            this.expired = true;
            if (this.callback) {
                this.callback();
            }
        } else {
            this.value = current + delta;
            this.setLast(now)
        }
        return true;
    }
}

export class LinearTarget extends Modifier {
    constructor(now, target, duration, callback = false) {
        super(now, callback);
        this.rate = false;
	this.target = target;
        // duration is seconds, convert to millis
        this.duration = duration * 1000;
    }

    update(now, current) {
        if (this.expired) {
            return false;
        }
        if (!this.rate) { // first run
            // rate is per second, need as millis
            this.rate = (this.target - current) / this.duration;
        }
        let delta = (now - this.lastUpdate) * this.rate;
        if ((now - this.startTime) > this.duration) {
            this.expired = true;
            if (this.callback) {
                this.callback();
            }
        } else {
            this.value = current + delta;
            this.setLast(now)
        }
        return true;
    }
}

export class Acceleration extends Modifier {
    constructor(now, rate, target = false, duration = false, callback = false) {
        super(now, callback);
        this.rate = rate;
        this.target = target;
        this.duration = duration;
        this.callback = callback;
        this.initial = false;
        this.direction = rate < 0 ? -1 : 1;
        this.constant = false;
    }

    update(now, current) {
        if (this.constant) {
            if (this.callback) {
                this.callback();
                this.callback = false;
            }
            this.value += (now - this.lastUpdate) * this.constant;
            this.setLast(now);
            return true;
        } // else
        if (!this.initial) { // first run
            this.initial = current;
        }
        const elapsed = (now - this.startTime) / 1000;
        const speed = ((((this.rate * elapsed) ** 2)/2) * this.direction);
        if (this.target) { // if we have the current value, check target
            if (this.rate < 0) { // Are we slowing?
                if (speed < this.target) {
                    this.constant = speed / 1000;
                }
            } else {
                if (speed > this.target) {
                    this.constant = speed / 1000;
                }
            }
        }
        if (this.duration !== false && elapsed > this.duration) {
            this.constant = speed / 1000;
        }
        if (!this.constant) {
		    this.value = this.initial + speed;
            this.setLast(now);
        }
        return true;
    }
}

export class Constant extends Modifier {
    constructor(now, value) {
        super(now);
        this.addend = value;
    }

    update(now, current) {
        this.value = current + this.addend;
        return true;
    }
}

export class Multiplier extends Modifier {
    constructor(now, value) {
        super(now);
        this.multiplicand = value;
    }

    update(now, current) {
        this.value = current * this.multiplicand;
        return true;
    }
}


export class SquareWave extends Modifier {
    constructor (now, onTime, offTime, height = 100, count = false) {
        super(now);
        // times are in seconds, convert to millis
        this.onTime = onTime * 1000;
        this.offTime = offTime * 1000;
        this.value = 0;
        this.height = height;
        this.waveValue = 0;
        this.count = count;
    }

    update(now, current) {
        if (this.expired) {
            return false;
        }
        let changed = false;
        if (this.waveValue == 0 && ((now - this.lastUpdate) > this.offTime)) {
            this.waveValue = this.height;
            this.setLast(now);
            this.value = current + this.waveValue;
            changed = true;
        } else if (this.waveValue == this.height && ((now - this.lastUpdate) > this.onTime)) {
            this.waveValue = 0;
            this.setLast(now);
            this.value = current + this.waveValue;
            changed = true;
            if (this.count !== false) {
                if (this.count <= 0) {
                    this.expired = true;
                }
                this.count -= 1;
            }
        }
        return changed;
    }
}


export class RandomWave extends Modifier {
    constructor(now, valueLimit, timeLimit, shape = "step") {
        super(now);
        this.valueLimit = valueLimit;
        this.timeLimit = timeLimit;
        this.shape = shape;
        this.stepSize = 0;
        this.ticks = 0;
        this.waveValue = 0;
    }

    update(now, current) { // Needs to return true always if "line", but only true
        // when step is updated TBD - split into two forms...?
        if (this.ticks == 0) { // time to pick a new value
            this.ticks = Math.random() * ((this.timeLimit * 1000) / defaults.SPRITE_RATE);
            const next = Math.random() * this.valueLimit;
            if (this.shape == "step") {
                this.waveValue = next;
                this.stepSize = 0;
            } else { // "line"
                this.stepSize = (this.waveValue - next) / this.ticks;
            }
            this.value = current + this.waveValue;
            return true
        } else { // update existing
            this.waveValue += this.stepSize;
            this.ticks -= 1;
        }
        return false;
    }
}

export class Chance extends Modifier {
    constructor(now, chance) {
        super(now);
        this.chance = chance; // as a percentage
    }

    update(now, current) {
        if (Math.random() * 100 < this.chance) {
            this.value = current;
        } else {
            this.value = 0;
        }
        return true;
    }
}
