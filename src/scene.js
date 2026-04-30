import { SGImage, SGSprite } from "./sgsprite.js";
import * as Triggers from "./triggers.js";
import * as Utils from "./utils.js";
import { Globals } from "./globals.js";
import { VarList } from "./vars.js";
import { AudioManager } from "./audio.js";
import defaults from "./defaults.js";
import { WordList } from "./wordlist.js";
import * as constants from './constants.js';

export class Scene {
    constructor(sceneName) {
        this.name = sceneName;
        this.state = constants.SCENE_STOPPED;
        this.content = [];
        this.interactive_index = 0;
        this.reset();
    }

    reset() {
        this.actionGroups = [];
        this.images = [];
        this.sprites = [];
        this.folder = '';
        this.spriteScene = this.name;
        this.varList = new VarList(this.name);
        this.timers = [];
        this.completionCallback = null;
        this.parameters = defaults.NOTFOUND;
        // Graphic creation options
        this.graphicFill = "black";
        this.graphicStroke = "black";
        this.graphicStrokeWidth = 1;
        this.echo = false;
    }

    static find(scene_name, report = true) {
        for (let i = 0; i < Globals.scenes.length; i++) {
            if (scene_name == Globals.scenes[i].name) {
                return Globals.scenes[i];
            }
        } // else
        if (report) {
            Globals.log.error("Cannot find scene " + scene_name);
        }
        return false;
    }

    showSceneData() {
        let text = "Scene: " + this.name + "\n";
        text += "State: " + this.state + "\n";
        text += "Contains " + this.actionGroups.length + " action groups\n";
        text += this.images.length + " images\n";
        text += this.sprites.length + " sprites\n"; 
        return text;
    }

    listSprites(verbose = true) {
        let text = verbose ? "Sprites in Scene " + this.spriteScene + "\n" : "";
        for (let i = 0; i < this.sprites.length; i++ ) {
            const sprite = this.sprites[i];
            if (verbose) {
                const x = sprite.locX.value();
                const y = sprite.locY.value();
                const z = sprite.depth;
                text += `${sprite.name} (${sprite.type}) `;
                text += sprite.visible ? "visible" : "hidden";
                text += ` at ${x} ${y} ${z}\n`;
                const sx = sprite.sizeX.value();
                const sy = sprite.sizeY.value();
                text += `size ${sx} x ${sy} `;
                if (sprite.sgParent) {
                    text += `child of ${sprite.sgParent.name}`;
                }
                text += "\n";
            } else {
                text += `${sprite.name} `;
            }
        }
        return text;
    }

    listImages(verbose = true) {
        let text = verbose ? "Images in Scene " + this.spriteScene + "\n" : "";
        for (let i = 0; i < this.images.length; i++ ) {
            const image = this.images[i];
            if (verbose) {
                const width = this.images[i].piImage.width;
                const height = this.images[i].piImage.height;
                text += `Name ${image.name} `;
                text += image.loading ? "loaded" : "loading";
                text += ` from ${image.url}\n`;
                text += `Width: ${width} Height: ${height}\n`;
            } else {
                text += `${image.name} `;
            }
        }
        return text;
    }


    stop(reset = false) {
        this.state  = constants.SCENE_STOPPED;
        this.parameters = defaults.NOTFOUND;
        this.actionGroups = [];
        // delete all sprites
        for (let i = 0; i < this.sprites; i++) {
            const sgSprite = this.sprites[i];
            if (sgSprite.piSprite != null) { // Pixi sprite exists
                sgSprite.piSprite.destroy();
            }
        }
        this.sprites = [];
        // Do we want to go back to an unused state?
        if (reset) {
            this.reset();
        }
        if (this.completionCallback != null) {
            this.completionCallback();
            this.completionCallback = null;
        }
    }

    pause() {
        if (this.state == constants.SCENE_RUNNING) {
            this.state = constants.SCENE_PAUSED;
        }
        // not an error to pause a stopped or already paused scene
    }

    resume() {
        if (this.state == constants.SCENE_PAUSED) {
            this.state = constants.SCENE_RUNNING;
        }
        // not an error to resume a running or stopped scene
    }


/**************************************************************************************************

    ######  ########    ###    ########  ########   ### ###   
   ##    ##    ##      ## ##   ##     ##    ##     ##     ##  
   ##          ##     ##   ##  ##     ##    ##    ##       ## 
    ######     ##    ##     ## ########     ##    ##       ## 
         ##    ##    ######### ##   ##      ##    ##       ## 
   ##    ##    ##    ##     ## ##    ##     ##     ##     ##  
    ######     ##    ##     ## ##     ##    ##      ### ###   

**************************************************************************************************/

    start(parameters) {
        if (this.state != constants.SCENE_STOPPED) {
            return;
        } // not necessarily an error
        this.actionGroups = [];
        this.parameters = parameters;
        let actionGroup = new Utils.ActionGroup();
        let state = "T";
        let timestamp = Date.now(); // Use same timestamp for all
        for (let i = 0; i < this.content.length; i++) {
            let trigger = null;
            const lineNo = this.content[i].number;
            const wordList = new WordList(this.content[i].text);
            const keyword = wordList.getWord();
            // First look for triggers
            switch(keyword.toLowerCase()) {
                case 'when':
                    const allOrAny = wordList.testWord(["all","any"]);
                    if (allOrAny == "all") {
                        actionGroup.any_trigger = false;
                    } else if (allOrAny == false) {
                        Globals.log.error("Unknown when condition - ");
                    } // else this is the default
                    continue;  // go to the next line
                case 'do':
                    // syntactic sugar, marks beginning of actions
                    continue;
                case 'begin':
                    trigger = new Triggers.Begin(this, timestamp, "");
                    break;
                case 'end':
                    trigger = new Triggers.Trigger("ATEND", "");
                    break;
                case 'after':
                    trigger = new Triggers.After(this, timestamp, wordList.joinWords());
                    break;
                case 'on':
                    let on_word = wordList.getWord();
                    switch (on_word) {
                        case 'key':
                            wordList.testWord("press");
                            trigger = new Triggers.Trigger("ONKEY", wordList.joinWords());
                            break;
                        case 'keypress':
                            trigger = new Triggers.Trigger("ONKEY", wordList.joinWords());
                            break;
                        case 'mouse':
                            wordList.testWord("click");
                            trigger = new Triggers.Trigger("MOUSECLICK", wordList.joinWords());
                            break;
                        default:
                            Globals.log.error("Unknown trigger type on " + on_word + " at line " + lineNo);
                            break;
                        }
                    break;
                case 'at':
                    wordList.testWord("time");
                    trigger = new Triggers.AtClass(this, timestamp, wordList.joinWords());
                    break;
                case 'each':
                    wordList.testWord("time");
                    trigger = new Triggers.Each(this, timestamp, wordList.joinWords());
                    break;
                case 'then':
                    if (state == "T") {
                        Globals.log.error("Then must be the only trigger in that group");
                    } else {
                        // we trigger on the current action, as then will start a new one
                        trigger = new Triggers.ThenClass(this, timestamp, wordList.joinWords(), actionGroup);
                    }
                    break;
                case 'every':
                    trigger = new Triggers.Every(this, timestamp, wordList.joinWords());
                    break;
                case 'triggers':
                case 'trigger':
                    // syntactic sugar, just move on to the next line
                    continue;
                case 'action':
                case 'actions':
                    // syntactic sugar, just move on to the next line
                    continue;
                default:
                    // not an error, just not a trigger
                    break;
            }
            if (trigger !== null) {
                if (state == "T") { // another trigger in the same group
                    actionGroup.addTrigger(trigger);
                } else { // this is a new action group
                    this.actionGroups.push(actionGroup);
                    actionGroup = new Utils.ActionGroup();
                    actionGroup.addTrigger(trigger);
                    state = "T";
                }
                continue;
            }
            state = "A";
            // not a trigger, must be an action
            if (actionGroup.triggers.length < 1) {
                Globals.log.error("No trigger for action in scene " + this.name + " at line " + lineNo);
            }
            actionGroup.addAction(this.content[i]);
        }
        this.actionGroups.push(actionGroup);
        this.state = constants.SCENE_RUNNING;
    }

/**************************************************************************************************

   ########  ##     ## ##    ##  ######   ########   #######  ##     ## ########  
   ##     ## ##     ## ###   ## ##    ##  ##     ## ##     ## ##     ## ##     ## 
   ##     ## ##     ## ####  ## ##        ##     ## ##     ## ##     ## ##     ## 
   ########  ##     ## ## ## ## ##   #### ########  ##     ## ##     ## ########  
   ##   ##   ##     ## ##  #### ##    ##  ##   ##   ##     ## ##     ## ##        
   ##    ##  ##     ## ##   ### ##    ##  ##    ##  ##     ## ##     ## ##        
   ##     ##  #######  ##    ##  ######   ##     ##  #######   #######  ##        

**************************************************************************************************/

    runGroup(index, now) {
        let actionGroup = this.actionGroups[index];
        actionGroup.resetUnfinishedt();
        let actions = actionGroup.actions;
        actionGroup.nextAction = 0; // start at the top
        do {
            this.runAction(actionGroup.nextAction, actionGroup, now);
        } while (actionGroup.nextAction < actions.length );
    }


/**************************************************************************************************

   ########  ##     ## ##    ##    ###     ######  ######## ####  #######  ##    ## 
   ##     ## ##     ## ###   ##   ## ##   ##    ##    ##     ##  ##     ## ###   ## 
   ##     ## ##     ## ####  ##  ##   ##  ##          ##     ##  ##     ## ####  ## 
   ########  ##     ## ## ## ## ##     ## ##          ##     ##  ##     ## ## ## ## 
   ##   ##   ##     ## ##  #### ######### ##          ##     ##  ##     ## ##  #### 
   ##    ##  ##     ## ##   ### ##     ## ##    ##    ##     ##  ##     ## ##   ### 
   ##     ##  #######  ##    ## ##     ##  ######     ##    ####  #######  ##    ## 

**************************************************************************************************/


