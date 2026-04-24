import { SGImage, SGSprite } from "./sgsprite.js";
import { Parser } from "./parser.js";
import * as Triggers from "./triggers.js";
import * as Utils from "./utils.js";
import { Globals } from "./globals.js";
import { VarList } from "./vars.js";
import { AudioManager } from "./audio.js";
import defaults from "./defaults.js";
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
        this.varList = new VarList(this.name);
        this.timers = [];
        this.completionCallback = null;
        this.parameters = defaults.NOTFOUND;
        // Graphic creation options
        this.graphicFill = "black";
        this.graphicStroke = "black";
        this.graphicStrokeWidth = 1;
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
        let text = verbose ? "Sprites in Scene " + this.name + "\n" : "";
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
                    text += `child of ${sprite.sgParent}`;
                }
                text += "\n";
            } else {
                text += `${sprite.name} `;
            }
        }
        return text;
    }

    listImages(verbose = true) {
        let text = verbose ? "Images in Scene " + this.name + "\n" : "";
        for (let i = 0; i < this.images.length; i++ ) {
            const image = this.images[i];
            if (verbose) {
                text += `Name ${image.name} `;
                text += image.loading ? "loaded" : "loading";
                text += ` from ${image.url}\n`;
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
            const words = Parser.splitWords(this.content[i].text);
            const keyword = words.shift();
            // First look for triggers
            switch(keyword.toLowerCase()) {
                case 'when':
                    if (args.toLowerCase().startsWith("all")) {
                        actionGroup.any_trigger = false;
                    } else if (!words[0].toLowerCase().startsWith("any")) {
                        Globals.log.error("Unknown when condition - " + words[0] );
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
                    trigger = new Triggers.After(this, timestamp, Parser.joinWords(words));
                    break;
                case 'on':
                    let on_word = words.shift();
                    switch (on_word) {
                        case 'key':
                            if (words[0] == 'press') {
                                words.shift();
                            }
                            trigger = new Triggers.Trigger("ONKEY", Parser.joinWords(words));
                            break;
                        case 'keypress':
                            trigger = new Triggers.Trigger("ONKEY", Parser.joinWords(words));
                            break;
                        case 'mouse':
                            if (words[0] == 'click') {
                                words.shift();
                            }
                            trigger = new Triggers.Trigger("MOUSECLICK", Parser.joinWords(words));
                            break;
                        default:
                            Globals.log.error("Unknown trigger type on " + on_word + " at line " + lineNo);
                            break;
                        }
                    break;
                case 'at':
                    if (words[0] == 'time') {
                        words.shift();
                    }
                    trigger = new Triggers.AtClass(this, timestamp, Parser.joinWords(words));
                    break;
                case 'each':
                    if (words[0] == 'time') {
                        words.shift();
                    }
                    trigger = new Triggers.Each(this, timestamp, Parser.joinWords(words));
                    break;
                case 'then':
                    if (state == "T") {
                        Globals.log.error("Then must be the only trigger in that group");
                    } else {
                        // we trigger on the current action, as then will start a new one
                        trigger = new Triggers.ThenClass(this, timestamp, Parser.joinWords(words), actionGroup);
                    }
                    break;
                case 'every':
                    trigger = new Triggers.Every(this, timestamp, Parser.joinWords(words));
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
        const expandedText = this.varList.expandVars(action.text);
        const evaluatedText = Utils.evaluate(expandedText);
        const words = Parser.splitWords(evaluatedText);
        // assume that the next action will be the next line
        actionGroup.nextAction += 1; // might be overwritten by the actual action, below
        // remove initial "and" (just syntactic sugar)
        if (words[0].match(/^and$/i)) {
            words.shift();
        }
        let command = words.shift().toLowerCase();
        if (actionGroup.failedIfCount > 0) { // failed if condition, don't bother running
            // except to look for endif // if
            if (command == "endif") {
                actionGroup.failedIfCount -=1; // jump out this level
            } else if (command == "if") {
                actionGroup.failedIfCount +=1; // jump into another level
            }
            return;
        }

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
        if (command == "set" && words.length > 1) {
            switch(words[0]) {
                case "trans":
                case "transparency":
                case "fade":
                    words.shift();
                    Parser.testWord(words, "of");
                    command = "fade";
                    break;
                case "speed":
                    words.shift();
                    Parser.testWord(words, "of");
                    command = "speed";
                    break;
                case "position":
                case "pos":
                    words.shift();
                    Parser.testWord(words, "of");
                    command = "move";
                    break;
                case "volume":
                    words.shift();
                    Parser.testWord(words, "to");
                    command = "volume"
                    break;
                case "blur":
                case "fuzz":
                    words.shift();
                    Parser.testWord(words, "of");
                    command = "blur"
                    break;
                case "darkness":
                    words.shift();
                    Parser.testWord(words, "of");
                    command = "darken";
                    break;
                case "lightness":
                    words.shift();
                    Parser.testWord(words, "of");
                    command = "lighten";
                    break;
                case "tint":
                    words.shift();
                    Parser.testWord(words, "of");
                    command = "tint";
                    break;
                default: // means the same as make
                    command = "make";
                    break;
            }
        }

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
        if (command == "create" && words.length > 1) {
            switch(words[0]) {
                case "text":
                    command = "text";
                    words[0] = "create";
                    break;
                case "sprite":
                    words.shift();
                    command = "sprite";
                    words[0] = "create";
                    break;
                case "group":
                    words.shift();
                    command = "group";
                    words[0] = "create";
                    break;
                case "graphic":
                case "shape":
                    words.shift();
                    command = "shape";
                    words[0] = "create";
                    break;
                default:
                    break;
            }
        }

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
            case "log":
            case "print":
                Globals.log.report(words.join(' '));
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
                if (words.count < 1) {
                    Globals.log.error("Missing filename" + " at line " + action.number);
                    break;
                }
                let filename = words.shift();
                // look for a tag
                Parser.testWord(words,["named", "as"]);
                if (words.length > 0) {
                    tag = words.shift();
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
            case "with":
                if (words.length > 0) {
                    this.folder = words[0] + "/";
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
                    const reset_type = Parser.testWord(words,["sprite","scene"], "scene");
                    if (reset_type == "sprite") {
                        if (words.length > 0) {
                            let spriteName = Parser.getWord(words);
                            let sgSprite = SGSprite.getSprite(this.name, spriteName);
                            if (!sgSprite) { break; }
                            sgSprite.resetFont(); // go back to original size
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
                        if (words.length > 0) {
                            let sceneName = Parser.getWord(words);
                        }
                        const scene = Scene.find(sceneName);
                        if (scene != false) {
                            scene.stop(true);
                        } else {
                            Globals.log.error("Scene not found at line " + action.number);
                        }
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
                if (words.length > 0) {
                    // which (already loaded) image to use?
                    const sprite_command = Parser.getWord(words);
                    switch (sprite_command) {
                        // more to add here?
                        case "create":
                                let spriteName = false;
            {                   let groupName = null;
                                // should the sprite have a different tag?
                                if (Parser.testWord(words,"named") || !Parser.testWord(words,"from"))  {
                                    spriteName = Parser.getWord(words);
                                }
                                // Are we adding this to a group?
                                if (Parser.testWord(words,"in")) {
                                    groupName = Parser.getWord(words);
                                }
                                Parser.testWord(words,"from");
                                let imageName = Parser.getWord(words);
                                if (!spriteName) {
                                    spriteName = imageName;
                                }
                                let sgSprite = new SGSprite(imageName, spriteName);
                                if (groupName) {
                                    const groupSprite = SGSprite.getSprite(this.name, groupName);
                                    if (!groupSprite) {
                                        break;
                                    }
                                    if (groupSprite.type != constants.SPRITE_GROUP) {
                                        Globals.log.error("Not a group at line " + action.number);
                                        break;
                                    }
                                    sgSprite.sgParent = groupName;
                                }
                                if (Parser.testWord(words,"area")) {
                                    const x = Parser.getInt(words,0);
                                    const y = Parser.getInt(words,0);
                                    const w = Parser.getInt(words,0);
                                    const h = Parser.getInt(words,0);
                                    if (w > 0 && h > 0) {
                                        sgSprite.image_portion = new PIXI.Rectangle(x,y,w,h);
                                        sq_sprite.sizeX.setTargetValue(w);
                                        sq_sprite.sizeY.setTargetValue(h);
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

########  ##          ###     ######  ######## 
##     ## ##         ## ##   ##    ## ##       
##     ## ##        ##   ##  ##       ##       
########  ##       ##     ## ##       ######   
##        ##       ######### ##       ##       
##        ##       ##     ## ##    ## ##       
##        ######## ##     ##  ######  ######## 

**************************************************************************************************/

            case "place":
                if (words.length > 0) {
                    let spriteName = Parser.getWord(words);
                    let sgSprite = SGSprite.getSprite(this.name, spriteName);
                    if (!sgSprite) {
                        break;
                    }
                    const hidden = Parser.testWord(words,"hidden");
                    // is there a location for the sprite?
                    Parser.testWord(words, "at");
                    if (Parser.testWord(words,["center","centre"])) {
                        sgSprite.locX.setTargetValue(Globals.app.screen.width / 2);
                        sgSprite.locY.setTargetValue(Globals.app.screen.height / 2);
                    } else {
                        sgSprite.locX.setTargetValue(Parser.getInt(words, 0) * Globals.scriptScaleX);
                        sgSprite.locY.setTargetValue(Parser.getInt(words, 0) * Globals.scriptScaleY);
                    }
                    // is there a depth provided?
                    Parser.testWord(words,"depth");
                    sgSprite.depth = Parser.getInt(words, 0);
                    // is there a size? (or just use image size)
                    Parser.testWord(words, ["size","scale"]); // separate these?
                    const width = Parser.getInt(words,0);
                    const height = Parser.getInt(words,0);
                    if (width > 0 && height > 0) {
                        sgSprite.sizeX.setTargetValue(width * Globals.scriptScaleX);
                        sgSprite.sizeY.setTargetValue(height * Globals.scriptScaleY);
                    }
                    // Got all the data, now create the sprite
                    if (!hidden) {
                        sgSprite.setVisibility(true);
                    }
                    if (sgSprite.sgParent) { // is this part of a group?
                        const parentGroup = SGSprite.getSprite(this.name, this.sgParent);
                        // Get the new group size
                        parentGroup.sizeX.forceValue(parentGroup.piSprite.width);
                        parentGroup.sizeY.forceValue(parentGroup.piSprite.height);
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
                if (words.length > 0) {
                    // which (already loaded) image to use?
                    let spriteName = words.shift();
                    Parser.testWord(words,"with");
                    let imageName = words.shift();
                    let hidden = Parser.testWord(words,"hidden");
                    let sgSprite = SGSprite.getSprite(this.name, spriteName);
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
                if (words.length > 0) {
                    // which (already loaded) image to use?
                    let imageName = words.shift();
                    let spriteName = null;
                    // should the sprite have a different tag?
                    if (Parser.testWord(words,"named")) {
                        spriteName = Parser.getWord(words, imageName);
                    }
                    Parser.testWord(words,["as","at"]);
                    let role = Parser.testWord(words,["background","backdrop","top","bottom","left",
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
                    Parser.testWord(words,["as","at"]);
                    if (Parser.testWord(words,"depth")) {
                        sgSprite.depth = Parser.getInt(words, 0);
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
                if (words.length > 0) {
                    switch (Parser.getWord(words)) {
                        // more to add here?
                        case "create":
                            {
                                Parser.testWord(words,"named");
                                const groupName = Parser.getWord(words);
                                if (SGSprite.getSprite(this.name, groupName, false)) {
                                    break; // already exists, but not an error
                                } 
                                const sgSprite = new SGSprite(null, groupName, constants.SPRITE_GROUP);
                                const group = new PIXI.Container();
                                // Bit of a fudge, we create a screen filling, empty graphic to act as
                                // canvas for things added to the group later
                                // const blank = new PIXI.Graphics().rect(0, 0, Globals.displayWidth, Globals.displayHeight).fill({color: 0x000000, alpha: 0.0});
                                // group.addChild(blank);
                                group.pivot.set(Globals.displayWidth / 2, Globals.displayHeight / 2);
                                // this group goes on top for now...
                                sgSprite.depth = Globals.nextZ(0);
                                group.zIndex = sgSprite.depth;
                                Globals.root.addChild(group);
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
                                const spriteName = Parser.getWord(words);
                                const sgSprite = SGSprite.getSprite(this.name, spriteName);
                                if (!sgSprite) {
                                    break;
                                }
                                Parser.testWord(words,"to");
                                const groupName = Parser.getWord(words);
                                const groupSprite = SGSprite.getSprite(this.name, groupName);
                                if (!groupSprite) {
                                    break;
                                }
                                if (groupSprite.type != constants.SPRITE_GROUP) {
                                    Globals.log.error("Not a group at line " + action.number);
                                    break;
                                }
                                sgSprite.sgParent = groupName;
                                // take it away from its parent (cruel...)
                                // sgSprite.piSprite.parent.removeChild(sgSprite.piSprite);
                                // Foster it out to the group
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
                if (words.length > 0) {
                    const resourceName = words.shift();
                    Parser.testWord(words,"fade");
                    Parser.testWord(words,"in");
                    const fadein = Parser.getDuration(words, 0);
                    Parser.testWord(words,"at");
                    Parser.testWord(words,"volume");
                    const volume = Parser.getInt(words, 50, defaults.VOLUME_MIN, defaults.VOLUME_MAX);
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
                if (words.length > 0) {
                    Parser.testWord(words,"of");
                    const resourceName = words.shift();
                    Parser.testWord(words,"to");
                    const volume = Parser.getInt(words, 0, defaults.VOLUME_MIN, defaults.VOLUME_MAX);
                    Parser.testWord(words,"in");
                    const fadein = Parser.getDuration(words, 0);
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
                if (words.length > 2) {
                    const textCommand = words.shift();
                    const textName = words.shift();
                    const textData = Parser.joinWords(words);
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
                        Globals.root.addChild(textSprite);
                        this.sprites.push(sgSprite);
                        break;
                    } // else
                    sgSprite = SGSprite.getSprite(this.name, textName);
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
                if (words.length > 1) {
                    const graphicCommand = Parser.getWord(words);
                    switch (graphicCommand) {
                        case"create":
                            const graphicTag = Parser.getWord(words);
                            Parser.testWord(words,"as");
                            const graphicType = Parser.getWord(words);
                            let graphic = null;
                            switch (graphicType) {
                                case "rectangle":
                                case "rect": 
                                    {
                                        const w = Parser.getInt(words,0);
                                        const h = Parser.getInt(words,w);
                                        const r = Parser.getInt(words,0);
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
                                        const r = Parser.getInt(words,0);
                                        if (r > 0) {
                                            graphic = new PIXI.Graphics().circle(0, 0, r);
                                        }
                                    }
                                    break;
                                 case "line":
                                    {
                                        const l = Parser.getInt(words,0);
                                        if (r > 0) {
                                            graphic = new PIXI.Graphics().moveTo(l / -2, 0).lineTo(l/2, 0);
                                        }
                                    }
                                    break;                               
                                case "ellipse":
                                    {
                                        const w = Parser.getInt(words,0);
                                        const h = Parser.getInt(words,w);
                                        if (w > 0 && h > 0) {
                                            graphic = new PIXI.Graphics().ellipse(w/-2, h/-2, w, h);
                                        }
                                    }
                                    break;
                                case "star":
                                    {
                                        const p = Parser.getInt(words,0);
                                        const ro = Parser.getInt(words,0);
                                        let ri = Parser.getInt(words,0);
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
                                        const x = Parser.getInt(words,100);
                                        const y = Parser.getInt(words, x);
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
                                Globals.root.addChild(graphic);
                                const sgSprite = new SGSprite(null, graphicTag, constants.SPRITE_GRAPHIC);
                                sgSprite.piSprite = graphic;
                                sgSprite.setVisibility(false);
                                sgSprite.sizeX.setTargetValue(graphic.width);
                                sgSprite.sizeY.setTargetValue(graphic.height);
                                this.sprites.push(sgSprite);
                            } else {
                                Globals.log.error("Invalid graphic arguments at " + action.number);
                            }
                            break;
                        case "color":
                        case "colour":
                            this.graphicFill = Parser.getWord(words,"black");
                            this.graphicStroke = Parser.getWord(words,"black");
                            break;
                        case "fill":
                            this.graphicFill = Parser.getWord(words,"black");
                            break;
                        case "stroke":
                            if (Parser.testWord(words,"width")) {
                                this.graphicStrokeWidth = Parser.getInt(words,1);
                            } else {
                                this.graphicStroke = Parser.getWord(words,"black");
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
                if (words.length > 0) {
                    let spriteName = words.shift();
                    let byOrTo = Parser.getWord(words, ["by","to"]);
                    if (byOrTo === false) {
                        Globals.log.error("Expected by or to on line " + action.number);
                        break;
                    }
                    let x = Parser.getInt(words, 0) * Globals.scriptScaleX;
                    let y = Parser.getInt(words, 0) * Globals.scriptScaleY;
                    let inOrAt = Parser.testWord(words, ["in","at"], "in");
                    let duration = Parser.getDuration(words,0);
                    let sgSprite = SGSprite.getSprite(this.name, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    sgSprite.move(x, y, byOrTo, inOrAt, duration, now, Utils.makeCompletionCallback(actionGroup));
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
                if (words.length > 0) {
                    let spriteName = words.shift();
                    Parser.testWord(words,["around","from"]);
                    let x = Parser.getInt(words, 0);
                    let y = Parser.getInt(words, 0);
                    let duration = Parser.getDuration(words, 0);
                    let sgSprite = SGSprite.getSprite(this.name, spriteName);
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
                let spriteName = words.shift();
                Parser.testWord(words,"to");
                let speed = Parser.getInt(words, 0) * Globals.scriptScaleX;
                let sgSprite = SGSprite.getSprite(this.name, spriteName);
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
                if (words.length > 0) {
                    let spriteName = words.shift();
                    let depth_type = Parser.getWord(words, ["to", "by"]);
                    if (depth_type === false) {
                        Globals.log.error("Expected to or by on line " + action.number);
                        break;
                    }
                    let value = Parser.getInt(words, 0);
                    if (command == "lower") {
                        value = -value;
                    }
                    let sgSprite = SGSprite.getSprite(this.name, spriteName);
                    if (sgSprite != null) {
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
                if (words.length > 0) {
                    let spriteName = words.shift();
                    let toOrBy = Parser.getWord(words, ["to","by"]);
                    if (toOrBy === false) {
                        Globals.log.error("Expected to or by on line " + action.number);
                        break;
                    }

                    let w = Parser.getInt(words, 0) * Globals.scriptScaleX;
                    let h = Parser.getInt(words, 0) * Globals.scriptScaleY;
                    let inOrAt = Parser.testWord(words, ["in","at"]);
                    let duration = Parser.getDuration(words, 0);
                    let sgSprite = SGSprite.getSprite(this.name, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    sgSprite.resize( w, h, toOrBy, inOrAt, duration, now,
                        Utils.makeCompletionCallback(actionGroup)
                    );
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
                if (words.length > 0) {
                    let spriteName = Parser.getWord(words);
                    const action = Parser.testWord(words, ["to", "by"]);
                    let w = Parser.getInt(words, 0);
                    let h = Parser.getInt(words, 0);
                    if (command == "shrink") {
                        if (w > 100) { // if we shrink by 100% or more we disappear!
                            w = 99;
                        }
                        if (w > 0) {
                            w = 100 - w; // e.g. shrink by 25% means scale to 75%
                        }
                        if (h > 100) {
                            h = 99;
                        }
                        if (h > 0) {
                            h = 100 - h; // e.g. shrink by 25% means scale to 75%
                        }
                    } else if (command == "grow") {
                        if (w > 0) {
                            w += 100; // e.g. grow by 50% means scale to 150% of original
                        }
                        if (h > 0) {
                            h += 100; // e.g. grow by 50% means scale to 150% of original
                        }
                    }
                    Parser.testWord(words, "in");
                    let duration = Parser.getDuration(words, 0);
                    let sgSprite = SGSprite.getSprite(this.name, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    if  (action == "reset") {
                        sgSprite.resetFont();
                    } else if (w > 0 || h > 0) {
                        sgSprite.scale( w, h, duration, now,
                            Utils.makeCompletionCallback(actionGroup));
                    } else {
                        Globals.log.error("Invalid scale data at line " + action.number);
                    }
                } else {
                    Globals.log.error("Missing scale data at line " + action.number);
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
                if (words.length > 1) {
                    const type = Parser.testWord(words,["sprite","audio","sound","var","variable"]);
                    const item = Parser.getWord(words);
                    switch (type) {
                        case "sprite":
                            SGSprite.remove_sprite(this.name, item, false);
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
                if (words.length > 0) {
                    let spriteName = words.shift();
                    let turn_type = Parser.testWord(words, ["to","by","at"], "to");
                    let value = Parser.getInt(words,0);
                    let dur_type = Parser.testWord(words, ["in", "per"], "in");
                    let duration = Parser.getDuration(words, 0);
                    let sgSprite = SGSprite.getSprite(this.name, spriteName);
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
                if (words.length > 0) {
                    let spriteName = words.shift();
                    let skew_type = Parser.testWord(words, ["to","by","at"], "to");
                    let skewX = Parser.getInt(words,0);
                    let skewY = Parser.getInt(words,0);
                    let dur_type = Parser.testWord(words, ["in", "per"], "in");
                    let duration = Parser.getDuration(words, 0);
                    let sgSprite = SGSprite.getSprite(this.name, spriteName);
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
                if (words.length > 0) {
                    let spriteName = words.shift();
                    const stop_or_at = Parser.testWord(words, ["at", "stop"], "at");
                    let angle = Parser.getInt(words,0);
                    Parser.testWord(words, ["deg","degs","degrees"]);
                    Parser.testWord(words, "with");
                    Parser.testWord(words, ["force","velocity","speed"]);
                    let initialVelocity = Parser.getInt(words, 10);
                    let sgSprite = SGSprite.getSprite(this.name, spriteName);
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
                if (words.length > 0) {
                    let spriteName = words.shift();
                    let sgSprite = SGSprite.getSprite(this.name, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    if (Parser.testWord(words, "stop")) {
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
                if (words.length > 0) {
                    let spriteName = words.shift();
                    let sgSprite = SGSprite.getSprite(this.name, spriteName);
                    if (!sgSprite) { break; }
                    let axis = Parser.getWord(words,"h");
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
                if (words.length > 0) {
                    let spriteName = words.shift();
                    let sgSprite = SGSprite.getSprite(this.name, spriteName);
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
                if (words.length > 0) {
                    const scene_name = Parser.getWord(words);
                    const scene = Scene.find(scene_name);
                    if (scene !== false) {
                        this.completionCallback = Utils.makeCompletionCallback(actionGroup);
                        scene.start(Parser.joinWords(words));
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
                if (words.length > 0) {
                    const scene_name = Parser.getWord(words);
                    if (scene_name == constants.MAIN_NAME) {
                        Globals.log.error("Cannot duplicate main scene at line " + action.number);
                        break;
                    }
                    Parser.testWord(words,"as");
                    const new_name = Parser.getWord(words);
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
                this.completionCallback = Utils.makeCompletionCallback(actionGroup);
                if (words.length > 0) {
                    while (words.length > 0) {
                        const stop_type = Parser.testWord(words, ["scene", "audio", "sound", "track", "sprite"]);
                        const item = words.shift();
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
                            let sgSprite = SGSprite.getSprite(this.name, item, false);
                            if (sgSprite != null) {
                                sgSprite.stop();
                            }
                        } else if (AudioManager.exists(item)) {
                            AudioManager.delete(item);
                        } else {
                            const scene = Scene.find(item);
                            if (scene !== false) {
                                scene.stop(false);
                            } else {
                                let sgSprite = SGSprite.getSprite(this.name, item, false);
                                if (sgSprite != null) {
                                    sgSprite.stop();
                                }
                            }
                        }
                    }
                } else {
                    Globals.log.error("Nothing to stop on line " + action.number);
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
                if (words.length > 0) {
                    let varName = words.shift();
                    Parser.testWord(words,["be","to"]);
                    this.varList.setValue(varName, words.join(" "));
                } else {
                    Globals.log.error("Missing variable name at line " + action.number);
                }
                break;                   

            case "assign":
                if (words.length > 0) {
                    const assignIndex = words.indexOf("as");
                    if (assignIndex < 1) {
                        Globals.log.error("Missing assign separator 'as' at line " + action.number);
                    } else {
                        const varNames = words.slice(0, assignIndex);
                        const values = words.slice(assignIndex + 1);

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
                if (words.length > 0) {
                    const varName = words.shift();
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
                if (words.length > 2) {
                    let varName = words.shift();
                    Parser.testWord(words,"from");
                    this.varList.setValue(varName, words[Math.floor(Math.random() * words.length)]);
                } else {
                    Globals.log.error("Missing variable name at line " + action.number);
                }
                break;

            case "match":
                if (words.length > 4) {
                    const varName = words.shift();
                    if (!Parser.testWord(words, "to")) {
                        Globals.log.error("Missing match separator 'to' at line " + action.number);
                    } else {
                        const searchWord = words.shift();
                        if (searchWord == null) {
                            Globals.log.error("Missing search word at line " + action.number);
                        } else {
                            Parser.testWord(words,"at");
                            const anchor = Parser.testWord(words,["start","end"]);
                            if (!Parser.testWord(words, "from")) {
                                Globals.log.error("Missing match separator 'from' at line " + action.number);
                            } else {
                                let matches = [];
                                if (anchor == "start" ) {
                                    matches = words.filter(word => word.startsWith(searchWord));
                                } else if (anchor == "end") {
                                    matches = words.filter(word => word.endsWith(searchWord));
                                } else {
                                    matches = words.filter(word => word.includes(searchWord));
                                }
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
                if (words.length > 0) {
                    let spriteName = words.shift();
                    let sgSprite = SGSprite.getSprite(this.name, spriteName);
                    if (!sgSprite) { break; }
                    let on_off = Parser.testWord(words,["by","stop"]);
                    if (on_off == "stop") {
                        sgSprite.flicker(0,0);
                    } else {
                        let flickerStrength = Parser.getInt(words,0,0,50) * Globals.scriptScaleX;
                        Parser.testWord(words,"with");
                        Parser.testWord(words,"chance");
                        let flickerChance = Parser.getInt(words,50);
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
                if (words.length > 0) {
                    let sgSpriteName = words.shift();
                    let sgSprite = SGSprite.getSprite(this.name, sgSpriteName);
                    if (!sgSprite) { break; }
                    let on_off = Parser.testWord(words,["by","stop"]);
                    if (on_off == "stop") {
                        sgSprite.jiggle(0,0,0);
                    } else {
                        let jiggleX = Parser.getInt(words,0) * Globals.scriptScaleX;
                        let jiggleY = Parser.getInt(words,0) * Globals.scriptScaleY;
                        let jiggle_r = Parser.getInt(words,0);
                        Parser.testWord(words,"with");
                        Parser.testWord(words,"chance");
                        let jiggleChance = Parser.getInt(words,50);
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
                if (words.length > 0) {
                    let sgSpriteName = words.shift();
                    let sgSprite = SGSprite.getSprite(this.name, sgSpriteName);
                    if (!sgSprite) { break; }
                    let flashCount = Parser.getInt(words,0,1,10);
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
                if (words.length > 0) {
                    let sgSpriteName = words.shift();
                    let sgSprite = SGSprite.getSprite(this.name, sgSpriteName);
                    if (!sgSprite) { break; }
                    let on_off = Parser.testWord(words,["at","stop"]);
                    if (on_off == "stop") {
                        sgSprite.blink(0, 0, now);
                    } else {
                        let blinkRate = Parser.getInt(words,0,1,10);
                        Parser.testWord(words,"per");
                        Parser.testWord(words,"second");
                        Parser.testWord(words,"with");
                        Parser.testWord(words,"chance");
                        let blinkChance = Parser.getInt(words,100,0,100);
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
                if (words.length > 0) {
                    let sgSpriteName = words.shift();
                    let sgSprite = SGSprite.getSprite(this.name, sgSpriteName);
                    if (!sgSprite) { break; }
                    let on_off = Parser.testWord(words,"stop");
                    if (on_off == "stop") {
                        sgSprite.pulse(0, 0, 100, now);
                    } else {
                        Parser.testWord(words,"at");
                        let pulseRate = Parser.getInt(words,0,1,10);
                        Parser.testWord(words,"per");
                        Parser.testWord(words,"second");
                        Parser.testWord(words,"from");
                        let pulseMin = Parser.getInt(words,0,0,100);
                        Parser.testWord(words,"to");
                        let pulseMax = Parser.getInt(words,100,0,100);
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
                if (words.length > 0) {
                    let sgSpriteName = words.shift();
                    let sgSprite = SGSprite.getSprite(this.name, sgSpriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    let fade_type = Parser.testWord(words,["to","by", "up", "down"],"to");
                    let value = Parser.getInt(words,100);
                    Parser.testWord(words, "in");
                    let duration = Parser.getDuration(words, 0);
                    if (sgSprite != null) {
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
                if (words.length > 0) {
                    let sgSpriteName = words.shift();
                    let sgSprite = SGSprite.getSprite(this.name, spriteName);
                    if (!sgSprite) { break; }
                    let on_off = Parser.testWord(words,["to","stop"]);
                    if (on_off == "stop") {
                        if (command == "wave") {
                            sgSprite.wave(0, 0, 0);
                        } else {
                            sgSprite.sway(0, 0, 0);
                        }
                    } else {
                        let waveMax = Parser.getInt(words,0,1,10);
                        Parser.testWord(words,"in");
                        let waveRate = Parser.getDuration(words,1);
                        Parser.testWord(words,"with");
                        Parser.testWord(words,"chance");
                        let waveChance = Parser.getInt(words,100,0,100);
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
                if (words.length > 0) {
                    let spriteName = words.shift();
                    let sgSprite = SGSprite.getSprite(this.name, spriteName);
                    if (!sgSprite) {
                        break;
                    }
                    let blur_type = Parser.testWord(words,["to","by", "up", "down"],"to");
                    let value = Parser.getInt(words,100);
                    Parser.testWord(words, "in");
                    let duration = Parser.getDuration(words, 0);
                    if (sgSprite != null) {
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
                if (words.length > 0) {
                    let spriteName = words.shift();
                    let sgSprite = SGSprite.getSprite(this.name, spriteName);
                    if (!sgSprite) { break; }
                    Parser.testWord(words, ["to", "by", "at"]);
                    const value = Parser.getWord(words, "red");
                        sgSprite.setTint(value);
                } else {
                    Globals.log.error("Missing tint colour");
                }
                break;

            case "darken":
            case "lighten":
                if (words.length > 0) {
                    let spriteName = words.shift();
                    let sgSprite = SGSprite.getSprite(this.name, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    Parser.testWord(words, ["to", "by", "at"]);
                    let value = Parser.getInt(words, 0, 0, 100);
                    if (command == "lighten") {
                        value = 100 - value;
                    }
                    Parser.testWord(words, "in");
                    let duration = Parser.getDuration(words, 0);
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
                if (words.length > 0) {
                    let varName = words.shift();
                    Parser.testWord(words, "in");
                    this.varList.setValue(varName,Parser.getWord(words,defaults.NOTFOUND));
                    const stackFrame = new Utils.StackFrame(constants.STACK_FOR, actionIndex + 1, words, varName);
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
                    const result = Utils.logical(words);
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
                if (words.length > 0) { 
                    if (actionGroup.failedIfCount > 0) { // we have a failed if condition active
                        actionGroup.failedIfCount += 1; // so just  nest another one
                    } else {
                        const result = Utils.logical(words);
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
                let duration = Parser.getDuration(words,5);
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
                const type = Parser.getWord(words,"scene");
                const arg = Parser.getWord(words);
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
