
import * as Utils from "./utils.js";
import defaults from "./defaults.js";

export class Globals {
    static root = null;
    static scenes = [];
    static app = null;
    static log = new Utils.Log(defaults.DEBUG);
    static current_trigger = "";
    static display_width = defaults.DISPLAY_WIDTH;
    static display_height = defaults.DISPLAY_HEIGHT;
    static script_width = defaults.DISPLAY_WIDTH;
    static script_height = defaults.DISPLAY_HEIGHT;
    static script_scale_type = defaults.SCALE_NONE;
    static script_scale_x = 1;
    static script_scale_y = 1;
    static gravity = defaults.GRAVITY_PS2;
    static ground_level = defaults.DISPLAY_HEIGHT;
    static lastKey = null;
    static key = null;

    constructor() {
    }

    static reset() {
        Globals.root = null;
        Globals.scenes = [];
        Globals.app = null;
        Globals.log = new Utils.Log(defaults.DEBUG);
        Globals.current_trigger = "";
        Globals.display_width = defaults.DISPLAY_WIDTH;
        Globals.display_height = defaults.DISPLAY_HEIGHT;
        Globals.script_width = defaults.DISPLAY_WIDTH;
        Globals.script_height = defaults.DISPLAY_HEIGHT;
        Globals.script_scale_type = defaults.SCALE_NONE;
        Globals.script_scale_x = 1;
        Globals.script_scale_y = 1;
        Globals.gravity = defaults.GRAVITY_PS2;
        Globals.lastKey = null;
        Globals.key = null;
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