    runAction(actionIndex, actionGroup, now) {
        const action = actionGroup.actions[actionIndex];
        // assume that the next action will be the next line
        actionGroup.nextAction += 1; // might be overwritten by the actual action, below
        // remove initial "and" (just syntactic sugar)
        if (actionGroup.failedIfCount > 0) { // failed if condition, don't bother running
            // except to look for endif // if *WITHOUT* expanding any items, so special parse
            const special = action.text.match(/^[^a-z]*(if|endif)/);
            if (special && special[1] == "endif") {
                actionGroup.failedIfCount -=1; // jump out this level
            } else if (special && special[1] == "if") {
                actionGroup.failedIfCount +=1; // jump into another level
            }
            return;
        }
        const expandedText = this.varList.expandVars(action.text);
        const evaluatedText = Utils.evaluate(expandedText);
        if (this.echo) {
            Globals.log.report("> " + evaluatedText);
        }
        const wordList = new WordList(evaluatedText);
        wordList.testWord("and");
        let command = wordList.getWord().toLowerCase();

/**************************************************************************************************

    ######  ######## ######## 
   ##    ## ##          ##    
   ##       ##          ##    
    ######  ######      ##    
         ## ##          ##    
   ##    ## ##          ##    
    ######  ########    ##    

**************************************************************************************************/

        // convert "set X" to the appropriate single word command
        // if (command == "set" && wordList.wordsLeft() > 1) {
        //     switch(words[0]) {
        //         case "trans":
        //         case "transparency":
        //         case "fade":
        //             words.shift();
        //             wordList.testWord( "of");
        //             command = "fade";
        //             break;
        //         case "speed":
        //             words.shift();
        //             wordList.testWord( "of");
        //             command = "speed";
        //             break;
        //         case "position":
        //         case "pos":
        //             words.shift();
        //             wordList.testWord( "of");
        //             command = "move";
        //             break;
        //         case "volume":
        //             words.shift();
        //             wordList.testWord( "to");
        //             command = "volume"
        //             break;
        //         case "blur":
        //         case "fuzz":
        //             words.shift();
        //             wordList.testWord( "of");
        //             command = "blur"
        //             break;
        //         case "darkness":
        //             words.shift();
        //             wordList.testWord( "of");
        //             command = "darken";
        //             break;
        //         case "lightness":
        //             words.shift();
        //             wordList.testWord( "of");
        //             command = "lighten";
        //             break;
        //         case "tint":
        //             words.shift();
        //             wordList.testWord( "of");
        //             command = "tint";
        //             break;
        //         default: // means the same as make
        //             command = "make";
        //             break;
        //     }
        // }

/**************************************************************************************************

    ######  ########  ########    ###    ######## ######## 
   ##    ## ##     ## ##         ## ##      ##    ##       
   ##       ##     ## ##        ##   ##     ##    ##       
   ##       ########  ######   ##     ##    ##    ######   
   ##       ##   ##   ##       #########    ##    ##       
   ##    ## ##    ##  ##       ##     ##    ##    ##       
    ######  ##     ## ######## ##     ##    ##    ######## 

**************************************************************************************************/

        // convert "create X" to the appropriate single word command
        // if (command == "create" && wordList.wordsLeft() > 1) {
        //     switch(words[0]) {
        //         case "text":
        //             command = "text";
        //             words[0] = "create";
        //             break;
        //         case "sprite":
        //             words.shift();
        //             command = "sprite";
        //             words[0] = "create";
        //             break;
        //         case "group":
        //             words.shift();
        //             command = "group";
        //             words[0] = "create";
        //             break;
        //         case "graphic":
        //         case "shape":
        //             words.shift();
        //             command = "shape";
        //             words[0] = "create";
        //             break;
        //         default:
        //             break;
        //     }
        // }

        switch(command) {

/**************************************************************************************************

########  ######  ##     ##  #######  
##       ##    ## ##     ## ##     ## 
##       ##       ##     ## ##     ## 
######   ##       ######### ##     ## 
##       ##       ##     ## ##     ## 
##       ##    ## ##     ## ##     ## 
########  ######  ##     ##  #######  

**************************************************************************************************/

            case "echo":
                const request = wordList.getWord("flip");
                switch (request) {
                    case "flip":
                        this.echo = !this.echo;
                        break;
                    case "on":
                        this.echo = true;
                        break;
                    case "off":
                        this.echo = false;
                        break;
                }
                break;

            case "debug":
                const thisLevel = wordList.getInt(0);
                const targetLevel = this.varList.getValue("_MAIN_:DEBUG_LEVEL",false);
                if (targetLevel != defaults.NOTFOUND && thisLevel >= targetLevel) {
                    Globals.log.report(wordList.joinWords());
                }
                break;

            case "log":
            case "print":
                Globals.log.report(wordList.joinWords());
                break;

/**************************************************************************************************

##        #######     ###    ########  
##       ##     ##   ## ##   ##     ## 
##       ##     ##  ##   ##  ##     ## 
##       ##     ## ##     ## ##     ## 
##       ##     ## ######### ##     ## 
##       ##     ## ##     ## ##     ## 
########  #######  ##     ## ########  

**************************************************************************************************/

            case "load":
            case "upload":
                let tag = null;
                // Look for a filename
                if (wordList.wordsLeft() < 1) {
                    Globals.log.error("Missing filename" + " at line " + action.number);
                    break;
                }
                let filename = wordList.getWord();
                // look for a tag
                wordList.testWord(["named", "as"]);
                if (wordList.wordsLeft() > 0) {
                    tag = wordList.getWord();
                } else { // use file basename as tag
                    let slash = filename.lastIndexOf('/');
                    let dot = filename.lastIndexOf('.');
                    tag = filename.slice(slash, dot);
                }
                // later - look for split cols by rows for animations

                // check if resource already loaded (don't reload)
                for ( let j = 0; j < this.images.length; j++) {
                    if (this.images[j].tag == tag) {
                        continue; // move on to next action
                    }
                }
                // determine file type
                if (filename.endsWith(".jpg") ||
                    filename.endsWith(".jpeg") ||
                    filename.endsWith(".png")) {
                    const sg_image = new SGImage(this.folder + filename, tag);
                    this.images.push(sg_image);
                    sg_image.load_image();
                } else if (filename.endsWith(".wav") ||
                    filename.endsWith(".mp3")) {
                    AudioManager.create(tag, this.folder + filename);
                } // else check for other resource types
                break;

/**************************************************************************************************

######## ########   #######  ##     ## 
##       ##     ## ##     ## ###   ### 
##       ##     ## ##     ## #### #### 
######   ########  ##     ## ## ### ## 
##       ##   ##   ##     ## ##     ## 
##       ##    ##  ##     ## ##     ## 
##       ##     ##  #######  ##     ## 

**************************************************************************************************/

            case "from":
            case "using":
                if (wordList.wordsLeft() > 0) {
                    this.folder = wordList.getWord() + "/";
                } else {
                    Globals.log.error("Expected folder name at " + action.number);
                }
                break;

/**************************************************************************************************

   ##      ## #### ######## ##     ## 
   ##  ##  ##  ##     ##    ##     ## 
   ##  ##  ##  ##     ##    ##     ## 
   ##  ##  ##  ##     ##    ######### 
   ##  ##  ##  ##     ##    ##     ## 
   ##  ##  ##  ##     ##    ##     ## 
    ###  ###  ####    ##    ##     ## 

**************************************************************************************************/

            case "with":
                if (wordList.wordsLeft() > 0) {
                    this.spriteScene = wordList.getWord();
                } else {
                    Globals.log.error("Expected folder name at " + action.number);
                }
                break;

/**************************************************************************************************

   ########  ########  ######  ######## ######## 
   ##     ## ##       ##    ## ##          ##    
   ##     ## ##       ##       ##          ##    
   ########  ######    ######  ######      ##    
   ##   ##   ##             ## ##          ##    
   ##    ##  ##       ##    ## ##          ##    
   ##     ## ########  ######  ########    ##    

**************************************************************************************************/

            case "reset":
                {
                    const reset_type = wordList.testWord(["sprite","scene","from","with"], "scene");
                    if (reset_type == "sprite") {
                        if (wordList.wordsLeft() > 0) {
                            let spriteName = wordList.getWord();
                            let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                            if (!sgSprite) { break; }
                            sgSprite.resetsize(); // go back to original size
                            sgSprite.jiggle(0,0,0,0);  // stop jiggling
                            sg_spitre.flicker(0); // stop flickering
                            sgSprite.blink(0,0); // stop blinking (makes invisible)
                            sgSprite.pulse(0); // Also sets transparency
                            sgSprite.flip("r"); // go back to original orientation
                            sgSprite.setTint("stop"); // original colour
                            sgSprite.setBlur(0); // unblur
                            sg_spriet.setSkew(0,0); // unskew
                            // sgSprite.setTransparency(100); // solid, but already done
                            sgSprite.rotate("to",0,"in"); // upright
                            // we do not change the position or the depth, stop any movement
                        } else {
                            Globals.log.error("Missing sprite name at line " + action.number);
                        }
                    } else if (reset_type == "scene") {
                        let sceneName = this.name;
                        if (wordList.wordsLeft() > 0) {
                            let sceneName = wordList.getWord();
                        }
                        const scene = Scene.find(sceneName);
                        if (scene != false) {
                            scene.stop(true);
                        } else {
                            Globals.log.error("Scene not found at line " + action.number);
                        }
                    } else if (reset_type == "from") {
                        this.folder = "";
                    } else if (reset_type == "with") {
                        this.defaultScene = this.name;
                    }
                }
                break;

/**************************************************************************************************

    ######  ########  ########  #### ######## ######## 
   ##    ## ##     ## ##     ##  ##     ##    ##       
   ##       ##     ## ##     ##  ##     ##    ##       
    ######  ########  ########   ##     ##    ######   
         ## ##        ##   ##    ##     ##    ##       
   ##    ## ##        ##    ##   ##     ##    ##       
    ######  ##        ##     ## ####    ##    ######## 

**************************************************************************************************/

            case "sprite":
                if (wordList.wordsLeft() > 0) {
                    const sprite_command = wordList.getWord();
                    switch (sprite_command) {
                        // more to add here?
                        case "create":
                            {
                                let spriteName = false;
                                let groupName = null;
                                // should the sprite have a different tag?
                                if (wordList.testWord("named") || !wordList.testWord("from"))  {
                                    spriteName = wordList.getWord();
                                }
                                // Are we adding this to a group?
                                const groupSprite = wordList.getGroup(this.spriteScene);
                                wordList.testWord("from");
                                // which (already loaded) image to use?
                                let imageName = wordList.getWord();
                                if (!spriteName) {
                                    spriteName = imageName;
                                }
                                let sgSprite = new SGSprite(imageName, spriteName);
                                if (groupSprite) {
                                    sgSprite.sgParent = groupSprite;
                                }
                                if (wordList.testWord("view")) {
                                    const x = wordList.getInt(0);
                                    const y = wordList.getInt(0);
                                    const w = wordList.getInt(0);
                                    const h = wordList.getInt(0);
                                    if (w > 0 && h > 0) {
                                        sgSprite.setView(x, y, w, h, "in", 0, now, null);
                                        sgSprite.sizeX.setTargetValue(w);
                                        sgSprite.sizeY.setTargetValue(h);
                                    }
                                }
                                sgSprite.setVisibility(false);
                                this.sprites.push(sgSprite);
                            }
                            break;
                        default:
                            Globals.log.error("Unknown sprite command at line " + action.number);
                        }
                } else {
                    Globals.log.error("Missing sprite data at line " + action.number);
                }
                break;

/**************************************************************************************************

   ##     ## #### ######## ##      ## 
   ##     ##  ##  ##       ##  ##  ## 
   ##     ##  ##  ##       ##  ##  ## 
   ##     ##  ##  ######   ##  ##  ## 
    ##   ##   ##  ##       ##  ##  ## 
     ## ##    ##  ##       ##  ##  ## 
      ###    #### ########  ###  ###  

**************************************************************************************************/

            case "view":
                if (wordList.wordsLeft() > 0) {
                    let spriteName = wordList.getWord();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) {
                        break;
                    }
                    wordList.testWord("to");
                    const x = wordList.getInt(0);
                    const y = wordList.getInt(0);
                    const w = wordList.getInt(0);
                    const h = wordList.getInt(0);
                    let inOrAt = wordList.testWord( ["in","at"], "in");
                    let duration = wordList.getDuration(0);
                    if (w > 0 && h > 0) {
                        sgSprite.setView(x, y, w, h, inOrAt, duration, now, 
                            Utils.makeCompletionCallback(actionGroup));
                    } else {
                        Globals.log.error("Not sensible view data" + " at line " + action.number);
                    }
                } else {
                    Globals.log.error("Missing view data" + " at line " + action.number);
                }
                break;

/**************************************************************************************************

########  ##          ###     ######  ######## 
##     ## ##         ## ##   ##    ## ##       
##     ## ##        ##   ##  ##       ##       
########  ##       ##     ## ##       ######   
##        ##       ######### ##       ##       
##        ##       ##     ## ##    ## ##       
##        ######## ##     ##  ######  ######## 

**************************************************************************************************/

            case "place":
                if (wordList.wordsLeft() > 0) {
                    let spriteName = wordList.getWord();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) {
                        break;
                    }
                    const hidden = wordList.testWord("hidden");
                    // is there a location for the sprite?
                    wordList.testWord( "at");
                    if (wordList.testWord(["center","centre"])) {
                        sgSprite.locX.setTargetValue(Globals.app.screen.width / 2);
                        sgSprite.locY.setTargetValue(Globals.app.screen.height / 2);
                    } else {
                        sgSprite.locX.setTargetValue(wordList.getInt(0) * Globals.scriptScaleX);
                        sgSprite.locY.setTargetValue(wordList.getInt(0) * Globals.scriptScaleY);
                    }
                    // is there a depth provided?
                    wordList.testWord("depth");
                    sgSprite.setDepth("to", wordList.getInt(0));
                    // is there a size? (or just use image size)
                    wordList.testWord( ["size","scale"]); // separate these?
                    let width = wordList.getInt(0);
                    let height = wordList.getInt(0);
                    if (height < 1 && width > 1) { // scale to given height
                        height = (sgSprite.piSprite.texture.height / sgSprite.piSprite.texture.width) * width;
                    } else if (width < 1 && height > 1) {
                        width = (sgSprite.piSprite.texture.width / sgSprite.piSprite.texture.height) * height;
                    }
                    if (width > 0 && height > 0) {
                        sgSprite.sizeX.setTargetValue(width * Globals.scriptScaleX);
                        sgSprite.sizeY.setTargetValue(height * Globals.scriptScaleY);
                    }
                    // Got all the data, now create the sprite
                    if (!hidden) {
                        sgSprite.setVisibility(true);
                    }
                    if (sgSprite.sgParent) { // is this part of a group?
                        // Get the new group size
                        sgSprite.sgParent.sizeX.forceValue(sgSprite.sgParent.piSprite.width);
                        sgSprite.sgParent.sizeY.forceValue(sgSprite.sgParent.piSprite.height);
                    }
                } else {
                    Globals.log.error("Missing place data" + " at line " + action.number);
                }
                break;

/**************************************************************************************************

########  ######## ########  ##          ###     ######  ######## 
##     ## ##       ##     ## ##         ## ##   ##    ## ##       
##     ## ##       ##     ## ##        ##   ##  ##       ##       
########  ######   ########  ##       ##     ## ##       ######   
##   ##   ##       ##        ##       ######### ##       ##       
##    ##  ##       ##        ##       ##     ## ##    ## ##       
##     ## ######## ##        ######## ##     ##  ######  ######## 

**************************************************************************************************/

