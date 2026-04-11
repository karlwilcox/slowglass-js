import { SG_image, SG_sprite } from "./sg_sprite";
import { Parser } from "./parser";
import * as Triggers from "./triggers.js";
import * as Utils from "./utils.js";
import { Globals } from "./globals.js";
import { VarList } from "./vars.js";
import { AudioManager } from "./audio.js";
import defaults from "./defaults.js";

export class Scene {
    constructor(sceneName) {
        this.name = sceneName;
        this.content = [];
        this.enabled = sceneName == defaults.MAIN_NAME;
        this.actionGroups = [];
        this.images = [];
        this.sprites = [];
        this.folder = '';
        this.varList = new VarList();
        this.timers = [];
        this.completion_callback = null;
    }

    static find(scene_name) {
        for (let i = 0; i < Globals.scenes.length; i++) {
            if (scene_name == Globals.scenes[i].name) {
                return Globals.scenes[i];
            }
        } // else
        Globals.log.error("Cannot find scene " + scene_name);
        return false;
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

    static readFromText(text) {
        const script = text.split(/\r?\n/);
        const count = script.length;
        const top = new Scene(defaults.MAIN_NAME);
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
            // Handle scene management commands
            let words = currentLine.toLowerCase().split(/[\s,]+/);
            // ignore and as the first word (syntactic sugar)
            if (words[0] == 'and') {
                words.shift();
            }
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
                    let display_width = parseInt(argument2);
                    if (display_width < 50 || display_width > 5000) {
                        Globals.log.error("silly display width");
                        display_width = defaults.DISPLAY_WIDTH;
                    }
                    Globals.display_width = display_width;
                } else if (argument == 'height') {
                    let display_height = parseInt(argument2);
                    if (display_height < 50 || display_height > 5000) {
                        Globals.log.error("silly display height");
                        display_height = defaults.DISPLAY_HEIGHT;
                    }
                    Globals.display_height = display_height;
                } // else look for fullscreen
            } else if (command == 'include') {
                Globals.log.error('Include not supported yet');
            } else if (command == 'script') {
                if (argument == 'width') {
                    let script_width = parseInt(argument2);
                    if (script_width < 50 || script_width > 5000) {
                        Globals.log.error("silly script width");
                        script_width = defaults.DISPLAY_WIDTH;
                    }
                    Globals.script_width = script_width;
                } else if (argument == 'height') {
                    let script_height = parseInt(argument2);
                    if (script_height < 50 || script_height > 5000) {
                        Globals.log.error("silly script height");
                        script_height = defaults.DISPLAY_HEIGHT;
                    }
                    Globals.script_height = script_height;
                } else if (argument == "scale") {
                    Globals.script_scale_type = argument2;
                }
            } else if (command == 'gravity') {
                let gravity = Parrser.parseFloat(argument);
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
        } else {
            // calculate overall scaling
            switch (Globals.script_scale_type) {
                case defaults.SCALE_STRETCH:
                    Globals.script_scale_x = Globals.display_width / Globals.script_width;
                    Globals.script_scale_y = Globals.display_height / Globals.script_height;
                    break;
                case defaults.SCALE_FIT:
                    // todo
                case defaults.SCALE_NONE:
                default:
                    break;
            }
            top.start();
            Globals.scenes.push(top);
        }
    }

    stop() {
        this.enabled = false;
        this.actionGroups = [];
        // delete any resources
        for (let i = 0; i < this.sprites; i++) {
            const  sprite = this.sprites[i];
            if (sprite.enabled) { // Pixi sprite exists
                sprite.pi_sprite.destroy();
            }
        }
        // delete any variables
        this.varList = null;
        this.sprites = [];
        this.images = [];
        this.completion_callback();
        this.completion_callback = null;
    }

    pause() {
        this.enabled = true;
    }

    resume() {
        this.enabled = false;
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

    start() {
        this.actionGroups = [];
        let action_group = new Utils.ActionGroup();
        let state = "T";
        let timestamp = Date.now(); // Use same timestamp for all
        for (let i = 0; i < this.content.length; i++) {
            let trigger = null;
            let words = this.content[i].text.split(/\s+/);
            let line_no = this.content[i].number;
            let keyword = words.shift();
            words = words.join(" ");
            // First look for triggers
            switch(keyword.toLowerCase()) {
                case 'when':
                    if (words.toLowerCase().startsWith("all")) {
                        action_group.any_trigger = false;
                    } else if (!words.toLowerCase().startsWith("any")) {
                        Globals.log.error("Unknown when condition - " + words );
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
                case 'if':
                case 'while':
                    trigger = new Triggers.IfWhile(this, timestamp, words, keyword);
                    break;
                case 'after':
                    trigger = new Triggers.After(this, timestamp, words);
                    break;
                case 'on':
                    let on_word = words.shift();
                    switch (on_word) {
                        case 'key':
                            if (words[0] == 'press') {
                                words.shift();
                            }
                            trigger = new Triggers.Trigger("ONKEY", words);
                            break;
                        case 'keypress':
                            trigger = new Triggers.Trigger("ONKEY", words);
                            break;
                        case 'mouse':
                            if (words[0] == 'click') {
                                words.shift();
                            }
                            trigger = new Triggers.Trigger("MOUSECLICK", words);
                            break;
                        default:
                            Globals.log.error("Unknown trigger type on " + on_word + " at line " + line_no);
                            break;
                        }
                    break;
                case 'at':
                    if (words[0] == 'time') {
                        words.shift();
                    }
                    trigger = new Triggers.AtClass(this, timestamp, words);
                    break;
                case 'each':
                    if (words[0] == 'time') {
                        words.shift();
                    }
                    trigger = new Triggers.Each(this, timestamp, words);
                    break;
                case 'then':
                    if (state == "T") {
                        Globals.log.error("Then must be the only trigger in that group");
                    } else {
                        // we trigger on the current action, as then will start a new one
                        trigger = new Triggers.ThenClass(this, timestamp, words, action_group);
                    }
                    break;
                case 'every':
                    trigger = new Triggers.Every(this, timestamp, words);
                    break;
                default:
                    // not an error, just not a trigger
                    break;
            }
            if (trigger !== null) {
                if (state == "T") { // another trigger in the same group
                    action_group.addTrigger(trigger);
                } else { // this is a new action group
                    this.actionGroups.push(action_group);
                    action_group = new Utils.ActionGroup();
                    action_group.addTrigger(trigger);
                    state = "T";
                }
                continue;
            }
            state = "A";
            // not a trigger, must be an action
            if (action_group.triggers.length < 1) {
                Globals.log.error("No trigger for action in scene " + this.name + " at line " + line_no);
            }
            action_group.addAction(this.content[i]);
        }
        this.actionGroups.push(action_group);
        this.enabled = true;
        // for ( let i = 0; i < this.actionGroups.length; i++ ) {
        //     Globals.log.debug("Action group " + i );
        //     for ( let j = 0; j < this.actionGroups[i].triggers.length; j++ ) {
        //         Globals.log.debug("Trigger - " + this.actionGroups[i].triggers[j].constructor.name );
        //     }
        //     for ( let j = 0; j < this.actionGroups[i].actions.length; j++ ) {
        //         Globals.log.debug("Action - " + this.actionGroups[i].actions[j].text );
        //     }
        // }
    }

/**************************************************************************************************

   ########  ##     ## ##    ##            ###     ######  ######## 
   ##     ## ##     ## ###   ##           ## ##   ##    ##    ##    
   ##     ## ##     ## ####  ##          ##   ##  ##          ##    
   ########  ##     ## ## ## ##         ##     ## ##          ##    
   ##   ##   ##     ## ##  ####         ######### ##          ##    
   ##    ##  ##     ## ##   ###         ##     ## ##    ##    ##    
   ##     ##  #######  ##    ## ####### ##     ##  ######     ##    

**************************************************************************************************/

    run_actions(index, now) {
        let action_group = this.actionGroups[index];
        action_group.reset_count();
        let actions = action_group.actions;
        for ( let i = 0; i < actions.length; i++ ) {
            let action = actions[i];
            let words = this.varList.expand_vars(action.text);
            words = Utils.evaluate(words).split(/[\s,]+/);;
            let line_no = action.number;
            // remove initial "and" (just syntactic sugar)
            if (words[0].match(/^and$/i)) {
                words.shift();
            }
            let command = words.shift().toLowerCase();

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
                        Parser.test_word(words, "of");
                        command = "fade";
                        break;
                    case "position":
                    case "pos":
                        words.shift();
                        Parser.test_word(words, "of");
                        command = "move";
                        break;
                    case "volume":
                        words.shift();
                        Parser.test_word(words, "to");
                        command = "volume"
                        break;
                    case "blur":
                    case "fuzz":
                        words.shift();
                        Parser.test_word(words, "of");
                        command = "blur"
                        break;
                    default: // means the same as make
                        command = "make";
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
                    Globals.log.error(words.join(' '));
                    action_group.complete_action("echo");
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
                        Globals.log.error("Missing filename" + " at line " + line_no);
                        break;
                    }
                    let filename = words.shift();
                    // look for a tag
                    Parser.test_word(words,["named", "as"]);
                    if (words.length > 0) {
                        tag = words.shift();
                    } else { // use file basename as tag
                        let slash = filename.lastIndexOf('/');
                        let dot = filename.lastIndexOf('.');
                        tag = filename.slice(slash, dot);
                    }
                    // later - look for split cols by rows for animations

                    action_group.complete_action("load");
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
                        const sg_image = new SG_image(this.folder + filename, tag);
                        this.images.push(sg_image);
                        sg_image.load_image();
                    } else if (filename.endsWith(".wav") ||
                        filename.endsWith(".mp3")) {
                        AudioManager.create(tag, this.folder + filename);
                    } // else check for other resource types
                    action_group.complete_action("load");
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
                        Globals.log.error("Expected folder name at " + line_no);
                    }
                    action_group.complete_action("from");
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
                        // which (already loaded) image to use?
                        let image_tag = words.shift();
                        let sprite_tag = image_tag;
                        // should the sprite have a different tag?
                        if (Parser.test_word(words,["named","as"])) {
                            sprite_tag = Parser.get_word(words, image_tag);
                        }
                        let sg_sprite = new SG_sprite(image_tag, sprite_tag);
                        let hidden = Parser.test_word(words,"hidden");
                        if (hidden) {
                            sg_sprite.set_visibility(false);
                        }
                        // is there a location for the sprite?
                        Parser.test_word(words, "at");
                        sg_sprite.loc_x.set_target_value(Parser.get_int(words, 0) * Globals.script_scale_x);
                        sg_sprite.loc_y.set_target_value(Parser.get_int(words, 0) * Globals.script_scale_y);
                        // is there a depth provided?
                        Parser.test_word(words,"depth");
                        sg_sprite.depth = Parser.get_int(words, 0);
                        // is there a size? (or just use image size)
                        Parser.test_word(words, ["size","scale"]); // separate these?
                        sg_sprite.size_x.set_target_value(Parser.get_int(words, 0) * Globals.script_scale_x);
                        sg_sprite.size_y.set_target_value(Parser.get_int(words, 0) * Globals.script_scale_y);
                        // Got all the data, now create the sprite
                        this.sprites.push(sg_sprite);
                    } else {
                        Globals.log.error("Missing place data" + " at line " + line_no);
                    }
                    action_group.complete_action("place");
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
                        let sprite_tag = words.shift();
                        Parser.test_word(words,"with");
                        let image_tag = words.shift();
                        let hidden = Parser.test_word(words,"hidden");
                        let sg_sprite = SG_sprite.get_sprite(sprite_tag);
                        if (hidden) {
                            sg_sprite.set_visibility(false);
                        }
                        // set the new image and delete existing texture
                        // (will be picked up in the next  update)
                        sg_sprite.image_tag = image_tag;
                        sg_sprite.pi_sprite.texture = Texture.EMPTY;
                    } else {
                        Globals.log.error("Missing replace data" + " at line " + line_no);
                    }
                    action_group.complete_action("replace");
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
                	if (words.length > 0) {
                        // which (already loaded) image to use?
                        let image_tag = words.shift();
                        let sprite_tag = null;
                        // should the sprite have a different tag?
                        if (Parser.test_word(words,"named")) {
                            sprite_tag = Parser.get_word(words, image_tag);
                        }
                        let sg_sprite = new SG_sprite(image_tag, sprite_tag);
                        Parser.test_word(words,["as","at"]);
                        const location = Parser.test_word(words,["background","top","bottom","left","right","ground","sky"]);
                        if (location == false) {
	                        Globals.log.error("Unknown location" + " at line " + line_no);
	                        break;
                        } // else 
                        if ( sprite_tag == null ) {
                            sprite_tag = location;
                        }
                        Parser.test_word(words,"depth");
                        sg_sprite.depth = Parser.get_int(words, 0);
                        sg_sprite.location = location;
                        // can't set any other properties until we know the image size, so quit for now
                        this.sprites.push(sg_sprite);
                	} else {
                          Globals.log.error("Missing put data" + " at line " + line_no);
                	}
                    action_group.complete_action("put");
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
                        const tag = words.shift();
                        Parser.test_word(words,"fade");
                        Parser.test_word(words,"in");
                        const fadein = Parser.get_duration(words, 0);
                        Parser.test_word(words,"at");
                        Parser.test_word(words,"volume");
                        const volume = Parser.get_int(words, 50, defaults.VOLUME_MIN, defaults.VOLUME_MAX);
                        AudioManager.play(tag, { fadeInMs: fadein * 1000, targetVolume: volume });
                    } else {
                        Globals.log.error("Nothing to play at line " + line_no);
                    }
                    action_group.complete_action("play"); // todo put in a proper callback
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
                        Parser.test_word(words,"of");
                        const tag = words.shift();
                        Parser.test_word(words,"to");
                        const volume = Parser.get_int(words, 0, defaults.VOLUME_MIN, defaults.VOLUME_MAX);
                        Parser.test_word(words,"in");
                        const fadein = Parser.get_duration(words, 0);
                        AudioManager.setVolume(tag, volume, { fadeMs: fadein * 1000});
                    } else {
                        Globals.log.error("No volume change at line " + line_no);
                    }
                    action_group.complete_action("volume");
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
                        let by_or_to = "to";
                        let sprite_tag = words.shift();
                        by_or_to = Parser.get_word(words, ["by","to"]);
                        if (by_or_to === false) {
                            Globals.log.error("Expected by or to on line " + line_no);
                            break;
                        }
                        let x = Parser.get_int(words, 0) * Globals.script_scale_x;
                        let y = Parser.get_int(words, 0) * Globals.script_scale_y;
                        let in_or_at = Parser.test_word(words, ["in","at"]);
                        if (in_or_at === false) {
                            Globals.log.error("Expected in or at on line " + line_no);
                            break;
                        }
                        let duration = Parser.get_duration(words,0);
                        let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                        sprite.move(x, y, by_or_to, in_or_at, duration, now, Utils.makeCompletionCallback(action_group));
                    } else {
                        Globals.log.error("Missing move data" + " at line " + line_no);
                        action_group.complete_action("moveX");
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
                        let sprite_tag = words.shift();

                        let to_or_by = Parser.get_word(words, ["to","by"]);
                        if (to_or_by === false) {
                            Globals.log.error("Expected to or by on line " + line_no);
                            break;
                        }

                        let w = Parser.get_int(words, 0) * Globals.script_scale_x;
                        let h = Parser.get_int(words, 0) * Globals.script_scale_y;

                        let in_or_at = Parser.test_word(words, ["in","at"]);
                        if (in_or_at === false) {
                            Globals.log.error("Expected in or at on line " + line_no);
                            break;
                        }

                        let duration = Parser.get_duration(words, 0);

                        let sprite = SG_sprite.get_sprite(this.name, sprite_tag);

                        sprite.resize(
                            w,
                            h,
                            to_or_by,
                            in_or_at,
                            duration,
                            now,
                            Utils.makeCompletionCallback(action_group)
                        );
                    } else {
                        Globals.log.error("Missing resize data at line " + line_no);
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
                    while (words.length) {
                        const item = words.shift();
                        if (AudioManager.exists(item)) {
                            AudioManager.delete(item);
                        } else {
                            SG_sprite.remove_sprite(this.name, item);
                        }
                    }
                    action_group.complete_action("remove");
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
                        let sprite_tag = words.shift();
                        let turn_type = Parser.test_word(words, ["to","by","at"], "to");
                        let value = Parser.get_int(words,0);
                        let dur_type = Parser.test_word(words, ["in", "per"], "in");
                        let duration = Parser.get_duration(words, 0);
                        let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                        sprite.rotate(turn_type, value, dur_type, duration, now, Utils.makeCompletionCallback(action_group));
                    } else {
                        Globals.log.error("Missing rotate data" + " at line " + line_no);
                        action_group.complete_action("rotateX");
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
                        let sprite_tag = words.shift();
                        const stop_or_at = Parser.test_word(words, ["at", "stop"], "at");
                        let angle = Parser.get_int(words,0);
                        Parser.test_word(words, ["deg","degs","degrees"]);
                        Parser.test_word(words, "with");
                        Parser.test_word(words, ["force","velocity","speed"]);
                        let initial_velocity = Parser.get_int(words, 10);
                        let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                        if (stop_or_at == "stop") {
                            sprite.throw("stop");
                        } else {
                            sprite.throw(angle, initial_velocity, now, Utils.makeCompletionCallback(action_group));
                        }
                    } else {
                        Globals.log.error("Missing throw data" + " at line " + line_no);
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
                        let sprite_tag = words.shift();
                        let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                        if (Parser.test_word(words, "stop")) {
                            sprite.throw("stop");
                        } else {
                            sprite.throw(180, 0, now,Utils.makeCompletionCallback(action_group));
                        }
                    } else {
                        Globals.log.error("Missing drop data" + " at line " + line_no);
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
                        let sprite_tag = words.shift();
                        let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                        if (command == "show") {
                            sprite.set_visibility(true);
                        } else if (command == "hide") {
                            sprite.set_visibility(false);
                        } else if (command == "toggle") {
                            sprite.set_visibility("toggle");
                        }
                    } else {
                        Globals.log.error("Missing sprite tag" + " at line " + line_no);
                    }
                    action_group.complete_action();
                    break;

