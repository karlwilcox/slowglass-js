
import * as Utils from "./utils.js";
import * as constants from './constants.js';
import defaults from "./defaults.js";

export class Globals {
    static startTime = Date.now();
    static root = null;
    static scenes = [];
    static app = null;
    static log = new Utils.Log(defaults.DEBUG);
    static reporter = new Utils.Reporter();
    static evaluator = new Mexp();
    static currentTrigger = "";
    static displayWidth = defaults.DISPLAY_WIDTH;
    static displayHeight = defaults.DISPLAY_HEIGHT;
    static scriptWidth = defaults.DISPLAY_WIDTH;
    static scriptHeight = defaults.DISPLAY_HEIGHT;
    static scriptScaleType = constants.SCALE_NONE;
    static scriptScaleX = 1;
    static scriptScaleY = 1;
    static gravity = defaults.GRAVITY_PS2;
    static ground_level = defaults.DISPLAY_HEIGHT;
    static lastKey = null;
    static key = null;
    static highestZ = 0;

    constructor() {
    }

    static nextZ(depth) {
        if (depth > 0) {
            if (depth > Globals.highestZ) {
                Globals.highestZ = depth;
            }
            return depth;
        } // else
        return ++Globals.highestZ;
    }

    static list() {
        let text = "";
        for (const propt in this) {
            text += `${propt} = ${this[propt]}\n`;
        }
        return text;
    }

    static listScenes(verbose = true) {
        // verbose version later
        let text = "";
        for ( let i = 0; i < Globals.scenes.length; i++) {
            text += Globals.scenes[i].name + " ";
        }
        return text;
    }

    static listSceneTags(tags) {
        if (!Array.isArray(tag)) {
            tags = [tags];
        }
        let result = "";
        let first = true;
        for (let i = 0; i < Globals.scenes.length; i++ ) {
            for (let j = 0; j < tags.length; j++) {
                if (Globals.scenes[i].tags.hasTag(tags[j])) {
                    if (first) {
                        first = false;
                    } else {
                        result += " ";
                    }
                    result += this.images[i].name;
                    break; // don't need to check the rest of tags
                }
            }
        }
        return result;        // verbose version later
    }

    static reset() {
        Globals.root = null;
        Globals.scenes = [];
        Globals.app = null;
        Globals.currentTrigger = "";
        Globals.displayWidth = defaults.DISPLAY_WIDTH;
        Globals.displayHeight = defaults.DISPLAY_HEIGHT;
        Globals.scriptWidth = defaults.DISPLAY_WIDTH;
        Globals.scriptHeight = defaults.DISPLAY_HEIGHT;
        Globals.scriptScaleType = constants.SCALE_NONE;
        Globals.scriptScaleX = 1;
        Globals.scriptScaleY = 1;
        Globals.gravity = defaults.GRAVITY_PS2;
        Globals.lastKey = null;
        Globals.key = null;
        Globals.highestZ = 0;
    }

    static event(type, data) {
        switch (type) {
            case "onkeydown":
                Globals.lastKey = data;
                Globals.key = data;
                break;
            case "onkeyup":
                Globals.key = null;
                break;
                // others to add
        }
    }

}