            case "replace":
                if (wordList.wordsLeft() > 0) {
                    // which (already loaded) image to use?
                    let spriteName = wordList.getWord();
                    wordList.testWord("with");
                    let imageName = wordList.getWord();
                    let hidden = wordList.testWord("hidden");
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { break; }
                    if (hidden) {
                        sgSprite.setVisibility(false);
                    }
                    // set the new image and delete existing texture
                    // (will be picked up in the next  update)
                    sgSprite.imageName = imageName;
                    sgSprite.piSprite.texture = PIXI.Texture.EMPTY;
                } else {
                    Globals.log.error("Missing replace data" + " at line " + action.number);
                }
                break;

/**************************************************************************************************

########  ##     ## ######## 
##     ## ##     ##    ##    
##     ## ##     ##    ##    
########  ##     ##    ##    
##        ##     ##    ##    
##        ##     ##    ##    
##         #######     ##    

**************************************************************************************************/

            case "put":
            case "use":
                if (wordList.wordsLeft() > 0) {
                    // which (already loaded) image to use?
                    let imageName = wordList.getWord();
                    let spriteName = null;
                    // should the sprite have a different tag?
                    if (wordList.testWord("named")) {
                        spriteName = wordList.getWord(imageName);
                    }
                    wordList.testWord(["as","at"]);
                    let role = wordList.testWord(["background","backdrop","top","bottom","left",
                            "right","ground","sky","foreground","frame"]);
                    // resolve synonyms
                    // switch(role) {
                    //     case "background":
                    //         role = "backdrop";
                    //         break;
                    //     case "top":
                    //         role = "sky";
                    //         break;
                    //     default: // everything else is fine
                    //         break;
                    // }
                    if (role == false) {
                        Globals.log.error("Unknown role " + role + " at line " + action.number);
                        break;
                    } // else 
                    if ( spriteName == null ) {
                        spriteName = role;
                    }
                    let sgSprite = new SGSprite(imageName, spriteName);
                    sgSprite.role = role;
                    wordList.testWord(["as","at"]);
                    if (wordList.testWord("depth")) {
                        sgSprite.depth = wordList.getInt(0);
                    } else {
                        sgSprite.depth = null; // let the system set it instead
                    }
                    // can't set any other properties until we know the image size, so quit for now
                    this.sprites.push(sgSprite);
                } else {
                        Globals.log.error("Missing put data" + " at line " + action.number);
                }
                break;

/**************************************************************************************************

    ######   ########   #######  ##     ## ########  
   ##    ##  ##     ## ##     ## ##     ## ##     ## 
   ##        ##     ## ##     ## ##     ## ##     ## 
   ##   #### ########  ##     ## ##     ## ########  
   ##    ##  ##   ##   ##     ## ##     ## ##        
   ##    ##  ##    ##  ##     ## ##     ## ##        
    ######   ##     ##  #######   #######  ##        

**************************************************************************************************/

            case "group":
                if (wordList.wordsLeft() > 0) {
                    switch (wordList.getWord()) {
                        // more to add here?
                        case "create":
                            {
                                wordList.testWord("named");
                                const groupName = wordList.getWord();
                                if (SGSprite.getSprite(this.spriteScene, groupName, false)) {
                                    break; // already exists, but not an error
                                } 
                                const sgSprite = new SGSprite(null, groupName, constants.SPRITE_GROUP);
                                const group = new PIXI.Container();
                                const superGroupSprite = wordList.getGroup(this.spriteScene);
                                wordList.testWord("size");
                                const width = wordList.getInt(0);
                                const height = wordList.getInt(0);
                                if (width > 0 && height > 0) {
                                    sgSprite.sizeX.setTargetValue(width);
                                    sgSprite.sizeY.setTargetValue(height);
                                    group.pivot.set(width / 2, height / 2);
                                } else if (superGroupSprite) { // use parent's size
                                    const parentWidth = superGroupSprite.sizeX;
                                    const parentHeight = superGroupSprite.sizeY;
                                    sgSprite.sizeX.setTargetValue(parentWidth);
                                    sgSprite.sizeY.setTargetValue(parentHeight);
                                    group.pivot.set(parentWidth / 2, parentHeight / 2);
                                } else {
                                    group.pivot.set(Globals.displayWidth / 2, Globals.displayHeight / 2);
                                }
                                sgSprite.depth = Globals.nextZ(0);
                                group.zIndex = sgSprite.depth;
                                // this group goes on top for now...
                                if (superGroupSprite) {
                                    sgSprite.sgParent = superGroupSprite;
                                    superGroupSprite.piSprite.addChild(group);
                                } else {
                                    Globals.root.addChild(group);
                                }
                                sgSprite.piSprite = group;
                                sgSprite.setVisibility(false);
                                // sgSprite.locX.forceValue(Globals.displayWidth / 2); 
                                // sgSprite.locY.forceValue(Globals.displayHeight / 2);
                                sgSprite.locX.forceValue(0); 
                                sgSprite.locY.forceValue(0);
                                this.sprites.push(sgSprite);                           
                            }
                            break;
                        case "add":
                            {
                                const spriteName = wordList.getWord();
                                const sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                                if (!sgSprite) {
                                    break;
                                }
                                const groupSprite = wordList.getGroup(this.spriteScene);
                                if (!groupSprite) {
                                    break;
                                }
                                sgSprite.sgParent = groupSprite;
                                groupSprite.piSprite.reparentChild(sgSprite.piSprite);
                                // Get the new group size
                                sgSprite.sizeX.forceValue(groupSprite.width);
                                sgSprite.sizeY.forceValue(groupSprite.height);
                                break;
                            }
                        default:
                            Globals.log.error("Unknown group command at line " + action.number);
                        }
                } else {
                    Globals.log.error("Missing group data at line " + action.number);
                }
                break;

/**************************************************************************************************

########  ##          ###    ##    ## 
##     ## ##         ## ##    ##  ##  
##     ## ##        ##   ##    ####   
########  ##       ##     ##    ##    
##        ##       #########    ##    
##        ##       ##     ##    ##    
##        ######## ##     ##    ##    

**************************************************************************************************/

