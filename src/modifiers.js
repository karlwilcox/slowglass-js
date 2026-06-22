import { Globals } from "./globals.js";
import defaults from "./defaults.js";

class Modifier {
    constructor(now) {
        this.currentValue = 0;
        this.lastUpdate = now;
        this.expired = false;
        this.startTime = now;
        this.callback = false;
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
        super(now);
        this.limit = limit;
        this.stepSize = stepSize;
        this.frequency = frequency;
        this.chance = chance;
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

export class LinearRate extends Modifier {
    constructor(now, rate, duration = false, callback = false) {
        super(now);
        // rate is per second, need as millis
        this.rate = rate / 1000;
        if (duration !== false && duration > 0) {
            // duration is seconds, convert to millis
            this.duration = duration * 1000;
        }
    }

    update(now, current = false) {
        if (this.expired) {
            return false;
        }
        let delta = (now - this.lastUpdate) * this.rate;
        if (this.duration !== false && (now - this.startTime) > this.duration) {
            this.expired = true;
        }
        if (this.expired && this.callback) {
            this.callback();
        }
        this.value = delta;
        this.setLast(now)
        return true;
    }
}

export class LinearTarget extends Modifier {
    constructor(now, target, rate, duration = false, callback = false) {
        super(now);
        this.rate = rate;
        this.target = target;
        if (duration !== false && duration > 0) {
            // duration is seconds, convert to millis
            this.duration = duration * 1000;
        } else {
            this.duration = false;
        }
        this.callback = callback;
        if (rate === false && duration === false) {
            Globals.log.error("Internal error - rate or duration must be provided");
        }
    }

    update(now, current = false) {
        if (this.expired) {
            return false;
        }
        // if we don't have a speed we need to calculate it
        if (current && this.rate === false && this.duration !== false) {
            this.rate = (current - this.target) / (this.duration * 1000);
        }
        let delta = (now - this.lastUpdate) * this.rate;
        if (current) {
            const newValue = current + delta;
            if (this.target) { // if we have the current value, check target
                if (this.rate < 0) {
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

export class Acceleration extends Modifier {
    constructor(now, rate, speed, target = false, duration = false, callback = false) {
        super(now);
        // rate is pixels per second per second, convert to millis
        this.rate = rate / 1000;
        this.speed = speed;
        this.target = target;
        // duration is seconds, convert to millis
        this.duration = 0 / 1000;
        this.callback = callback;
    }

    update(now, current = false) {
        if (this.expired) {
            return false;
        }
        let deltaSquared = (now - this.lastUpdate) * this.rate;
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

export class Constant extends Modifier {
    constructor(now, value) {
        super(now);
        this.constant = value;
    }

    update(now, current = false) {
        return this.constant;
    }
}

export class RandomWave extends Modifier {
    constructor(now, valueLimit, timeLimit, shape = "step") {
        super(now);
        this.valueLimit = valueLimit;
        this.timeLimit = timeLimit;
        this.shape = shape;
        this.current = 0;
        this.stepSize = 0;
        this.ticks = 0;
    }

    update(now, current = false) {
        if (this.ticks == 0) { // time to pick a new value
            this.ticks = Math.random() * ((this.timeLimit * 1000) / defaults.SPRITE_RATE);
            const next = Math.random() * this.valueLimit;
            if (this.shape == "step") {
                this.current = next;
                this.stepSize = 0;
            } else { // "line"
                this.stepSize = (this.current - next) / this.ticks;
            }
        } else { // update existing
            this.current += this.stepSize;
            this.ticks -= 1;
        }
        return this.current;
    }
}