/**************************************************************************************************

    ######  ########    ###    ########  ########       ##  ######  ########  #######  ########  
   ##    ##    ##      ## ##   ##     ##    ##         ##  ##    ##    ##    ##     ## ##     ## 
   ##          ##     ##   ##  ##     ##    ##        ##   ##          ##    ##     ## ##     ## 
    ######     ##    ##     ## ########     ##       ##     ######     ##    ##     ## ########  
         ##    ##    ######### ##   ##      ##      ##           ##    ##    ##     ## ##        
   ##    ##    ##    ##     ## ##    ##     ##     ##      ##    ##    ##    ##     ## ##        
    ######     ##    ##     ## ##     ##    ##    ##        ######     ##     #######  ##        

**************************************************************************************************/
                
                case "start":
                    if (words.length > 0) {
                        for (let i = 0; i < words.length; i++) {
                            const scene = Scene.find(words[i]);
                            if (scene !== false) {
                                this.completion_callback = Utils.makeCompletionCallback(action_group);
                                scene.start();
                            }
                        }
                    } else {
                        Globals.log.error("Missing scene name" + " at line " + line_no);
                    }
                    action_group.complete_action("start");
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
                    this.completion_callback = Utils.makeCompletionCallback(action_group);
                    if (words.length > 0) {
                        for (let i = 0; i < words.length; i++) {
                            if (AudioManager.exists(words[i])) {
                                AudioManager.delete(words[i]);
                            } else {
                                const scene = Scene.find(words[i]);
                                if (scene !== false) {
                                    scene.stop();
                                }
                            }
                        }
                    } else {
                        this.stop();
                    }
                    action_group.complete_action("stop");
                    break;