            case "play":
                if (wordList.wordsLeft() > 0) {
                    const resourceName = wordList.getWord();
                    wordList.testWord("fade");
                    wordList.testWord("in");
                    const fadein = wordList.getDuration(0);
                    wordList.testWord("at");
                    wordList.testWord("volume");
                    const volume = wordList.getInt( 50, defaults.VOLUME_MIN, defaults.VOLUME_MAX);
                    AudioManager.play(resourceName, { fadeInMs: fadein * 1000, targetVolume: volume });
                } else {
                    Globals.log.error("Nothing to play at line " + action.number);
                }
                break;


/**************************************************************************************************

   ##     ##  #######  ##       ##     ## ##     ## ######## 
   ##     ## ##     ## ##       ##     ## ###   ### ##       
   ##     ## ##     ## ##       ##     ## #### #### ##       
   ##     ## ##     ## ##       ##     ## ## ### ## ######   
    ##   ##  ##     ## ##       ##     ## ##     ## ##       
     ## ##   ##     ## ##       ##     ## ##     ## ##       
      ###     #######  ########  #######  ##     ## ######## 

**************************************************************************************************/


            case "volume":
                if (wordList.wordsLeft() > 0) {
                    wordList.testWord("of");
                    const resourceName = wordList.getWord();
                    wordList.testWord("to");
                    const volume = wordList.getInt( 0, defaults.VOLUME_MIN, defaults.VOLUME_MAX);
                    const fadein = wordList.getDuration(0);
                    AudioManager.setVolume(resourceName, volume, { fadeMs: fadein * 1000});
                } else {
                    Globals.log.error("No volume change at line " + action.number);
                }
                break;

/**************************************************************************************************

   ######## ######## ##     ## ######## 
      ##    ##        ##   ##     ##    
      ##    ##         ## ##      ##    
      ##    ######      ###       ##    
      ##    ##         ## ##      ##    
      ##    ##        ##   ##     ##    
      ##    ######## ##     ##    ##    

**************************************************************************************************/

            case "text":
                if (wordList.wordsLeft() > 2) {
                    let groupName = null;
                    const textCommand = wordList.getWord();
                    const textName = wordList.getWord();
                    // Are we adding this to a group?
                    const groupSprite = wordList.getGroup(this.spriteScene);
                    const textData = wordList.joinWords();
                    let sgSprite = null;
                    if (textCommand == "create") {
                        sgSprite = new SGSprite(null, textName, constants.SPRITE_TEXT);
                        const textSprite = new PIXI.Text({
                            text: textData,
                                style: {
                                fontFamily: sgSprite.textFont,
                                fontSize: sgSprite.textFont,
                                fill: sgSprite.fillColour,
                                align: sgSprite.textAlign,
                            }
                        });
                        sgSprite.piSprite = textSprite;
                        sgSprite.piSprite.anchor = 0.5;
                        sgSprite.setVisibility(false);
                        sgSprite.sizeX.setTargetValue(textSprite.width);
                        sgSprite.sizeY.setTargetValue(textSprite.height);
                        if (groupSprite) {
                            sgSprite.sgParent = groupSprite;
                            groupSprite.piSprite.addChild(graphic);
                        } else {
                            Globals.root.addChild(textSprite);
                        }
                        this.sprites.push(sgSprite);
                        break;
                    } // else
                    sgSprite = SGSprite.getSprite(this.spriteScene, textName);
                    if (sgSprite.type != constants.SPRITE_TEXT) {
                        Globals.log.error("Sprite is not text at " + action.number);
                        break;
                    }
                    let doUpdate = true;
                    switch(textCommand) {
                        case "font":
                        case "fontfamily":
                            sgSprite.textFont = textData;
                            break;
                        case "fontsize":
                        case "size":
                            sgSprite.textFont = textData;
                            break;
                        case "align":
                            sgSprite.textAlign = textData;
                            break;
                        case "color":
                        case "colour":
                            sgSprite.fillColour = textData;
                            sgSprite.strokeColour = textData;
                            break;
                        case "fill":
                            sgSprite.fillColour = textData;
                            break;
                        case "stroke":
                            sgSprite.strokeColour = textData;
                            break;
                        case "add":
                           sgSprite.piSprite.text += "\n" + textData;
                           break;
                        case "replace":
                           sgSprite.piSprite.text = textData;
                           break;
                        default:
                            doUpdate = false;
                            Globals.log.error("Unknown text command at " + action.number);
                            break;
                        }
                        if (doUpdate) {
                            sgSprite.setStyle();
                            sgSprite.sizeX.setTargetValue(sgSprite.piSprite.width);
                            sgSprite.sizeY.setTargetValue(sgSprite.piSprite.height);
                        }
                } else {
                    Globals.log.error("Missing argument at line " + action.number);
                }
                break;

/**************************************************************************************************

    ######   ########     ###    ########  ##     ## ####  ######  
   ##    ##  ##     ##   ## ##   ##     ## ##     ##  ##  ##    ## 
   ##        ##     ##  ##   ##  ##     ## ##     ##  ##  ##       
   ##   #### ########  ##     ## ########  #########  ##  ##       
   ##    ##  ##   ##   ######### ##        ##     ##  ##  ##       
   ##    ##  ##    ##  ##     ## ##        ##     ##  ##  ##    ## 
    ######   ##     ## ##     ## ##        ##     ## ####  ######  

**************************************************************************************************/

            case "graphic":
            case "shape":
                if (wordList.wordsLeft() > 1) {
                    const graphicCommand = wordList.getWord();
                    switch (graphicCommand) {
                        case"create":
                            {
                                const graphicTag = wordList.getWord();
                                // Are we adding this to a group?
                                const groupSprite = wordList.getGroup(this.spriteScene);
                                wordList.testWord("as");
                                const graphicType = wordList.getWord();
                                let graphic = null;
                                switch (graphicType) {
                                    case "rectangle":
                                    case "rect": 
                                        {
                                            const w = wordList.getInt(0);
                                            const h = wordList.getInt(w);
                                            const r = wordList.getInt(0);
                                            if (w > 0 && h > 0) {
                                                if (r > 0) {
                                                    graphic = new PIXI.Graphics().roundRect(w/-2, h/-2, w, h, r);
                                                } else {
                                                    graphic = new PIXI.Graphics().rect(w/-2, h/-2, w, h);
                                                }
                                            }
                                        }
                                        break;
                                    case "circle":
                                        {
                                            const r = wordList.getInt(0);
                                            if (r > 0) {
                                                graphic = new PIXI.Graphics().circle(0, 0, r);
                                            }
                                        }
                                        break;
                                    case "line":
                                        {
                                            const r = wordList.getInt(0);
                                            if (r > 0) {
                                                graphic = new PIXI.Graphics().moveTo(l / -2, 0).lineTo(l/2, 0);
                                            }
                                        }
                                        break;                               
                                    case "ellipse":
                                        {
                                            const w = wordList.getInt(0);
                                            const h = wordList.getInt(w);
                                            if (w > 0 && h > 0) {
                                                graphic = new PIXI.Graphics().ellipse(w/-2, h/-2, w, h);
                                            }
                                        }
                                        break;
                                    case "star":
                                        {
                                            const p = wordList.getInt(0);
                                            const ro = wordList.getInt(0);
                                            let ri = wordList.getInt(0);
                                            if (ri > ro) {
                                                ri = 0;
                                            }
                                            if (p > 2 && r0 > 0) {
                                                if (ri > 0) {
                                                    graphic = new PIXI.Graphics().star(0, 0, p, ro, ri);
                                                } else {
                                                    graphic = new PIXI.Graphics().star(0, 0, p, ro);
                                                }
                                            }
                                        }
                                        break;
                                    case "grid":
                                        {
                                            const x = wordList.getInt(100);
                                            const y = wordList.getInt( x);
                                            graphic = new PIXI.Graphics();
                                            const width = Globals.app.screen.width;
                                            const height = Globals.app.screen.height;
                                            if (x > 10 && y > 10) {
                                                for ( let i = (width / -2 ) + x; i < width / 2; i += x ) {
                                                    graphic.moveTo(i,height / -2).lineTo(i,height / 2);
                                                }
                                                for ( let j = (height / -2) + y; j < height / 2; j += y) {
                                                    graphic.moveTo(width / -2,j).lineTo(width / 2,j);
                                                }
                                            }
                                        }
                                        break;
                                    default:
                                        Globals.log.error("Unknown graphic type at " + action.number);
                                        break;
                                    }
                                    if (graphic != null) {
                                        graphic.fill(this.graphicFill).stroke({width: this.graphicStrokeWidth, color: this.graphicStroke});
                                        const sgSprite = new SGSprite(null, graphicTag, constants.SPRITE_GRAPHIC);
                                        if (groupSprite) {
                                            sgSprite.sgParent = groupSprite
                                            groupSprite.piSprite.addChild(graphic);
                                        } else {
                                            Globals.root.addChild(graphic);
                                        }
                                        sgSprite.piSprite = graphic;
                                        sgSprite.setVisibility(false);
                                        sgSprite.sizeX.setTargetValue(graphic.width);
                                        sgSprite.sizeY.setTargetValue(graphic.height);
                                        this.sprites.push(sgSprite);
                                    } else {
                                        Globals.log.error("Invalid graphic arguments at " + action.number);
                                    }
                                    break;
                                }
                        case "color":
                        case "colour":
                            this.graphicFill = wordList.getWord("black");
                            this.graphicStroke = wordList.getWord("black");
                            break;
                        case "fill":
                            this.graphicFill = wordList.getWord("black");
                            break;
                        case "stroke":
                            if (wordList.testWord("width")) {
                                this.graphicStrokeWidth = wordList.getInt(1);
                            } else {
                                this.graphicStroke = wordList.getWord("black");
                            }
                            break;
                        default:
                            Globals.log.error("Unknown graphics command at " + action.number);
                            break;
                    }
                } else {
                    Globals.log.error("Missing argument at line " + action.number);
                }
                break;

/**************************************************************************************************

##     ##  #######  ##     ## ######## 
###   ### ##     ## ##     ## ##       
#### #### ##     ## ##     ## ##       
## ### ## ##     ## ##     ## ######   
##     ## ##     ##  ##   ##  ##       
##     ## ##     ##   ## ##   ##       
##     ##  #######     ###    ######## 

**************************************************************************************************/

