

export class Adjustable {
    constructor(in_value, min_value, max_value, wrap) {
        if (arguments.length < 4) {
            wrap = false;
        }
        this.current_value = in_value;
        this.target_value = in_value;
        this.delta_value = 0;
        if (arguments.length >= 3) {
            this.lower_limit = min_value;
            this.upper_limit = max_value;
        } else {
            this.lower_limit = Number.MIN_SAFE_INTEGER;
            this.upper_limit = Number.MAX_SAFE_INTEGER;
        }
        this.last_adjustment = 0;
        this.changing = false;
        this.wrap = wrap;
        this.jig_step = 0;
        this.jig_limit = 0;
        this.jig_chance = 0;
        this.callback = null;
    }

    value() {
        return this.current_value + this.jig_step;
    }

    speed() {
        return this.delta_value;
    }

    adjust(delta) {
        let new_value = this.value + delta;
        // but check limits
        if ( new_value < this.lower_limit ) {
            new_value = this.wrap ? this.upper_limit : this.lower_limit;
        } else if ( new_value > this.upper_limit ) {
            new_value = this.wrap ? this.lower_limit : this.upper_limit;
        }
        this.value = this.new_value;
    }

    set_target_value(target, seconds, timestamp, callback) {
        if (arguments.length == 1) {
            seconds = 0;
        }
        if (arguments.length == 2) {
            timestamp = Date.now();
        }
        if (arguments.length > 3) {
            this.callback = callback;
        }
        if (target < this.lower_limit) {
            target = this.lower_limit;
        } else if (target > this.upper_limit) {
            target = this.upper_limit;
        }
        this.target_value = target;
        if (seconds == 0) {
            this.current_value = target;
            this.delta_value = 0;
            if ( this.callback != null ) {
                this.callback("adjustable");
            }
        } else {
            this.delta_value = (this.target_value - this.current_value) / (seconds * 1000);
            this.last_adjustment = timestamp;
            this.changing = true;
        }
    }

    update_value() {
        let updated = false;
        // Are we jiggly?
        if (this.jig_limit > 0 && this.jig_chance > 0) {
            if (Math.random() * 100 < this.jig_chance ) { // lets jiggle
                updated = true;
                this.jig_step += (this.jig_limit / 4) - (Math.random() * (this.jig_limit / 2));
                if (this.jig_step > this.jig_limit) {
                    this.jig_step = this.jig_limit;
                } else if (this.jig_step < (this.jig_limit * -1)) {
                    this.jig_step = this.jig_limit * -1;
                }
            }
        }
        // Are we still changing?
        if (!this.changing) {
            return updated;
        }
        // Are we there yet?
        if (((this.delta_value < 0) && (this.current_value < this.target_value)) // undershot
            || ((this.delta_value > 0) && (this.current_value > this.target_value)) // overshot
            || (Math.abs(this.current_value - this.target_value) < this.delta_value)) { // almost there
            this.current_value = this.target_value;
            this.delta_value = 0;
            this.changing = false;
            if (this.callback != null) {
                this.callback("adjustable");
            }
        } else {
            let this_adjustment = Date.now();
            this.current_value += this.delta_value * (this_adjustment - this.last_adjustment);
            this.last_adjustment = this_adjustment;
        }
        return true;
    }

    jiggle_stop() {
        this.jig_step = 0;
        this.jig_limit = 0;
        this.jig_chance = 0;
    }

    jiggle_start(limit, chance) {
        this.jig_limit = limit;
        this.jig_chance = chance;
    }

}
