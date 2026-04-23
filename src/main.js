/* Imports */
import { Scene } from "./scene.js";
import Defaults from "./defaults.js";
import { Globals } from "./globals.js";
import { AudioManager } from "./audio.js";
import defaults from "./defaults.js";
import * as Utils from "./utils.js";
import * as constants from './constants.js';
import { Parser } from "./parser.js";

class SlowGlass {
    static nextAction_run = 0;
    static next_spriteUpdate = 0;
    static sg_id = "body";
    static clean = true;

    constructor() {
    }
/**************************************************************************************************

   ########  ########    ###    ########  ######## ######## ##     ## ######## 
   ##     ## ##         ## ##   ##     ##    ##    ##        ##   ##     ##    
   ##     ## ##        ##   ##  ##     ##    ##    ##         ## ##      ##    
   ########  ######   ##     ## ##     ##    ##    ######      ###       ##    
   ##   ##   ##       ######### ##     ##    ##    ##         ## ##      ##    
   ##    ##  ##       ##     ## ##     ##    ##    ##        ##   ##     ##    
   ##     ## ######## ##     ## ########     ##    ######## ##     ##    ##    

**************************************************************************************************/

    readFromText(text) {
        const script = text.split(/\r?\n/);
        const count = script.length;
        const top = new Scene(constants.MAIN_NAME);
        let holding = null;
        let in_comment = false;
        for(let i = 0; i < script.length; i++ ) {
            let lineCount = i + 1;
            let currentLine = script[i].trim();
            // handle 'C' style comments
            // remove all within single line
            currentLine = currentLine.replace(/\/\*[\s\S]*?\*\//g, '');
            // Now deal with multi-line comments
            if (in_comment) {
                if (currentLine.match(/\*\//)) {
                    let end_pos = currentLine.search(/\*\//);
                    // discard up to comment end
                    currentLine = currentLine.substr(end_pos + 1);
                    in_comment = false;
                } else {
                    continue; // discard whole line
                }
            }
            if (currentLine.match(/\/\*/)) {
                let start_pos = currentLine.search(/\/\*/);
                // discard from the start comment onwards
                currentLine = currentLine.substr(0, start_pos);
                in_comment = true;
            }
            /* discard single line comments, empty lines etc.  */
            currentLine.replace(/\/\/.*$/,'');
            if (currentLine.length < 2 || currentLine.startsWith('#')) { // we have no short commands etc.
                continue;
            }
            if (!currentLine.match(/\w+/)) { // and all commands are text
                continue;
            }
            // ignore any punctuation used to show indenting
            currentLine = currentLine.replace(/^[^a-zA-Z"\$]+/,"");
            let words = Parser.splitWords(currentLine.toLowerCase());
            // ignore and as the first word (syntactic sugar)
            if (words[0] == 'and') {
                words.shift();
            }
            // Handle scene management commands
            let command = words[0];
            let argument = "";
            let argument2 = "";
            if (words.length > 1) {
                argument = words[1];
            }
            if (words.length > 2) {
                argument2 = words[2];
            }
            // Look for a new scene
            if (command == 'scene') {
                if (argument == null) {
                    Globals.log.error(`expected scene name on line ${lineCount}`);
                } else {
                    if (holding != null) {
                        Globals.scenes.push(holding);
                    }
                    holding = new Scene(argument);
                }
            // look for an explicit scene end
            } else if (command == 'end') {
                if (argument == 'file') {
                    break;
                } else if (argument == 'scene') {
                    if (holding != null) {
                        Globals.scenes.push(holding);
                        holding = null;
                    } else {
                        Globals.log.error(`no current scene at line ${lineCount}`);
                    }
                } else {
                    Globals.log.error("end must be followed by file or scene");
                }
            // end processing (ignore rest of file)
            } else if (command == "display") {
                if (argument == 'width') {
                    let displayWidth = parseInt(argument2);
                    if (displayWidth < 50 || displayWidth > 5000) {
                        Globals.log.error("silly display width");
                        displayWidth = defaults.DISPLAY_WIDTH;
                    }
                    Globals.displayWidth = displayWidth;
                } else if (argument == 'height') {
                    let displayHeight = parseInt(argument2);
                    if (displayHeight < 50 || displayHeight > 5000) {
                        Globals.log.error("silly display height");
                        displayHeight = defaults.DISPLAY_HEIGHT;
                    }
                    Globals.displayHeight = displayHeight;
                } // else look for fullscreen
            } else if (command == 'include') {
                Globals.log.error('Include not supported yet');
            } else if (command == 'script') {
                if (argument == 'width') {
                    let scriptWidth = parseInt(argument2);
                    if (scriptWidth < 50 || scriptWidth > 5000) {
                        Globals.log.error("silly script width");
                        scriptWidth = defaults.DISPLAY_WIDTH;
                    }
                    Globals.scriptWidth = scriptWidth;
                } else if (argument == 'height') {
                    let scriptHeight = parseInt(argument2);
                    if (scriptHeight < 50 || scriptHeight > 5000) {
                        Globals.log.error("silly script height");
                        scriptHeight = defaults.DISPLAY_HEIGHT;
                    }
                    Globals.scriptHeight = scriptHeight;
                } else if (argument == "scale") {
                    switch (argument2) {
                        case "fit":
                            Globals.scriptScaleType = constants.SCALE_FIT;
                            break;
                        case "stretch":
                            Globals.scriptScaleType = constants.SCALE_STRETCH;
                            break;
                        case "none":
                        default:
                            Globals.scriptScaleType = constants.SCALE_STRETCH;
                            break;
                    }
                }
            } else if (command == 'gravity') {
                let gravity = parseFloat(argument);
                if (gravity <= 0) {
                    Globals.log.error("silly gravity setting");
                    gravity = defaults.GRAVITY_PS2;
                }
                Globals.gravity_ps2 = gravity; // NOTE, not scaled, scale on use
            } else if (command == "ground") {
                if (argument == "level") {
                    argument = argument2;
                }
                Globals.ground_level = parseInt(argument);
            } else {
                // must be an action, trigger or condition
                const line = new Utils.Line(lineCount, currentLine);
                if (holding == null) {
                    top.content.push(line);
                } else {
                    holding.content.push(line);
                }
            }
        }
        // add the final scene if unterminated
        if (holding != null) {
            Globals.scenes.push(holding);
        }
        if (top.content.length < 1) {
            Globals.log.error('No top level actions, nothing will happen!');
            return false;
        } else {
            // calculate overall scaling
            switch (Globals.scriptScaleType) {
                case constants.SCALE_STRETCH:
                    Globals.scriptScaleX = Globals.displayWidth / Globals.scriptWidth;
                    Globals.scriptScaleY = Globals.displayHeight / Globals.scriptHeight;
                    break;
                case constants.SCALE_FIT:
                    // todo
                case constants.SCALE_NONE:
                default:
                    break;
            }
            top.start();
            // Add an empty action group to the top level for interactive actions
            top.interactive_index = top.actionGroups.length;
            top.actionGroups.push(new Utils.ActionGroup());
            Globals.scenes.push(top);
        }
        return true;
    }

    async run() {
        this.clean = false;
        // Initialise renderer (Pixi v8 requirement)
        await Globals.app.init({
            // resizeTo: window,
            background: "#dfdfdf",
            width: Globals.displayWidth,
            height: Globals.displayHeight,
        });

        // Add canvas to page
        document.onkeydown = function(e) {Globals.event("onkeydown", e.key);};
        document.onkeyup = function(e) {Globals.event("onkeyup", e.key);};
        const pixi = document.getElementById(SlowGlass.sg_id);
        pixi.appendChild(Globals.app.canvas);

        // Root container for scene
        Globals.root = new PIXI.Container();
        Globals.root.sortableChildren = true;
        Globals.app.stage.addChild(Globals.root);

        // Main loop
        Globals.app.ticker.add(this.update);

        // Keep sprite centred when window resizes
        // window.addEventListener("resize", () => {
        // });
    }

    update(ticker) {
        // Action granularity is only 1 second, so only update every 0.5 seconds
        // (to ensure we catch triggers that are accurate to 1 second, e.g. "at"
        // Could adjust this if needed in defaults
        let current_millis = Date.now();
        if (SlowGlass.nextAction_run < current_millis) {
            if (Globals.app.screen.width != Globals.displayWidth) {
                Globals.app.screen.width = Globals.displayWidth;
            }
            if (Globals.app.screen.height != Globals.displayHeight) {
                Globals.app.screen.height = Globals.displayHeight;
            }
            for ( let i = 0; i < Globals.scenes.length; i++ ) {
                let current = Globals.scenes[i];
                if (current.state != constants.SCENE_RUNNING) {
                    continue;
                }
                // First let's see if any local timers have expired
                for (let j = 0; j < current.timers.length; j++ ) {
                    if (current.timers[j].expired(current_millis)) {
                        current.timers.splice(j,1);
                    }
                }
                // Found an active scene, now go through each action group
                for ( let j = 0; j < current.actionGroups.length; j++ ) {
                    // this implements the any/all condition. It is set by looking
                    // at each trigger in turn. If the when condition is "any"
                    // we immediately break out of the loop and run actions
                    // If when is "all" we break out of the loop as soon as a
                    // trigger fails. Hence the only way to get out of the loop
                    // with do_run set to true is for all the triggers to succeed
                    let do_run = false;
                    // check each trigger, if ANY is valid then execute actions
                    let triggers = current.actionGroups[j].triggers;
                    for ( let k = 0; k < triggers.length; k++) {
                        if (triggers[k].fired(current_millis)) {
                            current.varList.trigger = triggers[k].constructor.name;
                            do_run = true;
                            if (current.actionGroups[j].any_trigger) {
                                break;
                            }
                        } else {
                            do_run = false;
                            if (!current.actionGroups[j].any_trigger) {
                                break;
                            }
                        }
                    }
                    if (do_run) {
                        current.runGroup(j, current_millis);
                    }
                }
            }
            SlowGlass.nextAction_run = current_millis + Defaults.TRIGGER_RATE;
        }
        // But sprites can be updated up to every frame if we want...
        if (SlowGlass.next_spriteUpdate < current_millis) {
            for ( let i = 0; i < Globals.scenes.length; i++ ) {
                let current = Globals.scenes[i];
                if (current.state != constants.SCENE_RUNNING) {
                    continue;
                }
                // Found an active scene, now go through each sprite
                for ( let j = 0; j < current.sprites.length; j++ ) {
                    current.sprites[j].update(current.name, current_millis);
                }
            }
            SlowGlass.next_spriteUpdate = current_millis + Defaults.SPRITE_RATE;
        }
    }

    async scriptFromURL(url) {
        Globals.log.report("Starting Slow Glass from " + url);
        this.cleanUp();
        const response = await fetch(url);
        if (!response.ok) {
            Globals.log.error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        if (this.readFromText(text)) {
            this.run();
        }
    }

    interactiveAction(text) {
        const topScene = Scene.find(constants.MAIN_NAME);
        const interactiveGroup = topScene.actionGroups[topScene.interactive_index];
        interactiveGroup.actions = [];
        const lines = text.split(";");

        for (let i = 0; i < lines.length; i++) {
            const lineText = lines[i].trim();
            if (lineText.length < 1) {
                continue;
            }
            interactiveGroup.actions.push(new Utils.Line(i + 1, lineText));
        }
        interactiveGroup.nextAction = 0;
        do {
            topScene.runAction(interactiveGroup.nextAction, interactiveGroup, Date.now());
        } while (interactiveGroup.nextAction < interactiveGroup.actions.length);
    }

    setDrawingParent(elementID) {
        SlowGlass.sg_id = elementID;
    }

    setMessageParent(elementID) {
        Globals.log.messageParent(elementID);
    }

    cleanUp() {
        if (this.clean) { return; }
        // tidy up previous run
        // let pixi = document.getElementById(SlowGlass.sg_id);
        AudioManager.deleteAll();
        if (Globals.app != null) {
            Globals.app.destroy(
                { removeView: true },    // removes the canvas element from the DOM
                {
                    children: true,        // destroy all children in the stage
                    texture: true,         // destroy textures used by children
                    textureSource: true,   // destroy the underlying GPU texture sources
                },
            );
        }
        this.clean = true;
        Globals.reset();
        // if (pixi.hasChildNodes()) {
        //     pixi.removeChild(pixi.firstChild);
        // }
        Globals.app = new PIXI.Application();
    }

    scriptFromText(text) {
        Globals.log.report("Starting Slow Glass from textarea");
        // tidy up previous run
        this.cleanUp();
        if (this.readFromText(text)) {
            this.run();
        }
    }
}

window.slowGlass = new SlowGlass();