            case "move":
                if (wordList.wordsLeft() > 0) {
                    let spriteName = wordList.getWord();
                    const direction = wordList.testWord(["horizontally","hor","h","vertically","vert","v"]);
                    let delta = 0;
                    let x = 0;
                    let y = 0;
                    let byOrTo = wordList.getWord( ["by","to"]);
                    if (byOrTo === false) {
                        Globals.log.error("Expected by or to on line " + action.number);
                        break;
                    }
                    if (direction !== false) {
                        delta = wordList.getInt(0) * Globals.scriptScaleX;
                    } else {
                        x = wordList.getInt(0) * Globals.scriptScaleX;
                        y = wordList.getInt(0) * Globals.scriptScaleY;
                    }
                    let inOrAt = wordList.testWord( ["in","at"], "in");
                    let duration = wordList.getDuration(0);
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    switch ( direction ) {
                        case "horizontally":
                        case "hor":
                        case "h":
                            sgSprite.move(delta, false, byOrTo, inOrAt, duration, now, Utils.makeCompletionCallback(actionGroup));
                            break;
                        case "vertically":
                        case "vert":
                        case "v":
                            sgSprite.move(false, delta, byOrTo, inOrAt, duration, now, Utils.makeCompletionCallback(actionGroup));
                            break;
                        default:
                            sgSprite.move(x, y, byOrTo, inOrAt, duration, now, Utils.makeCompletionCallback(actionGroup));
                            break;
                    }
                } else {
                    Globals.log.error("Missing move data" + " at line " + action.number);
                }
                break;

/**************************************************************************************************

########  #### ##     ##  #######  ######## 
##     ##  ##  ##     ## ##     ##    ##    
##     ##  ##  ##     ## ##     ##    ##    
########   ##  ##     ## ##     ##    ##    
##         ##   ##   ##  ##     ##    ##    
##         ##    ## ##   ##     ##    ##    
##        ####    ###     #######     ##    

**************************************************************************************************/

            case "pivot":
                if (wordList.wordsLeft() > 0) {
                    let spriteName = wordList.getWord();
                    wordList.testWord(["around","from"]);
                    let x = wordList.getInt(0);
                    let y = wordList.getInt(0);
                    let duration = wordList.getDuration(0);
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) {
                        break;
                    }
                    sgSprite.pivotPoint(x, y, duration, now, Utils.makeCompletionCallback(actionGroup));
                } else {
                    Globals.log.error("Missing pivot data at line " + action.number);
                }
                break;

/**************************************************************************************************

    ######  ########  ######## ######## ########  
   ##    ## ##     ## ##       ##       ##     ## 
   ##       ##     ## ##       ##       ##     ## 
    ######  ########  ######   ######   ##     ## 
         ## ##        ##       ##       ##     ## 
   ##    ## ##        ##       ##       ##     ## 
    ######  ##        ######## ######## ########  

**************************************************************************************************/

            case "speed":
                let spriteName = wordList.getWord();
                wordList.testWord("to");
                let speed = wordList.getInt(0) * Globals.scriptScaleX;
                let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                sgSprite.set_speed(speed);
                // speed change is instantaneous
                break;

/**************************************************************************************************

########     ###    ####  ######  ######## 
##     ##   ## ##    ##  ##    ## ##       
##     ##  ##   ##   ##  ##       ##       
########  ##     ##  ##   ######  ######   
##   ##   #########  ##        ## ##       
##    ##  ##     ##  ##  ##    ## ##       
##     ## ##     ## ####  ######  ######## 

**************************************************************************************************/

            case "raise":
            case "lower":
                if (wordList.wordsLeft() > 0) {
                    let spriteName = wordList.getWord();
                    let depth_type = wordList.getWord( ["to", "by"]);
                    if (depth_type === false) {
                        Globals.log.error("Expected to or by on line " + action.number);
                        break;
                    }
                    let value = wordList.getInt(0);
                    if (command == "lower") {
                        value = -value;
                    }
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (sgSprite) {
                        sgSprite.setDepth(depth_type, value);
                    }
                } else {
                    Globals.log.error("Missing raise/lower data at line " + action.number);
                }
                break;

/**************************************************************************************************

########  ########  ######  #### ######## ######## 
##     ## ##       ##    ##  ##       ##  ##       
##     ## ##       ##        ##      ##   ##       
########  ######    ######   ##     ##    ######   
##   ##   ##             ##  ##    ##     ##       
##    ##  ##       ##    ##  ##   ##      ##       
##     ## ########  ######  #### ######## ######## 

**************************************************************************************************/

            case "resize":
                if (wordList.wordsLeft() > 0) {
                    let spriteName = wordList.getWord();
                    let toOrBy = wordList.getWord( ["to","by", "reset"]);
                    if (toOrBy === false) {
                        Globals.log.error("Expected to or by on line " + action.number);
                        break;
                    }

                    let w = wordList.getInt(0) * Globals.scriptScaleX;
                    let h = wordList.getInt(0) * Globals.scriptScaleY;
                    let inOrAt = wordList.testWord( ["in","at"]);
                    let duration = wordList.getDuration(0);
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    if (toOrBy == "reset") {
                        sgSprite.resetSize();
                    } else {
                        sgSprite.resize( w, h, toOrBy, inOrAt, duration, now,
                            Utils.makeCompletionCallback(actionGroup));
                    }
                } else {
                    Globals.log.error("Missing resize data at line " + action.number);
                }
                break;

/**************************************************************************************************

    ######   ######     ###    ##       ######## 
   ##    ## ##    ##   ## ##   ##       ##       
   ##       ##        ##   ##  ##       ##       
    ######  ##       ##     ## ##       ######   
         ## ##       ######### ##       ##       
   ##    ## ##    ## ##     ## ##       ##       
    ######   ######  ##     ## ######## ######## 

**************************************************************************************************/

            case "scale":
            case "rescale":
            case "shrink":
            case "grow":
                if (wordList.wordsLeft() > 0) {
                    let spriteName = wordList.getWord();
                    const toOrBy = wordList.testWord( ["to", "by", "reset"]);
                    let w = wordList.getInt(0);
                    let h = wordList.getInt(w);
                    let duration = wordList.getDuration(0);
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    if  (toOrBy == "reset") {
                        sgSprite.scaleX.setTargetValue(100);
                        sgSprite.scaleY.setTargetValue(100);
                    } else if (w != 0 || h != 0) {
                        sgSprite.setScale( w, h, command, toOrBy, duration, now,
                            Utils.makeCompletionCallback(actionGroup));
                    } else {
                        Globals.log.error("Invalid scale data at line " + action.number);
                    }
                } else {
                    Globals.log.error("Missing scale data at line " + action.number);
                }
                break;

/**************************************************************************************************

      ###    ##       ####  ######   ##    ## 
     ## ##   ##        ##  ##    ##  ###   ## 
    ##   ##  ##        ##  ##        ####  ## 
   ##     ## ##        ##  ##   #### ## ## ## 
   ######### ##        ##  ##    ##  ##  #### 
   ##     ## ##        ##  ##    ##  ##   ### 
   ##     ## ######## ####  ######   ##    ## 

**************************************************************************************************/

            case "align":
                if (wordList.wordsLeft() > 2) {
                    const spriteName = wordList.getWord();
                    const type = wordList.testWord(["top","bottom","left","right"]);
                    wordList.testWord("to");
                    const location = wordList.getInt(0);
                    const duration = wordList.getDuration(0);
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    let newX = sgSprite.locX.value();
                    let newY = sgSprite.locY.value();
                    const width = sgSprite.sizeX.value() * sgSprite.scaleX.value();
                    const height = sgSprite.sizeY.value() * sgSprite.scaleY.value();
                    switch (type) {
                        case "top":
                            newY = location + (height / 2);
                            break;
                        case "bottom":
                            newY = location - (height / 2);
                            break;
                        case "left":
                            newX = location + (width / 2);
                            break;
                        case "right":
                            newX = location - (width / 2);
                            break;
                        default:
                            Globals.log.error("Unknown alignment at line " + action.number);
                            break;
                    }
                    sgSprite.move(newX, newY, "to", "in", duration, now, 
                            Utils.makeCompletionCallback(actionGroup));
                } else {
                    Globals.log.error("Missing alignment at line " + action.number);
                }
                break;

/**************************************************************************************************

########  ######## ##     ##  #######  ##     ## ######## 
##     ## ##       ###   ### ##     ## ##     ## ##       
##     ## ##       #### #### ##     ## ##     ## ##       
########  ######   ## ### ## ##     ## ##     ## ######   
##   ##   ##       ##     ## ##     ##  ##   ##  ##       
##    ##  ##       ##     ## ##     ##   ## ##   ##       
##     ## ######## ##     ##  #######     ###    ######## 

**************************************************************************************************/

            case "remove":
            case "erase":
            case "delete":
                if (wordList.wordsLeft() > 1) {
                    const type = wordList.testWord(["sprite","audio","sound","var","variable","scene"]);
                    const item = wordList.getWord();
                    switch (type) {
                        case "sprite":
                            SGSprite.remove_sprite(this.spriteScene, item, false);
                            break;
                        case "audio":
                        case "sound":
                            if (AudioManager.exists(item)) {
                                AudioManager.delete(item);
                            }
                            break;
                        case "var":
                        case "variable":
                            this.varList.delete(item, false);
                            break;
                        case "scene":
                            if (item == constants.MAIN_NAME) {
                                Globals.log.error("Cannot delete main scene on line " + action.number);
                            } else {
                                for (let i = 0; i < Globals.scenes.length; i++) {
                                    if (Globals.scenes[i].name == item) { // delete this one
                                        if (Globals.scenes[i].state != constants.SCENE_STOPPED) {
                                            Globals.log.error("Cannot delete running scene on line " + action.number);
                                        } else {
                                            Globals.scenes.splice(i,1);
                                            break;
                                        }
                                    }
                                }
                                // Not an error if scene doesn't exist
                            }
                            break;
                        default:
                            Globals.log.error("Unknown deletion type on line " + action.number);
                            break;
                        }
                } else {
                    Globals.log.error("Nothing to remove at line " + action.number);
                }
                break;

