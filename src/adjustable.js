import { Globals } from "./globals.js";
import defaults from "./defaults.js";

export class Adjustable2 {
    constructor(inValue, minValue = Number.MIN_SAFE_INTEGER, maxValue = Number.MAX_SAFE_INTEGER, wrap = false) {
        // values and limits
        this.referenceValue = inValue;
        this.lowerLimit = minValue;
        this.upperLimit = maxValue;
        this.wrap = wrap;
        // Modifier stack
        this.referenceModifiers = [];
        this.offsetModifiers = [];
        this.referenceValue = inValue;
        this.offsetValue = 0;
        this.externalUpdate = false;
    }

    addReferenceModifier(modifier) {
        this.referenceModifiers.push(modifier);
    }

    addOffsetModifier(modifier) {
        this.offsetModifiers.push(modifier);
    }

    removeModifier(modifier) {
        if (!modifier) { // not an error
            return;
        }
        for (let i = 0; i < this.referenceModifiers.length; i++) {
            if (this.referenceModifiers[i] === modifier) {
                this.referenceModifiers[i].stop();
                this.referenceModifiers.splice(i,1);
                break;
            }
        }
        for (let i = 0; i < this.offsetModifiers.length; i++) {
            if (this.offsetModifiers[i] === modifier) {
                this.offsetModifiers[i].stop();
                this.offsetModifiers.splice(i,1);
                break;
            }
        }
    }

    reference() {
        return this.referenceValue;
    }

    value() {
        return this.referenceValue + this.offsetValue;
    }

    offset() {
        return this.offsetValue;
    }

    setValue(value) {
        this.referenceValue = value;
        this.externalUpdate = true;
    }

    forceValue(value) {
        this.referenceValue = value;
    }

    stop() {
        // We call stop() in case there are callbacks waiting
        for (let i = 0; i < this.referenceModifiers.length; i++) {
            this.referenceModifiers[i].stop();
        }
        this.referenceModifiers = [];
        for (let i = 0; i < this.offsetModifiers.length; i++) {
            this.offsetModifiers[i].stop();
        }
        this.offsetModifiers = [];
        this.offsetValue = 0;
    }

    updateValue() {
        const now = Date.now();
        let updated = this.externalUpdate;
        this.externalUpdate = false;
        for (let i = 0; i < this.referenceModifiers.length; i++) {
            if (this.referenceModifiers[i].update(now, this.referenceValue)) {
                this.referenceValue = this.referenceModifiers[i].getValue();
                updated = true;
            }
        }
        // Clamp to given limits
        if (this.referenceValue < this.lowerLimit) {
            if (this.wrap) {
                this.referenceValue = this.upperLimit;
            } else {
                this.referenceValue = this.lowerLimit;
            }
        } else if (this.referenceValue > this.upperLimit) {
            if (this.wrap) {
                this.referenceValue = this.lowerLimit;
            } else {
                this.referenceValue = this.upperLimit;
            }
        }
        this.offsetValue = 0;
        for (let i = 0; i < this.offsetModifiers.length; i++) {
            if (this.offsetModifiers[i].update(now, this.offsetValue)) {
                this.offsetValue = this.offsetModifiers[i].getValue();
                updated = true;
            }
        }
        return updated;
    }
// To do - remove expired modifiers
}
