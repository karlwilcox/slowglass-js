/* Imports */
import { Scene, SceneText } from "./scene.js";
import Defaults from "./defaults.js";
import { Globals } from "./globals.js";
import { AudioManager } from "./audio.js";
import defaults from "./defaults.js";
import * as Utils from "./utils.js";
import * as constants from './constants.js';
import { Parser } from "./parser.js";
import { WordList } from "./wordlist.js";

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

    readFromText(text, include = false, URLFolder = "") {
        const script = text.split(/\r?\n/);
        const count = script.length;
        const top = new SceneText(constants.MAIN_NAME, URLFolder);
        let main = top;
        let holding = null;
        let inComment = false;
        let inDescription = false;
        for(let i = 0; i < script.length; i++ ) {
            let lineCount = i + 1;
            let currentLine = script[i].trim();
            while (currentLine.endsWith('\\')) {
                // take off the backslash
                currentLine = currentLine.slice(0,-1);
                i += 1;
                if (i < script.length) {
                    // add in the new line
                    currentLine += " " + script[i].trim();
                }
            }
            if (inDescription) {
                if (currentLine.match(/^end ?description/)) {
                    inDescription = false;
                }
                continue;
            }
            // handle 'C' style comments
            // remove all within single line
            currentLine = currentLine.replace(/\/\*[\s\S]*?\*\//g, '');
            // Now deal with multi-line comments
            if (inComment) {
                if (currentLine.match(/\*\//)) {
                    let endPos = currentLine.search(/\*\//);
                    // discard up to comment end
                    currentLine = currentLine.substr(endPos + 1);
                    inComment = false;
                } else {
                    continue; // discard whole line
                }
            }
            if (currentLine.match(/\/\*/)) {
                let startPos = currentLine.search(/\/\*/);
                // discard from the start comment onwards
                currentLine = currentLine.substr(0, startPos);
                inComment = true;
            }
            /* discard single line comments, empty lines etc.  */
            currentLine = currentLine.replace(/\/\/.*$/,'');
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
            if (command == "description") {
                inDescription = true;
                continue;
            }
            let argument = "";
            let argument2 = "";
            let argument3 = "";
            if (words.length > 1) {
                argument = words[1];
            }
            if (words.length > 2) {
                argument2 = words[2];
            }
            if (words.length > 3) {
                argument3 = words[3];
            }
            // Look for a new scene
            if (command == 'scene') {
                if (argument == null) {
                    Globals.log.error(`expected scene name on line ${lineCount}`);
                } else {
                    if (holding != null) {
                        Globals.scenesTexts.push(holding);
                    }
                    holding = new SceneText(argument, URLFolder);
                    if (argument == constants.MAIN_NAME) {
                        main = holding;
                    }
                    // Any other content on the line is assumed to be tags
                    let index = 3;
                    if (words.length > 3) {
                        if (words[3] == "with") {
                            index = 4;
                        }
                        if (words.length > 4) {
                            if (words[4] == "tag" || words[4] == "tags") {
                                index = 5;
                            }
                        }
                        holding.tags.addTag(words.slice(index));
                    }
                }
            // look for an explicit scene end
            } else if (command == 'end') {
                if (argument == 'file') {
                    // end processing (ignore rest of file)
                    break;
                } else if (argument == 'scene') {
                    if (holding != null) {
                        Globals.sceneTexts.push(holding);
                        holding = null;
                    } else {
                        Globals.log.error(`no current scene at line ${lineCount}`);
                    }
                }
                // alternative forms of the above
            } else if (command == "endfile") {
                break;
            } else if (command == "endscene") {
                if (holding != null) {
                    Globals.sceneTexts.push(holding);
                    holding = null;
                } else {
                    Globals.log.error(`no current scene at line ${lineCount}`);
                }
            } else if (command == "display" || command == "canvas") {
                if (include) {
                    Globals.log.error('Directives in include will be ignored!');
                    continue;
                }
                switch (argument) {
                    case 'width': {
                            let displayWidth = parseInt(argument2);
                            if (displayWidth < 50 || displayWidth > 5000) {
                                Globals.log.error("silly display width");
                                displayWidth = defaults.DISPLAY_WIDTH;
                            }
                            Globals.displayWidth = displayWidth;
                        }
                        break;
                    case 'height':{
                            let displayHeight = parseInt(argument2);
                            if (displayHeight < 50 || displayHeight > 5000) {
                                Globals.log.error("silly display height");
                                displayHeight = defaults.DISPLAY_HEIGHT;
                            }
                            Globals.displayHeight = displayHeight;
                        }
                        break;
                    case 'size': {
                            let displayWidth = parseInt(argument2);
                            if (displayWidth < 50 || displayWidth > 5000) {
                                Globals.log.error("silly display width");
                                displayWidth = defaults.DISPLAY_WIDTH;
                            }
                            Globals.displayWidth = displayWidth;
                            let displayHeight = parseInt(argument3);
                            if (displayHeight < 50 || displayHeight > 5000) {
                                Globals.log.error("silly display height");
                                displayHeight = defaults.DISPLAY_HEIGHT;
                            }
                            Globals.displayHeight = displayHeight;
                        }
                        break;
                    case "colour":
                    case "color":
                    case "background":
                        Globals.displayColour = argument2;
                        break;
                    case "fullscreen":
                        Globals.log.report("Full screen not supported yet");
                        break;
                    default:
                        Globals.log.error(`Unknown display option ${argument}`);
                        break;
                } 
            } else if (command == 'script') {
                if (include) {
                    Globals.log.error('Directives in include will be ignored!');
                    continue;
                }
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
            } else if (command == "option") {
                switch(argument) {
                    case "lat":
                    case "latitude":
                        Globals.location.setLat(argument2);
                        break;
                    case "lon":
                    case "long":
                    case "longitude":
                        Globals.location.setLon(argument2);
                        break;
                    case "evaluator":
                        if (argument2 == "basic" && Globals.basicEvaluator) {
                            Globals.evaluator = argument2;
                        } else if (argument2 == "advanced" && Globals.advancedEvaluator) {
                            Globals.evaluator = argument2;
                        } else {
                            Globals.log.error("Unknown evaluator - " + argument2);
                        }
                        break;
                    default:
                        Globals.log.error("Unknown option - " + argument);
                        break;
                }
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
            Globals.sceneTexts.push(holding);
        }
        if (include) {
            // scenes have already been added, we may have some top level commands
            top.name = "_INCLUDE_";
            top.start();
            // Globals.scenes.push(top);
            // merge it with the existing top scene
            const mainScene = Scene.find(constants.MAIN_NAME, false);
            mainScene.merge(top);
            // top can now be discarded
        } else {
            if (top.content.length < 1 && main == top) {
                Globals.log.error('No main scene, nothing will happen!');
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
                // Add an empty action group to the top level for interactive actions
                if (top.content.length > 0) {
                    Globals.sceneTexts.push(top);
                }
                const scene = new Scene(main, constants.MAIN_NAME);
                scene.interactive_index = scene.actionGroups.length;
                scene.actionGroups.push(new Utils.ActionGroup());
                scene.start();
            }
        }
        return true;
    }

/**************************************************************************************************

   ########  ##     ## ##    ## 
   ##     ## ##     ## ###   ## 
   ##     ## ##     ## ####  ## 
   ########  ##     ## ## ## ## 
   ##   ##   ##     ## ##  #### 
   ##    ##  ##     ## ##   ### 
   ##     ##  #######  ##    ## 

**************************************************************************************************/

    async run() {
        this.clean = false;
        Globals.startTime = Date.now();
        // Initialise renderer (Pixi v8 requirement)
        await Globals.app.init({
            // resizeTo: window,
            background: Globals.displayColour,
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

/**************************************************************************************************

   ##     ## ########  ########     ###    ######## ######## 
   ##     ## ##     ## ##     ##   ## ##      ##    ##       
   ##     ## ##     ## ##     ##  ##   ##     ##    ##       
   ##     ## ########  ##     ## ##     ##    ##    ######   
   ##     ## ##        ##     ## #########    ##    ##       
   ##     ## ##        ##     ## ##     ##    ##    ##       
    #######  ##        ########  ##     ##    ##    ######## 

**************************************************************************************************/

    update(ticker) {
        // Action granularity is only 1 second, so only update every 0.5 seconds
        // (to ensure we catch triggers that are accurate to 1 second, e.g. "at"
        // Could adjust this if needed in defaults
        let millis = Date.now();
        if (SlowGlass.nextAction_run < millis) {
            if (Globals.app.screen.width != Globals.displayWidth) {
                Globals.app.screen.width = Globals.displayWidth;
            }
            if (Globals.app.screen.height != Globals.displayHeight) {
                Globals.app.screen.height = Globals.displayHeight;
            }
            for ( let i = 0; i < Globals.scenes.length; i++ ) {
                let current = Globals.scenes[i];
                // we are only interested in running scenes or those that have just been loaded
                if (current.state != constants.SCENE_RUNNING && current.state != constants.SCENE_LOADED) {
                    continue;
                }
                // Found an active scene, now go through each action group
                let firstAction = 0;
                for ( let j = 0; j < current.actionGroups.length; j++ ) {
                    let doRun = false;
                    const actionGroup = current.actionGroups[j];
                    // Is this a suspended group that can be restarted?
                    if (actionGroup.suspended) {
                        // What was the reason for the suspension?
                        switch(actionGroup.waitType) {
                            case "pause":
                                doRun = millis > actionGroup.waitClause;
                                break;
                            case "then":
                                doRun = actionGroup.isFinished();
                                break;
                            case "until":
                            case "while":
                                const expanded = current.varList.expandVars(actionGroup.waitClause);
                                const evaluated = Utils.evaluate(expanded)
                                doRun = Utils.logical(expanded.split(/ +/));
                                if (actionGroup.waitType == "while") {
                                    doRun = !doRun;
                                }
                                break;
                        }
                        if (doRun) {
                            firstAction = actionGroup.resume();
                        } else {
                            continue; // still suspended, go on to next group
                        }
                    }  else { // not suspended, test the triggers
                        let triggers = current.actionGroups[j].triggers;
                        for ( let k = 0; k < triggers.length; k++) {
                            if (current.state == constants.SCENE_LOADED) { 
                                // run init triggers only
                                if (triggers[k].constructor.name == "Setup") {
                                    triggers[k].fired();
                                    doRun = true;
                                } else {
                                    continue;
                                }
                            } else {
                                // this implements the any/all condition. It is set by looking
                                // at each trigger in turn. If the when condition is "any"
                                // we immediately break out of the loop and run actions
                                // If when is "all" we break out of the loop as soon as a
                                // trigger fails. Hence the only way to get out of the loop
                                // with doRun set to true is for all the triggers to succeed
                                // check each trigger, if ANY is valid then execute actions
                                if (triggers[k].fired(millis)) {
                                    current.varList.trigger = triggers[k].constructor.name;
                                    doRun = true;
                                    if (actionGroup.any_trigger) {
                                        break;
                                    }
                                } else {
                                    doRun = false;
                                    if (!actionGroup.any_trigger) {
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if (doRun) {
                        current.runGroup(j, millis, firstAction);
                    }
                }
                if (current.state == constants.SCENE_LOADED) { 
                    // now set the state to ready
                    current.state = constants.SCENE_READY;
                }
            }
            SlowGlass.nextAction_run = millis + Defaults.TRIGGER_RATE;
        }
        // But sprites can be updated up to every frame if we want...
        if (SlowGlass.next_spriteUpdate < millis) {
            for ( let i = 0; i < Globals.scenes.length; i++ ) {
                let current = Globals.scenes[i];
                if (current.state != constants.SCENE_RUNNING) {
                    continue;
                }
                // Found an active scene, now go through each sprite
                for ( let j = 0; j < current.sprites.length; j++ ) {
                    current.sprites[j].update(current.name, millis);
                }
            }
            SlowGlass.next_spriteUpdate = millis + Defaults.SPRITE_RATE;
        }
    }

/**************************************************************************************************

   ######## ##    ## ######## ########  ##    ##    ########   #######  #### ##    ## ########  ######  
   ##       ###   ##    ##    ##     ##  ##  ##     ##     ## ##     ##  ##  ###   ##    ##    ##    ## 
   ##       ####  ##    ##    ##     ##   ####      ##     ## ##     ##  ##  ####  ##    ##    ##       
   ######   ## ## ##    ##    ########     ##       ########  ##     ##  ##  ## ## ##    ##     ######  
   ##       ##  ####    ##    ##   ##      ##       ##        ##     ##  ##  ##  ####    ##          ## 
   ##       ##   ###    ##    ##    ##     ##       ##        ##     ##  ##  ##   ###    ##    ##    ## 
   ######## ##    ##    ##    ##     ##    ##       ##         #######  #### ##    ##    ##     ######  

**************************************************************************************************/

    async scriptFromURL(url, include = false) {
        if (include) {
            Globals.log.report("Including script from " + url);
        } else {
            Globals.log.report("Starting Slow Glass from " + url);
            this.cleanUp();
        }
        const response = await fetch(url);
        if (!response.ok) {
            Globals.log.error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        if (this.readFromText(text, include, url.slice(0,url.lastIndexOf('/')))) {
            if (!include) {
                this.run();
            } // include file just adds scenes to the existing list
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

    setOption(optionName, optionValue) {
        switch(optionName.toLowerCase()) {
            case "latitude":
            case "lat":
                Globals.location.setLat(optionValue);
                break;
            case "longitude":
            case "long":
            case "lon":
                Globals.location.setLon(optionValue);
                break;
            case "evaluator":
                Globals.evaluator = optionValue;
                break;
            case "city":
                Globals.location.setCity(optionValue);
                break;
            case "cors":
            case "corsproxy":
                Globals.corsProxy = optionValue;
                break;
        }
    }

    cleanUp() {
        if (this.clean) { return; }
        // tidy up previous run
        AudioManager.deleteAll();
        if (Globals.app != null && Globals.app.stage.children.length > 0) {
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