/**************************************************************************************************

########   #######  ########    ###    ######## ######## 
##     ## ##     ##    ##      ## ##      ##    ##       
##     ## ##     ##    ##     ##   ##     ##    ##       
########  ##     ##    ##    ##     ##    ##    ######   
##   ##   ##     ##    ##    #########    ##    ##       
##    ##  ##     ##    ##    ##     ##    ##    ##       
##     ##  #######     ##    ##     ##    ##    ######## 

**************************************************************************************************/

            case "rotate":
            case "turn":
                if (wordList.wordsLeft() > 0) {
                    let spriteName = wordList.getWord();
                    let turn_type = wordList.testWord( ["to","by","at"], "to");
                    let value = wordList.getInt(0);
                    let dur_type = wordList.testWord( ["in", "per"], "in");
                    let duration = wordList.getDuration(0);
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    sgSprite.rotate(turn_type, value, dur_type, duration, now, Utils.makeCompletionCallback(actionGroup));
                } else {
                    Globals.log.error("Missing rotate data" + " at line " + action.number);
                }
                break;


/**************************************************************************************************

    ######  ##    ## ######## ##      ## 
   ##    ## ##   ##  ##       ##  ##  ## 
   ##       ##  ##   ##       ##  ##  ## 
    ######  #####    ######   ##  ##  ## 
         ## ##  ##   ##       ##  ##  ## 
   ##    ## ##   ##  ##       ##  ##  ## 
    ######  ##    ## ########  ###  ###  

**************************************************************************************************/

            case "skew":
            case "twist":
                if (wordList.wordsLeft() > 0) {
                    let spriteName = wordList.getWord();
                    let skew_type = wordList.testWord( ["to","by","at"], "to");
                    let skewX = wordList.getInt(0);
                    let skewY = wordList.getInt(0);
                    let dur_type = wordList.testWord( ["in", "per"], "in");
                    let duration = wordList.getDuration(0);
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    sgSprite.setSkew(skewX, skewY, skew_type, duration, now, Utils.makeCompletionCallback(actionGroup));
                } else {
                    Globals.log.error("Missing skew data" + " at line " + action.number);
                }
                break;

/**************************************************************************************************

   ######## ##     ## ########   #######  ##      ## 
      ##    ##     ## ##     ## ##     ## ##  ##  ## 
      ##    ##     ## ##     ## ##     ## ##  ##  ## 
      ##    ######### ########  ##     ## ##  ##  ## 
      ##    ##     ## ##   ##   ##     ## ##  ##  ## 
      ##    ##     ## ##    ##  ##     ## ##  ##  ## 
      ##    ##     ## ##     ##  #######   ###  ###  

**************************************************************************************************/


            case "throw":
            case "launch":
                if (wordList.wordsLeft() > 0) {
                    let spriteName = wordList.getWord();
                    const stop_or_at = wordList.testWord( ["at", "stop"], "at");
                    let angle = wordList.getInt(0);
                    wordList.testWord( ["deg","degs","degrees"]);
                    wordList.testWord( "with");
                    wordList.testWord( ["force","velocity","speed"]);
                    let initialVelocity = wordList.getInt( 10);
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    if (stop_or_at == "stop") {
                        sgSprite.throw("stop");
                    } else {
                        sgSprite.throw(angle, initialVelocity, now, Utils.makeCompletionCallback(actionGroup));
                    }
                } else {
                    Globals.log.error("Missing throw data" + " at line " + action.number);
                }
                break;

/**************************************************************************************************

########  ########   #######  ########  
##     ## ##     ## ##     ## ##     ## 
##     ## ##     ## ##     ## ##     ## 
##     ## ########  ##     ## ########  
##     ## ##   ##   ##     ## ##        
##     ## ##    ##  ##     ## ##        
########  ##     ##  #######  ##        

**************************************************************************************************/

            case "drop":
                if (wordList.wordsLeft() > 0) {
                    let spriteName = wordList.getWord();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    if (wordList.testWord( "stop")) {
                        sgSprite.throw("stop");
                    } else {
                        sgSprite.throw(180, 0, now,Utils.makeCompletionCallback(actionGroup));
                    }
                } else {
                    Globals.log.error("Missing drop data" + " at line " + action.number);
                }
                break;

/**************************************************************************************************

   ######## ##       #### ########  
   ##       ##        ##  ##     ## 
   ##       ##        ##  ##     ## 
   ######   ##        ##  ########  
   ##       ##        ##  ##        
   ##       ##        ##  ##        
   ##       ######## #### ##        

**************************************************************************************************/

            case "flip":
                if (wordList.wordsLeft() > 0) {
                    let spriteName = wordList.getWord();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { break; }
                    let axis = wordList.getWord("h");
                    sgSprite.flip(axis.charAt(0));
                } else {
                    Globals.log.error("Missing sprite tag" + " at line " + action.number);
                }
                break;

/**************************************************************************************************

    ######  ##     ##  #######  ##      ##       ## ##     ## #### ########  ######## 
   ##    ## ##     ## ##     ## ##  ##  ##      ##  ##     ##  ##  ##     ## ##       
   ##       ##     ## ##     ## ##  ##  ##     ##   ##     ##  ##  ##     ## ##       
    ######  ######### ##     ## ##  ##  ##    ##    #########  ##  ##     ## ######   
         ## ##     ## ##     ## ##  ##  ##   ##     ##     ##  ##  ##     ## ##       
   ##    ## ##     ## ##     ## ##  ##  ##  ##      ##     ##  ##  ##     ## ##       
    ######  ##     ##  #######   ###  ###  ##       ##     ## #### ########  ######## 

**************************************************************************************************/


            case "show":
            case "hide":
            case "toggle":
                if (wordList.wordsLeft() > 0) {
                    let spriteName = wordList.getWord();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { break; }
                    if (command == "show") {
                        sgSprite.setVisibility(true);
                    } else if (command == "hide") {
                        sgSprite.setVisibility(false);
                    } else if (command == "toggle") {
                        sgSprite.setVisibility("toggle");
                    }
                } else {
                    Globals.log.error("Missing sprite tag" + " at line " + action.number);
                }
                break;


/**************************************************************************************************

    ######  ########    ###    ########  ######## 
   ##    ##    ##      ## ##   ##     ##    ##    
   ##          ##     ##   ##  ##     ##    ##    
    ######     ##    ##     ## ########     ##    
         ##    ##    ######### ##   ##      ##    
   ##    ##    ##    ##     ## ##    ##     ##    
    ######     ##    ##     ## ##     ##    ##    

**************************************************************************************************/

            case "start":
                if (wordList.wordsLeft() > 0) {
                    wordList.testWord("scene");
                    const scene_name = wordList.getWord();
                    const scene = Scene.find(scene_name);
                    if (scene !== false) {
                        this.completionCallback = Utils.makeCompletionCallback(actionGroup);
                        scene.start(wordList.joinWords());
                    }
                } else {
                    Globals.log.error("Missing scene name" + " at line " + action.number);
                }
                break;


/**************************************************************************************************

    ######  ##        #######  ##    ## ######## 
   ##    ## ##       ##     ## ###   ## ##       
   ##       ##       ##     ## ####  ## ##       
   ##       ##       ##     ## ## ## ## ######   
   ##       ##       ##     ## ##  #### ##       
   ##    ## ##       ##     ## ##   ### ##       
    ######  ########  #######  ##    ## ######## 

**************************************************************************************************/

            case "copy":
            case "clone":
                if (wordList.wordsLeft() > 0) {
                    const scene_name = wordList.getWord();
                    if (scene_name == constants.MAIN_NAME) {
                        Globals.log.error("Cannot duplicate main scene at line " + action.number);
                        break;
                    }
                    wordList.testWord("as");
                    const new_name = wordList.getWord();
                    const scene = Scene.find(scene_name, false);
                    if (scene === false) {
                        Globals.log.error("Scene not found at line " + action.number);
                        break;
                    }
                    if (Scene.find(new_name, false)) {
                        Globals.log.error("Scene with that name already exists " + action.number);
                        break;
                    }
                    // Everything checks out, make the copy
                    const new_scene = new Scene(new_name);
                    new_scene.content = scene.content; // this is the only bit we need to copy over
                    // but can do others if we ever want to preserve variable states etc...?
                    Globals.scenes.push(new_scene);
                } else {
                    Globals.log.error("Missing scene name" + " at line " + action.number);
                }
                break;

/**************************************************************************************************

    ######  ########  #######  ########  
   ##    ##    ##    ##     ## ##     ## 
   ##          ##    ##     ## ##     ## 
    ######     ##    ##     ## ########  
         ##    ##    ##     ## ##        
   ##    ##    ##    ##     ## ##        
    ######     ##     #######  ##        

**************************************************************************************************/
            
            case "stop":
            case "halt":
                if (wordList.wordsLeft() < 1) {
                    Globals.log.error("Nothing to stop on line " + action.number);
                    break;
                }
                this.completionCallback = Utils.makeCompletionCallback(actionGroup);
                while (wordList.wordsLeft() > 0) {
                    const stop_type = wordList.testWord( ["scene", "audio", "sound", "track", "sprite"]);
                    const item = wordList.getWord();
                    if (item == null) {
                        if (stop_type == "scene") {
                            this.stop(false);
                        }
                        break;
                    }
                    // todo allow an option here to fade out the sound after a set duration
                    if (stop_type == "audio" || stop_type == "sound" || stop_type == "track") {
                        if (AudioManager.exists(item)) {
                            AudioManager.delete(item);
                        }
                    } else if (stop_type == "scene") {
                        const scene = Scene.find(item);
                        if (scene !== false) {
                            scene.stop(false);
                        }
                    } else if (stop_type == "sprite") {
                        let sgSprite = SGSprite.getSprite(this.spriteScene, item, false);
                        if (sgSprite) {
                            sgSprite.stop();
                        }
                    } else if (AudioManager.exists(item)) {
                        AudioManager.delete(item);
                    } else {
                        const scene = Scene.find(item);
                        if (scene !== false) {
                            scene.stop(false);
                        } else {
                            let sgSprite = SGSprite.getSprite(this.spriteScene, item, false);
                            if (sgSprite) {
                                sgSprite.stop();
                            }
                        }
                    }
                }
                break;