/**************************************************************************************************

   ##       ######## ########       ## ##     ##    ###    ##    ## ######## 
   ##       ##          ##         ##  ###   ###   ## ##   ##   ##  ##       
   ##       ##          ##        ##   #### ####  ##   ##  ##  ##   ##       
   ##       ######      ##       ##    ## ### ## ##     ## #####    ######   
   ##       ##          ##      ##     ##     ## ######### ##  ##   ##       
   ##       ##          ##     ##      ##     ## ##     ## ##   ##  ##       
   ######## ########    ##    ##       ##     ## ##     ## ##    ## ######## 

**************************************************************************************************/

                case "let":
                case "make":
                     if (words.length > 0) {
                        let varName = words.shift();
                        Parser.test_word(words,["be","to"]);
                        this.varList.create(varName, words.join(" "));
                    } else {
                        Globals.log.error("Missing variable name at line " + line_no);
                    }
                    action_group.complete_action("let");
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
                        let sprite_tag = words.shift();
                        let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                        let on_off = Parser.test_word(words,["by","stop"]);
                        if (on_off == "stop") {
                            sprite.flicker(0,0);
                        } else {
                            let flicker_size = Parser.get_int(words,0,0,50) * Globals.script_scale_x;
                            Parser.test_word(words,"with");
                            Parser.test_word(words,"chance");
                            let flicker_chance = Parser.get_int(words,50);
                            sprite.flicker(flicker_size, flicker_chance);
                        }
                    } else {
                        Globals.log.error("Missing values at line " + line_no);
                    }
                    action_group.complete_action("flicker"); // not really, but also not very important
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
                        let sprite_tag = words.shift();
                        let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                        let on_off = Parser.test_word(words,["by","stop"]);
                        if (on_off == "stop") {
                            sprite.jiggle(0,0,0);
                        } else {
                            let jiggle_x = Parser.get_int(words,0) * Globals.script_scale_x;
                            let jiggle_y = Parser.get_int(words,0) * Globals.script_scale_y;
                            let jiggle_r = Parser.get_int(words,0);
                            Parser.test_word(words,"with");
                            Parser.test_word(words,"chance");
                            let jiggle_chance = Parser.get_int(words,50);
                            sprite.jiggle(jiggle_x, jiggle_y, jiggle_r, jiggle_chance);
                        }
                    } else {
                        Globals.log.error("Missing values at line " + line_no);
                    }
                    action_group.complete_action("jiggle"); // not really, but also not very important
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
                        let sprite_tag = words.shift();
                        let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                        let flash_count = Parser.get_int(words,0,1,10);
                        sprite.flash(flash_count, now);
                    } else {
                        Globals.log.error("Missing values at line " + line_no);
                    }
                    action_group.complete_action("flash"); // not really, but also not very important
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
                        let sprite_tag = words.shift();
                        let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                        let on_off = Parser.test_word(words,["at","stop"]);
                        if (on_off == "stop") {
                            sprite.blink(0, 0, now);
                        } else {
                            let blink_rate = Parser.get_int(words,0,1,10);
                            Parser.test_word(words,"per");
                            Parser.test_word(words,"second");
                            Parser.test_word(words,"with");
                            Parser.test_word(words,"chance");
                            let blink_chance = Parser.get_int(words,100,0,100);
                            sprite.blink(blink_rate, blink_chance, now);
                        }
                    } else {
                        Globals.log.error("Missing values at line " + line_no);
                    }
                    action_group.complete_action("blink"); // not really, but also not very important
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
                        let sprite_tag = words.shift();
                        let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                        let on_off = Parser.test_word(words,"stop");
                        if (on_off == "stop") {
                            sprite.pulse(0, 0, 100, now);
                        } else {
                            Parser.test_word(words,"at");
                            let pulse_rate = Parser.get_int(words,0,1,10);
                            Parser.test_word(words,"per");
                            Parser.test_word(words,"second");
                            Parser.test_word(words,"from");
                            let pulse_min = Parser.get_int(words,0,0,100);
                            Parser.test_word(words,"to");
                            let pulse_max = Parser.get_int(words,0,100,100);
                            sprite.pulse(pulse_rate, pulse_min, pulse_max, now);
                        }
                    } else {
                        Globals.log.error("Missing values at line " + line_no);
                    }
                    action_group.complete_action("pulse"); // not really, but also not very important
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
                            let sprite_tag = words.shift();
                            let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                            let fade_type = Parser.test_word(words,["to","by", "up", "down"],"to");
                            let value = Parser.get_int(words,100);
                            Parser.test_word(words, "in");
                            let duration = Parser.get_duration(words, 0);
                            if (sprite != null) {
                                sprite.set_trans(value, duration, fade_type, now, Utils.makeCompletionCallback(action_group));
                            }
                        } else {
                            Globals.log.error("Missing fade parameters");
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
                            let sprite_tag = words.shift();
                            let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                            let blur_type = Parser.test_word(words,["to","by", "up", "down"],"to");
                            let value = Parser.get_int(words,100);
                            Parser.test_word(words, "in");
                            let duration = Parser.get_duration(words, 0);
                            if (sprite != null) {
                                sprite.set_blur(value, duration, blur_type, now, Utils.makeCompletionCallback(action_group));
                            }
                        } else {
                            Globals.log.error("Missing fade parameters");
                        }
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
                        let duration = Parser.get_duration(words,5);
                        this.timers.push(new Utils.Timer(now, duration, Utils.makeCompletionCallback(action_group)));
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

                default:
                    Globals.log.error("Unknown command: " + command );
                    break;
            }
        }
    }
}