/**************************************************************************************************

      ###     ######   ######  ####  ######   ##    ## ##     ## ######## ##    ## ######## 
     ## ##   ##    ## ##    ##  ##  ##    ##  ###   ## ###   ### ##       ###   ##    ##    
    ##   ##  ##       ##        ##  ##        ####  ## #### #### ##       ####  ##    ##    
   ##     ##  ######   ######   ##  ##   #### ## ## ## ## ### ## ######   ## ## ##    ##    
   #########       ##       ##  ##  ##    ##  ##  #### ##     ## ##       ##  ####    ##    
   ##     ## ##    ## ##    ##  ##  ##    ##  ##   ### ##     ## ##       ##   ###    ##    
   ##     ##  ######   ######  ####  ######   ##    ## ##     ## ######## ##    ##    ##    

**************************************************************************************************/

            case "let":
            case "make":
                if (wordList.wordsLeft() > 0) {
                    let varName = wordList.getWord();
                    wordList.testWord(["be","to"]);
                    this.varList.setValue(varName, wordList.joinWords());
                } else {
                    Globals.log.error("Missing variable name at line " + action.number);
                }
                break;                   

            case "assign":
                if (wordList.wordsLeft() > 0) {
                    const assignIndex = wordList.indexOf("as");
                    if (assignIndex < 1) {
                        Globals.log.error("Missing assign separator 'as' at line " + action.number);
                    } else {
                        const varNames = wordList.sliceWords(1, assignIndex);
                        const values = wordList.sliceWords(assignIndex + 1);

                        for (let i = 0; i < varNames.length; i++) {
                            let value = defaults.NOTFOUND;
                            if (values.length > i) {
                                if (i == varNames.length - 1) {
                                    value = values.slice(i).join(" ");
                                } else {
                                    value = values[i];
                                }
                            }
                            this.varList.setValue(varNames[i], value);
                        }
                    }
                } else {
                    Globals.log.error("Missing variable name at line " + action.number);
                }
                break;

            case "increment":
            case "decrement":
                if (wordList.wordsLeft() > 0) {
                    const varName = wordList.getWord();
                    if (this.varList.find(varName) === false) {
                        Globals.log.error("Variable not found " + varName);
                    } else {
                        const currentValue = this.varList.getValue(varName);
                        if (`${currentValue}`.match(/^-?[0-9]+(\.[0-9]+)?$/)) {
                            const delta = command == "increment" ? 1 : -1;
                            this.varList.setValue(varName, parseFloat(currentValue) + delta);
                        }
                    }
                } else {
                    Globals.log.error("Missing variable name at line " + action.number);
                }
                break;

            case "choose":
                if (wordList.wordsLeft() > 2) {
                    let varName = wordList.getWord();
                    wordList.testWord("from");
                    this.varList.setValue(varName, wordList.randomWord());
                } else {
                    Globals.log.error("Missing variable name at line " + action.number);
                }
                break;

            case "match":
                if (wordList.wordsLeft() > 4) {
                    const varName = wordList.getWord();
                    if (!wordList.testWord( "to")) {
                        Globals.log.error("Missing match separator 'to' at line " + action.number);
                    } else {
                        const searchWord = wordList.getWord();
                        if (searchWord == null) {
                            Globals.log.error("Missing search word at line " + action.number);
                        } else {
                            wordList.testWord("at");
                            const anchor = wordList.testWord(["start","end"]);
                            if (!wordList.testWord( "from")) {
                                Globals.log.error("Missing match separator 'from' at line " + action.number);
                            } else {
                                const matches = wordList.matchWords(searchWord, anchor);
                                this.varList.setValue(varName, matches.length > 0 ? matches.join(" ") : defaults.NOTFOUND);
                            }
                        }
                    }
                } else {
                    Globals.log.error("Missing values for match at line " + action.number);
                }
                break;

/**************************************************************************************************

######## ##       ####  ######  ##    ## ######## ########  
##       ##        ##  ##    ## ##   ##  ##       ##     ## 
##       ##        ##  ##       ##  ##   ##       ##     ## 
######   ##        ##  ##       #####    ######   ########  
##       ##        ##  ##       ##  ##   ##       ##   ##   
##       ##        ##  ##    ## ##   ##  ##       ##    ##  
##       ######## ####  ######  ##    ## ######## ##     ## 

**************************************************************************************************/

            case "flicker":
                if (wordList.wordsLeft() > 0) {
                    let spriteName = wordList.getWord();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { break; }
                    let on_off = wordList.testWord(["by","stop"]);
                    if (on_off == "stop") {
                        sgSprite.flicker(0,0);
                    } else {
                        let flickerStrength = wordList.getInt(0,0,50) * Globals.scriptScaleX;
                        wordList.testWord("with");
                        wordList.testWord("chance");
                        let flickerChance = wordList.getInt(50);
                        sgSprite.flicker(flickerStrength, flickerChance);
                    }
                } else {
                    Globals.log.error("Missing values at line " + action.number);
                }
                break;                   



/**************************************************************************************************

         ## ####  ######    ######   ##       ######## 
         ##  ##  ##    ##  ##    ##  ##       ##       
         ##  ##  ##        ##        ##       ##       
         ##  ##  ##   #### ##   #### ##       ######   
   ##    ##  ##  ##    ##  ##    ##  ##       ##       
   ##    ##  ##  ##    ##  ##    ##  ##       ##       
    ######  ####  ######    ######   ######## ######## 

**************************************************************************************************/



            case "jiggle":
            case "jitter":
                if (wordList.wordsLeft() > 0) {
                    let sgSpriteName = wordList.getWord();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, sgSpriteName);
                    if (!sgSprite) { break; }
                    let on_off = wordList.testWord(["by","stop"]);
                    if (on_off == "stop") {
                        sgSprite.jiggle(0,0,0);
                    } else {
                        let jiggleX = wordList.getInt(0) * Globals.scriptScaleX;
                        let jiggleY = wordList.getInt(0) * Globals.scriptScaleY;
                        let jiggle_r = wordList.getInt(0);
                        wordList.testWord("with");
                        wordList.testWord("chance");
                        let jiggleChance = wordList.getInt(50);
                        sgSprite.jiggle(jiggleX, jiggleY, jiggle_r, jiggleChance);
                    }
                } else {
                    Globals.log.error("Missing values at line " + action.number);
                }
                break;                   

/**************************************************************************************************

######## ##          ###     ######  ##     ## 
##       ##         ## ##   ##    ## ##     ## 
##       ##        ##   ##  ##       ##     ## 
######   ##       ##     ##  ######  ######### 
##       ##       #########       ## ##     ## 
##       ##       ##     ## ##    ## ##     ## 
##       ######## ##     ##  ######  ##     ## 

**************************************************************************************************/

            case "flash":
                if (wordList.wordsLeft() > 0) {
                    let sgSpriteName = wordList.getWord();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, sgSpriteName);
                    if (!sgSprite) { break; }
                    let flashCount = wordList.getInt(0,1,10);
                    sgSprite.flash(flashCount, now);
                } else {
                    Globals.log.error("Missing values at line " + action.number);
                }
                break;         

/**************************************************************************************************

########  ##       #### ##    ## ##    ## 
##     ## ##        ##  ###   ## ##   ##  
##     ## ##        ##  ####  ## ##  ##   
########  ##        ##  ## ## ## #####    
##     ## ##        ##  ##  #### ##  ##   
##     ## ##        ##  ##   ### ##   ##  
########  ######## #### ##    ## ##    ## 

**************************************************************************************************/

            case "blink":
                if (wordList.wordsLeft() > 0) {
                    let sgSpriteName = wordList.getWord();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, sgSpriteName);
                    if (!sgSprite) { break; }
                    let on_off = wordList.testWord(["at","stop"]);
                    if (on_off == "stop") {
                        sgSprite.blink(0, 0, now);
                    } else {
                        let blinkRate = wordList.getInt(0,1,10);
                        wordList.testWord("per");
                        wordList.testWord("second");
                        wordList.testWord("with");
                        wordList.testWord("chance");
                        let blinkChance = wordList.getInt(100,0,100);
                        sgSprite.blink(blinkRate, blinkChance, now);
                    }
                } else {
                    Globals.log.error("Missing values at line " + action.number);
                }
                break;                   

/**************************************************************************************************

########  ##     ## ##        ######  ######## 
##     ## ##     ## ##       ##    ## ##       
##     ## ##     ## ##       ##       ##       
########  ##     ## ##        ######  ######   
##        ##     ## ##             ## ##       
##        ##     ## ##       ##    ## ##       
##         #######  ########  ######  ######## 

**************************************************************************************************/

            case "pulse":
            case "pulsate":
                if (wordList.wordsLeft() > 0) {
                    let sgSpriteName = wordList.getWord();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, sgSpriteName);
                    if (!sgSprite) { break; }
                    let on_off = wordList.testWord("stop");
                    if (on_off == "stop") {
                        sgSprite.pulse(0, 0, 100, now);
                    } else {
                        wordList.testWord("at");
                        let pulseRate = wordList.getInt(0,1,10);
                        wordList.testWord("per");
                        wordList.testWord("second");
                        wordList.testWord("from");
                        let pulseMin = wordList.getInt(0,0,100);
                        wordList.testWord("to");
                        let pulseMax = wordList.getInt(100,0,100);
                        sgSprite.pulse(pulseRate, pulseMin, pulseMax, now);
                    }
                } else {
                    Globals.log.error("Missing values at line " + action.number);
                }
                break;                   

/**************************************************************************************************

########    ###    ########  ######## 
##         ## ##   ##     ## ##       
##        ##   ##  ##     ## ##       
######   ##     ## ##     ## ######   
##       ######### ##     ## ##       
##       ##     ## ##     ## ##       
##       ##     ## ########  ######## 

**************************************************************************************************/

            case "fade":
            case "trans":
                if (wordList.wordsLeft() > 0) {
                    let sgSpriteName = wordList.getWord();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, sgSpriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    let fade_type = wordList.testWord(["to","by", "up", "down"],"to");
                    let value = wordList.getInt(100);
                    let duration = wordList.getDuration(0);
                    if (sgSprite) {
                        sgSprite.setTransparency(value, duration, fade_type, now, Utils.makeCompletionCallback(actionGroup));
                    }
                } else {
                    Globals.log.error("Missing fade parameters");
                }
                break;


/**************************************************************************************************

   ##      ##    ###    ##     ## ########       ##  ######  ##      ##    ###    ##    ## 
   ##  ##  ##   ## ##   ##     ## ##            ##  ##    ## ##  ##  ##   ## ##    ##  ##  
   ##  ##  ##  ##   ##  ##     ## ##           ##   ##       ##  ##  ##  ##   ##    ####   
   ##  ##  ## ##     ## ##     ## ######      ##     ######  ##  ##  ## ##     ##    ##    
   ##  ##  ## #########  ##   ##  ##         ##           ## ##  ##  ## #########    ##    
   ##  ##  ## ##     ##   ## ##   ##        ##      ##    ## ##  ##  ## ##     ##    ##    
    ###  ###  ##     ##    ###    ######## ##        ######   ###  ###  ##     ##    ##    

**************************************************************************************************/


            case "wave":
            case "sway":
                if (wordList.wordsLeft() > 0) {
                    let sgSpriteName = wordList.getWord();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { break; }
                    let on_off = wordList.testWord(["to","stop"]);
                    if (on_off == "stop") {
                        if (command == "wave") {
                            sgSprite.wave(0, 0, 0);
                        } else {
                            sgSprite.sway(0, 0, 0);
                        }
                    } else {
                        let waveMax = wordList.getInt(0,1,10);
                        let waveRate = wordList.getDuration(1);
                        wordList.testWord("with");
                        wordList.testWord("chance");
                        let waveChance = wordList.getInt(100,0,100);
                        if (command == "wave") {
                            sgSprite.wave(waveMax, waveRate, waveChance);
                        } else {
                            sgSprite.sway(waveMax, waveRate, waveChance);
                        }
                    }
                } else {
                    Globals.log.error("Missing values at line " + action.number);
                }
                break;                   

/**************************************************************************************************

########  ##       ##     ## ########  
##     ## ##       ##     ## ##     ## 
##     ## ##       ##     ## ##     ## 
########  ##       ##     ## ########  
##     ## ##       ##     ## ##   ##   
##     ## ##       ##     ## ##    ##  
########  ########  #######  ##     ## 

**************************************************************************************************/

            case "blur":
            case "fuzz":
                if (wordList.wordsLeft() > 0) {
                    let spriteName = wordList.getWord();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) {
                        break;
                    }
                    let blur_type = wordList.testWord(["to","by", "up", "down"],"to");
                    let value = wordList.getInt(100);
                    let duration = wordList.getDuration(0);
                    if (sgSprite) {
                        sgSprite.setBlur(value, duration, blur_type, now, Utils.makeCompletionCallback(actionGroup));
                    }
                } else {
                    Globals.log.error("Missing fade parameters");
                }
                break;

/**************************************************************************************************

########  #### ###    ## ######## 
   ##      ##  ####   ##    ##    
   ##      ##  ## ##  ##    ##    
   ##      ##  ##  ## ##    ##    
   ##      ##  ##   ####    ##    
   ##      ##  ##    ###    ##    
   ##     #### ##     ##    ##    

**************************************************************************************************/

            case "tint":
                if (wordList.wordsLeft() > 0) {
                    let spriteName = wordList.getWord();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { break; }
                    wordList.testWord( ["to", "by", "at"]);
                    const value = wordList.getWord( "red");
                        sgSprite.setTint(value);
                } else {
                    Globals.log.error("Missing tint colour");
                }
                break;

            case "darken":
            case "lighten":
                if (wordList.wordsLeft() > 0) {
                    let spriteName = wordList.getWord();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    wordList.testWord( ["to", "by", "at"]);
                    let value = wordList.getInt( 0, 0, 100);
                    if (command == "lighten") {
                        value = 100 - value;
                    }
                    let duration = wordList.getDuration(0);
                    sgSprite.setTint(value, duration, now, Utils.makeCompletionCallback(actionGroup));
                } else {
                    Globals.log.error("Missing " + command + " parameters");
                }
                break;

/**************************************************************************************************

   ########  #######  ########     #### ##    ## 
   ##       ##     ## ##     ##     ##  ###   ## 
   ##       ##     ## ##     ##     ##  ####  ## 
   ######   ##     ## ########      ##  ## ## ## 
   ##       ##     ## ##   ##       ##  ##  #### 
   ##       ##     ## ##    ##      ##  ##   ### 
   ##        #######  ##     ##    #### ##    ## 

**************************************************************************************************/

            case "for":
                if (wordList.wordsLeft() > 0) {
                    let varName = wordList.getWord();
                    let offset = 3;
                    if (wordList.testWord( "in")) {
                        offset = 4;
                    }
                    this.varList.setValue(varName,wordList.getWord(defaults.NOTFOUND));
                    const stackFrame = new Utils.StackFrame(constants.STACK_FOR, actionIndex + 1, wordList.sliceWords(offset), varName);
                    actionGroup.stack.push(stackFrame);
                } else {
                    Globals.log.error("Missing for loop");
                }
                break;

            case "next":
            case "endfor": {
                    const stackSize = actionGroup.stack.length;
                    // error cases first
                    if (stackSize < 1) {
                        Globals.log.error("No for loop for next at " + action.number);
                        break;
                    }
                    const stackFrame = actionGroup.stack[stackSize - 1];
                    if (stackFrame.type != constants.STACK_FOR) {
                        Globals.log.error("For loop error at " + action.number);
                        break;
                    }
                    if (stackFrame.counter++ > defaults.LOOP_MAXIMUM) {
                        Globals.log.error("Looping exceeded at " + action.number);
                        actionGroup.stack.pop();
                        break;
                    }
                    if (stackFrame.forValues.length < 1) {
                        // used all words, unwind stack.
                        actionGroup.stack.pop();
                        // just carry on with next line
                    } else { // still got more values to use up
                        this.varList.setValue(stackFrame.varName, stackFrame.forValues.shift());
                        actionGroup.nextAction = stackFrame.jump_line;
                    }
                }
                break;

/**************************************************************************************************

   ########  ######## ########  ########    ###    ######## 
   ##     ## ##       ##     ## ##         ## ##      ##    
   ##     ## ##       ##     ## ##        ##   ##     ##    
   ########  ######   ########  ######   ##     ##    ##    
   ##   ##   ##       ##        ##       #########    ##    
   ##    ##  ##       ##        ##       ##     ##    ##    
   ##     ## ######## ##        ######## ##     ##    ##    

**************************************************************************************************/

            case "repeat":
                const stackFrame = new Utils.StackFrame(constants.STACK_REPEAT, actionIndex + 1);
                actionGroup.stack.push(stackFrame);
                break;
            case "until": {
                    const stackSize = actionGroup.stack.length;
                    // error cases first
                    if (stackSize < 1) {
                        Globals.log.error("No repeat for until at " + action.number);
                        break;
                    }
                    const stackFrame = actionGroup.stack[stackSize - 1];
                    if (stackFrame.type != constants.STACK_REPEAT) {
                        Globals.log.error("Repeat loop error at " + action.number);
                        break;
                    }
                    if (stackFrame.counter++ > defaults.LOOP_MAXIMUM) {
                        Globals.log.error("Looping exceeded at " + action.number);
                        actionGroup.stack.pop();
                        break;
                    }
                    const result = Utils.logical(wordList.sliceWords(1));
                    if (result) { // break out of loop
                        actionGroup.stack.pop();
                        // just carry on with next line
                    } else { // let's go round again... one more time...
                        actionGroup.nextAction = stackFrame.jump_line;
                    }
                }
                break;

/**************************************************************************************************

   #### ######## 
    ##  ##       
    ##  ##       
    ##  ######   
    ##  ##       
    ##  ##       
   #### ##       

**************************************************************************************************/

            case "if": 
                if (wordList.wordsLeft() > 0) { 
                    if (actionGroup.failedIfCount > 0) { // we have a failed if condition active
                        actionGroup.failedIfCount += 1; // so just  nest another one
                    } else {
                        const result = Utils.logical(wordList.sliceWords(1));
                        // At the moment we are only interested in failed conditions
                        // but need to keep track of nested ifs inside the failed one
                        if (!result) {
                            actionGroup.failedIfCount += 1;
                        }
                    }
                } else {
                    Globals.log.error("Missing if condition at line " + action.number);
                }
                break;
            
            case "endif":
                // only happens after a succesful if clause so can just ignore
                break;

/**************************************************************************************************

   ##      ##    ###    #### ######## 
   ##  ##  ##   ## ##    ##     ##    
   ##  ##  ##  ##   ##   ##     ##    
   ##  ##  ## ##     ##  ##     ##    
   ##  ##  ## #########  ##     ##    
   ##  ##  ## ##     ##  ##     ##    
    ###  ###  ##     ## ####    ##    

**************************************************************************************************/


            case 'wait':
                let duration = wordList.getDuration(5);
                this.timers.push(new Utils.Timer(now, duration, Utils.makeCompletionCallback(actionGroup)));
                break;

/**************************************************************************************************

######## #### ##    ## ####  ######  ##     ## 
##        ##  ###   ##  ##  ##    ## ##     ## 
##        ##  ####  ##  ##  ##       ##     ## 
######    ##  ## ## ##  ##   ######  ######### 
##        ##  ##  ####  ##        ## ##     ## 
##        ##  ##   ###  ##  ##    ## ##     ## 
##       #### ##    ## ####  ######  ##     ## 

**************************************************************************************************/

            case 'finish':
                Globals.app.stop();
                break;

/**************************************************************************************************

   ##       ####  ######  ######## 
   ##        ##  ##    ##    ##    
   ##        ##  ##          ##    
   ##        ##   ######     ##    
   ##        ##        ##    ##    
   ##        ##  ##    ##    ##    
   ######## ####  ######     ##    

**************************************************************************************************/

            case "dump":
            case "list":
                const type = wordList.getWord("scene");
                const arg = wordList.getWord();
                switch(type) {
                    case "scenes":
                    case "all":
                        for (let i = 0; i < Globals.scenes.length; i++) {
                            Globals.log.report(Globals.scenes[i].showSceneData());
                        }
                        break;
                    case "scene":
                        if (arg) {
                            const listScene = Scene.find(arg);
                            if (listScene) {
                                Globals.log.report(listScene.showSceneData());
                            }
                        } else {
                            Globals.log.report(this.showSceneData());
                        }
                        break;
                    case "sprites":
                        if (arg) {
                            const listScene = Scene.find(arg);
                            if (listScene) {
                                Globals.log.report(listScene.listSprites());
                            }
                        } else {
                            Globals.log.report(this.listSprites());
                        }
                        break;
                    case "images":
                        if (arg) {
                            const listScene = Scene.find(arg);
                            if (listScene) {
                                Globals.log.report(listScene.listImages());
                            }
                        } else {
                            Globals.log.report(this.listImages());
                        }
                        break;
                    case "actions":
                        for (let i = 0; i < this.actionGroups.length; i++) {
                            Globals.log.report(this.actionGroups[i].list());
                        }
                        break;
                    case "globals":
                        Globals.log.report(Globals.list());
                        break;
                }
                break;
            
            default:
                Globals.log.error("Unknown command: " + command );
                break;
        }
    }
}
