import { SG_image, SG_sprite } from "./sg_sprite.js";
import { Parser } from "./parser.js";
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
        this.varList = new VarList(sceneName);
        this.timers = [];
        this.completion_callback = null;
        this.message = defaults.NOTFOUND;
        // Graphic creation options
        this.graphic_fill = "black";
        this.graphic_stroke = "black";
        this.graphic_stroke_width = 1;
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

    scene_data() {
        let text = "Scene: " + this.name + "\n";
        text += this.enabled ? "enabled\n" : "disabled\n";
        text += "Contains " + this.actionGroups.length + " action groups\n";
        text += this.images.length + " images\n";
        text += this.sprites.length + " sprites\n"; 
        return text;
    }

    list_sprites() {
        let text = "Sprites in Scene " + this.name + "\n";
        for (let i = 0; i < this.sprites.length; i++ ) {
            const sprite = this.sprites[i];
            const x = sprite.loc_x.value();
            const y = sprite.loc_y.value();
            const z = sprite.depth;
            text += `${sprite.name} (${sprite.type}) `;
            text += sprite.visible ? "visible" : "hidden";
            text += ` at ${x} ${y} ${z}\n`;
        }
        return text;
    }

    list_images() {
        let text = "Images in Scene " + this.name + "\n";
        for (let i = 0; i < this.images.length; i++ ) {
            const image = this.images[i];
            text += `Name ${image.name} `;
            text += image.loading ? "loaded" : "loading";
            text += ` from ${image.url}\n`;
        }
        return text;
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
            return false;
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
            // Add an empty action group to the top level for interactive actions
            const dummyActionGroup = new Utils.ActionGroup();
            top.actionGroups.push(dummyActionGroup);
            Globals.scenes.push(top);
        }
        return true;
    }

    stop() {
        this.enabled = false;
        this.actionGroups = [];
        // delete any resources
        for (let i = 0; i < this.sprites; i++) {
            const  sprite = this.sprites[i];
            if (sprite.enabled) { // Pixi sprite exists
                sg_sprite.pi_sprite.destroy();
            }
        }
        // delete any variables
        this.varList = null;
        this.sprites = [];
        this.images = [];
        if (this.completion_callback != null) {
            this.completion_callback();
            this.completion_callback = null;
        }
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

    start(message) {
        this.enabled = false; // prevent any updating
        this.actionGroups = [];
        this.message = message;
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

   ########  ##     ## ##    ##  ######   ########   #######  ##     ## ########  
   ##     ## ##     ## ###   ## ##    ##  ##     ## ##     ## ##     ## ##     ## 
   ##     ## ##     ## ####  ## ##        ##     ## ##     ## ##     ## ##     ## 
   ########  ##     ## ## ## ## ##   #### ########  ##     ## ##     ## ########  
   ##   ##   ##     ## ##  #### ##    ##  ##   ##   ##     ## ##     ## ##        
   ##    ##  ##     ## ##   ### ##    ##  ##    ##  ##     ## ##     ## ##        
   ##     ##  #######  ##    ##  ######   ##     ##  #######   #######  ##        

**************************************************************************************************/

    runGroup(index, now) {
        let action_group = this.actionGroups[index];
        action_group.reset_count();
        let actions = action_group.actions;
        for ( let i = 0; i < actions.length; i++ ) {
            let action = actions[i];
            this.runAction(action, action_group, now);
        }
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


    runAction(action, action_group, now) {
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
                case "speed":
                    words.shift();
                    Parser.test_word(words, "of");
                    command = "speed";
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
                case "darkness":
                    words.shift();
                    Parser.test_word(words, "of");
                    command = "darken";
                    break;
                case "lightness":
                    words.shift();
                    Parser.test_word(words, "of");
                    command = "lighten";
                    break;
                case "tint":
                    words.shift();
                    Parser.test_word(words, "of");
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
                Globals.log.report(words.join(' '));
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
                    action_group.complete_action("reset");
                    Parser.test_word(words,"sprite");
                    let sprite_tag = Parser.get_word(words);
                    let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                    if (!sg_sprite) { break; }
                    sg_sprite.reset_size(); // go back to original size
                    sg_sprite.jiggle(0,0,0,0);  // stop jiggling
                    sg_spitre.flicker(0); // stop flickering
                    sg_sprite.blink(0,0); // stop blinking (makes invisible)
                    sg_sprite.pulse(0); // Also sets transparency
                    sg_sprite.flip("r"); // go back to original orientation
                    sg_sprite.set_tint("stop"); // original colour
                    sg_sprite.set_blur(0); // unblur
                    sg_spriet.set_skew(0,0); // unskew
                    // sg_sprite.set_trans(100); // solid, but already done
                    sg_sprite.rotate("to",0,"in"); // upright
                    // we do not change the position or the depth, stop any movement
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
                    const sprite_command = Parser.get_word(words);
                    switch (sprite_command) {
                        // more to add here?
                        case "create":
                            {
                                let sprite_tag = false;
                                // should the sprite have a different tag?
                                if (Parser.test_word(words,"named") || !Parser.test_word(words,"from"))  {
                                    sprite_tag = Parser.get_word(words);
                                }
                                Parser.test_word(words,"from");
                                let image_tag = Parser.get_word(words);
                                if (!sprite_tag) {
                                    sprite_tag = image_tag;
                                }
                                let sg_sprite = new SG_sprite(image_tag, sprite_tag);
                                if (Parser.test_word(words,"area")) {
                                    const x = Parser.get_int(words,0);
                                    const y = Parser.get_int(words,0);
                                    const w = Parser.get_int(words,0);
                                    const h = Parser.get_int(words,0);
                                    if (w > 0 && h > 0) {
                                        sg_sprite.image_portion = new PIXI.Rectangle(x,y,w,h);
                                        sq_sprite.size_x.set_target_value(w);
                                        sq_sprite.size_y.set_target_value(h);
                                    }
                                }
                                sg_sprite.set_visibility(false);
                                this.sprites.push(sg_sprite);
                            }
                            break;
                        default:
                            Globals.log.error("Unknown sprite command at line " + line_no);
                        }
                } else {
                    Globals.log.error("Missing sprite data at line " + line_no);
                }
                action_group.complete_action("sprite");
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
                action_group.complete_action("place");
                if (words.length > 0) {
                    let sprite_tag = Parser.get_word(words);
                    let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                    if (!sg_sprite) {
                        break;
                    }
                    const hidden = Parser.test_word(words,"hidden");
                    // is there a location for the sprite?
                    Parser.test_word(words, "at");
                    if (Parser.test_word(words,["center","centre"])) {
                        sg_sprite.loc_x.set_target_value(Globals.app.screen.width / 2);
                        sg_sprite.loc_y.set_target_value(Globals.app.screen.height / 2);
                    } else {
                        sg_sprite.loc_x.set_target_value(Parser.get_int(words, 0) * Globals.script_scale_x);
                        sg_sprite.loc_y.set_target_value(Parser.get_int(words, 0) * Globals.script_scale_y);
                    }
                    // is there a depth provided?
                    Parser.test_word(words,"depth");
                    sg_sprite.depth = Parser.get_int(words, 0);
                    // is there a size? (or just use image size)
                    Parser.test_word(words, ["size","scale"]); // separate these?
                    const width = Parser.get_int(words,0);
                    const height = Parser.get_int(words,0);
                    if (width > 0 && height > 0) {
                        sg_sprite.size_x.set_target_value(width * Globals.script_scale_x);
                        sg_sprite.size_y.set_target_value(height * Globals.script_scale_y);
                    }
                    // Got all the data, now create the sprite
                    if (!hidden) {
                        sg_sprite.set_visibility(true);
                    }
                } else {
                    Globals.log.error("Missing place data" + " at line " + line_no);
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
                action_group.complete_action("replace");
                if (words.length > 0) {
                    // which (already loaded) image to use?
                    let sprite_tag = words.shift();
                    Parser.test_word(words,"with");
                    let image_tag = words.shift();
                    let hidden = Parser.test_word(words,"hidden");
                    let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                    if (!sg_sprite) { break; }
                    if (hidden) {
                        sg_sprite.set_visibility(false);
                    }
                    // set the new image and delete existing texture
                    // (will be picked up in the next  update)
                    sg_sprite.image_tag = image_tag;
                    sg_sprite.pi_sprite.texture = PIXI.Texture.EMPTY;
                } else {
                    Globals.log.error("Missing replace data" + " at line " + line_no);
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
                    let image_tag = words.shift();
                    let sprite_tag = null;
                    // should the sprite have a different tag?
                    if (Parser.test_word(words,"named")) {
                        sprite_tag = Parser.get_word(words, image_tag);
                    }
                    Parser.test_word(words,["as","at"]);
                    let role = Parser.test_word(words,["background","backdrop","top","bottom","left",
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
                        Globals.log.error("Unknown role " + role + " at line " + line_no);
                        break;
                    } // else 
                    if ( sprite_tag == null ) {
                        sprite_tag = role;
                    }
                    let sg_sprite = new SG_sprite(image_tag, sprite_tag);
                    sg_sprite.role = role;
                    Parser.test_word(words,["as","at"]);
                    if (Parser.test_word(words,"depth")) {
                        sg_sprite.depth = Parser.get_int(words, 0);
                    } else {
                        sg_sprite.depth = null; // let the system set it instead
                    }
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
                    const text_command = words.shift();
                    const text_tag = words.shift();
                    const text_args = words.join(" ");
                    let sg_sprite = null;
                    if (text_command == "create") {
                        sg_sprite = new SG_sprite(null, text_tag, defaults.SPRITE_TEXT);
                        const text_item = new PIXI.Text({
                            text: text_args,
                                style: {
                                fontFamily: sg_sprite.text_font,
                                fontSize: sg_sprite.text_size,
                                fill: sg_sprite.fill_colour,
                                align: sg_sprite.text_align,
                            }
                        });
                        sg_sprite.pi_sprite = text_item;
                        sg_sprite.pi_sprite.anchor = 0.5;
                        sg_sprite.set_visibility(false);
                        sg_sprite.size_x.set_target_value(text_item.width);
                        sg_sprite.size_y.set_target_value(text_item.height);
                        Globals.root.addChild(text_item);
                        this.sprites.push(sg_sprite);
                        action_group.complete_action("text");
                        break;
                    } // else
                    sg_sprite = SG_sprite.get_sprite(this.name, text_tag);
                    if (sg_sprite.type != defaults.SPRITE_TEXT) {
                        Globals.log.error("Sprite is not text at " + line_no);
                        action_group.complete_action("text");
                        break;
                    }
                    let do_update = true;
                    switch(text_command) {
                        case "font":
                        case "fontfamily":
                            sg_sprite.text_font = text_args;
                            break;
                        case "fontsize":
                        case "size":
                            sg_sprite.text_size = text_args;
                            break;
                        case "align":
                            sg_sprite.text_align = text_args;
                            break;
                        case "color":
                        case "colour":
                        case "fill":
                            sg_sprite.fill_colour = text_args;
                            break;
                        case "stroke":
                            sg_sprite.stroke_colour = text_args;
                            break;
                        case "add":
                           sg_sprite.pi_sprite.text += "\n" + text_args;
                           break;
                        case "replace":
                           sg_sprite.pi_sprite.text = text_args;
                           break;
                        default:
                            do_update = false;
                            Globals.log.error("Unknown text command at " + line_no);
                            break;
                        }
                        if (do_update) {
                            sg_sprite.set_style();
                            sg_sprite.size_x.set_target_value(sg_sprite.pi_sprite.width);
                            sg_sprite.size_y.set_target_value(sg_sprite.pi_sprite.height);
                        }
                } else {
                    Globals.log.error("Missing argument at line " + line_no);
                }
                action_group.complete_action("text");
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
                    const graphic_command = Parser.get_word(words);
                    switch (graphic_command) {
                        case"create":
                            const graphic_tag = Parser.get_word(words);
                            Parser.test_word(words,"as");
                            const graphic_type = Parser.get_word(words);
                            let graphic = null;
                            switch (graphic_type) {
                                case "rectangle":
                                case "rect": 
                                    {
                                        const w = Parser.get_int(words,0);
                                        const h = Parser.get_int(words,w);
                                        const r = Parser.get_int(words,0);
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
                                        const r = Parser.get_int(words,0);
                                        if (r > 0) {
                                            graphic = new PIXI.Graphics().circle(0, 0, r);
                                        }
                                    }
                                    break;
                                 case "line":
                                    {
                                        const l = Parser.get_int(words,0);
                                        if (r > 0) {
                                            graphic = new PIXI.Graphics().moveTo(l / -2, 0).lineTo(l/2, 0);
                                        }
                                    }
                                    break;                               
                                case "ellipse":
                                    {
                                        const w = Parser.get_int(words,0);
                                        const h = Parser.get_int(words,w);
                                        if (w > 0 && h > 0) {
                                            graphic = new PIXI.Graphics().ellipse(w/-2, h/-2, w, h);
                                        }
                                    }
                                    break;
                                case "star":
                                    {
                                        const p = Parser.get_int(words,0);
                                        const ro = Parser.get_int(words,0);
                                        let ri = Parser.get_int(words,0);
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
                                        const x = Parser.get_int(words,0);
                                        const y = Parser.get_int(words, x);
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
                                    Globals.log.error("Unknown graphic type at " + line_no);
                                    break;
                            }
                            if (graphic != null) {
                                graphic.fill(this.graphic_fill).stroke({width: this.graphic_stroke_width, color: this.graphic_stroke});
                                Globals.root.addChild(graphic);
                                const sg_sprite = new SG_sprite(null, graphic_tag, defaults.SPRITE_GRAPHIC);
                                sg_sprite.pi_sprite = graphic;
                                sg_sprite.set_visibility(false);
                                sg_sprite.size_x.set_target_value(graphic.width);
                                sg_sprite.size_y.set_target_value(graphic.height);
                                this.sprites.push(sg_sprite);
                            } else {
                                Globals.log.error("Invalid graphic arguments at " + line_no);
                            }
                            break;
                        case "fill":
                        case "color":
                        case "colour":
                            this.graphic_fill = Parser.get_word(words,"black");
                            break;
                        case "stroke":
                            if (Parser.test_word(words,"width")) {
                                this.graphic_stroke_width = Parser.get_int(words,1);
                            } else {
                                this.graphic_stroke = Parser.get_word(words,"black");
                            }
                            break;
                        default:
                            Globals.log.error("Unknown graphics command at " + line_no);
                            break;
                    }
                } else {
                    Globals.log.error("Missing argument at line " + line_no);
                }
                action_group.complete_action("graphic");
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
                    let sprite_tag = words.shift();
                    let by_or_to = Parser.get_word(words, ["by","to"]);
                    if (by_or_to === false) {
                        Globals.log.error("Expected by or to on line " + line_no);
                        break;
                    }
                    let x = Parser.get_int(words, 0) * Globals.script_scale_x;
                    let y = Parser.get_int(words, 0) * Globals.script_scale_y;
                    let in_or_at = Parser.test_word(words, ["in","at"], "in");
                    let duration = Parser.get_duration(words,0);
                    let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                    if (!sg_sprite) { 
                        action_group.complete_action("moveX");
                        break; 
                    }
                    sg_sprite.move(x, y, by_or_to, in_or_at, duration, now, Utils.makeCompletionCallback(action_group));
                } else {
                    Globals.log.error("Missing move data" + " at line " + line_no);
                    action_group.complete_action("moveX");
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
                let sprite_tag = words.shift();
                Parser.test_word(words,"to");
                let speed = Parser.get_int(words, 0) * Globals.script_scale_x;
                let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                sg_sprite.set_speed(speed);
                // speed change is instantaneous
                action_group.complete_action("speed");
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
                    let sprite_tag = words.shift();
                    let depth_type = Parser.get_word(words, ["to", "by"]);
                    if (depth_type === false) {
                        Globals.log.error("Expected to or by on line " + line_no);
                        break;
                    }
                    let value = Parser.get_int(words, 0);
                    if (command == "lower") {
                        value = -value;
                    }
                    let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                    if (sprite != null) {
                        sg_sprite.set_depth(depth_type, value);
                    }
                } else {
                    Globals.log.error("Missing raise/lower data at line " + line_no);
                }
                action_group.complete_action("raise");
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
                    let duration = Parser.get_duration(words, 0);
                    let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                    if (!sg_sprite) { 
                        action_group.complete_action("resize");
                        break; 
                    }
                    sg_sprite.resize( w, h, to_or_by, in_or_at, duration, now,
                        Utils.makeCompletionCallback(action_group)
                    );
                } else {
                    Globals.log.error("Missing resize data at line " + line_no);
                    action_group.complete_action("resize");
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
                    let sprite_tag = Parser.get_word(words);
                    const action = Parser.test_word(words, ["to", "by"]);
                    let w = Parser.get_int(words, 0);
                    let h = Parser.get_int(words, 0);
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
                    Parser.test_word(words, "in");
                    let duration = Parser.get_duration(words, 0);
                    let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                    if (!sg_sprite) { 
                        action_group.complete_action("scale");
                        break; 
                    }
                    if  (action == "reset") {
                        sg_sprite.reset_size();
                        action_group.complete_action("scale");
                    } else if (w > 0 || h > 0) {
                        sg_sprite.scale( w, h, duration, now,
                            Utils.makeCompletionCallback(action_group));
                    } else {
                        Globals.log.error("Invalid scale data at line " + line_no);
                        action_group.complete_action("scale");
                    }
                } else {
                    Globals.log.error("Missing scale data at line " + line_no);
                    action_group.complete_action("scale");
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
                    let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                    if (!sg_sprite) { 
                        action_group.complete_action("rotate");
                        break; 
                    }
                    sg_sprite.rotate(turn_type, value, dur_type, duration, now, Utils.makeCompletionCallback(action_group));
                } else {
                    Globals.log.error("Missing rotate data" + " at line " + line_no);
                    action_group.complete_action("rotateX");
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
                    let sprite_tag = words.shift();
                    let skew_type = Parser.test_word(words, ["to","by","at"], "to");
                    let skew_x = Parser.get_int(words,0);
                    let skew_y = Parser.get_int(words,0);
                    let dur_type = Parser.test_word(words, ["in", "per"], "in");
                    let duration = Parser.get_duration(words, 0);
                    let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                    if (!sg_sprite) { 
                        action_group.complete_action("skew");
                        break; 
                    }
                    sg_sprite.set_skew(skew_x, skew_y, skew_type, duration, now, Utils.makeCompletionCallback(action_group));
                } else {
                    Globals.log.error("Missing skew data" + " at line " + line_no);
                    action_group.complete_action("skew");
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
                    let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                    if (!sg_sprite) { 
                        action_group.complete_action("throw");
                        break; 
                    }
                    if (stop_or_at == "stop") {
                        sg_sprite.throw("stop");
                    } else {
                        sg_sprite.throw(angle, initial_velocity, now, Utils.makeCompletionCallback(action_group));
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
                    let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                    if (!sg_sprite) { 
                        action_group.complete_action("drop");
                        break; 
                    }
                    if (Parser.test_word(words, "stop")) {
                        sg_sprite.throw("stop");
                    } else {
                        sg_sprite.throw(180, 0, now,Utils.makeCompletionCallback(action_group));
                    }
                } else {
                    Globals.log.error("Missing drop data" + " at line " + line_no);
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
                action_group.complete_action();
                if (words.length > 0) {
                    let sprite_tag = words.shift();
                    let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                    if (!sg_sprite) { break; }
                    let axis = Parser.get_word(words,"h");
                    sg_sprite.flip(axis.charAt(0));
                } else {
                    Globals.log.error("Missing sprite tag" + " at line " + line_no);
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
                action_group.complete_action();
                if (words.length > 0) {
                    let sprite_tag = words.shift();
                    let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                    if (!sg_sprite) { break; }
                    if (command == "show") {
                        sg_sprite.set_visibility(true);
                    } else if (command == "hide") {
                        sg_sprite.set_visibility(false);
                    } else if (command == "toggle") {
                        sg_sprite.set_visibility("toggle");
                    }
                } else {
                    Globals.log.error("Missing sprite tag" + " at line " + line_no);
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
                    const scene_name = Parser.get_word(words);
                    const scene = Scene.find(scene_name);
                    if (scene !== false) {
                        this.completion_callback = Utils.makeCompletionCallback(action_group);
                        scene.start(words.join(" "));
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
            case "halt":
                this.completion_callback = Utils.makeCompletionCallback(action_group);
                if (words.length > 0) {
                    while (words.length > 0) {
                        const stop_type = Parser.test_word(words, ["scene", "audio", "sound", "track", "sprite"]);
                        const item = words.shift();
                        if (item == null) {
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
                                scene.stop();
                            }
                        } else if (stop_type == "sprite") {
                            let sg_sprite = SG_sprite.get_sprite(this.name, item, false);
                            if (sprite != null) {
                                sg_sprite.stop();
                            }
                        } else if (AudioManager.exists(item)) {
                            AudioManager.delete(item);
                        } else {
                            const scene = Scene.find(item);
                            if (scene !== false) {
                                scene.stop();
                            } else {
                                let sg_sprite = SG_sprite.get_sprite(this.name, item, false);
                                if (sprite != null) {
                                    sg_sprite.stop();
                                }
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

            case "choose":
                if (words.length > 2) {
                    let varName = words.shift();
                    Parser.test_word(words,"from");
                    this.varList.create(varName, words[Math.floor(Math.random() * words.length)]);
                } else {
                    Globals.log.error("Missing variable name at line " + line_no);
                }
                action_group.complete_action("choose");
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
                action_group.complete_action("flicker"); // not really, but also not very important
                if (words.length > 0) {
                    let sprite_tag = words.shift();
                    let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                    if (!sg_sprite) { break; }
                    let on_off = Parser.test_word(words,["by","stop"]);
                    if (on_off == "stop") {
                        sg_sprite.flicker(0,0);
                    } else {
                        let flicker_size = Parser.get_int(words,0,0,50) * Globals.script_scale_x;
                        Parser.test_word(words,"with");
                        Parser.test_word(words,"chance");
                        let flicker_chance = Parser.get_int(words,50);
                        sg_sprite.flicker(flicker_size, flicker_chance);
                    }
                } else {
                    Globals.log.error("Missing values at line " + line_no);
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
                action_group.complete_action("jiggle"); // not really, but also not very important
                if (words.length > 0) {
                    let sg_sprite_tag = words.shift();
                    let sg_sprite = SG_sprite.get_sprite(this.name, sg_sprite_tag);
                    if (!sg_sprite) { break; }
                    let on_off = Parser.test_word(words,["by","stop"]);
                    if (on_off == "stop") {
                        sg_sprite.jiggle(0,0,0);
                    } else {
                        let jiggle_x = Parser.get_int(words,0) * Globals.script_scale_x;
                        let jiggle_y = Parser.get_int(words,0) * Globals.script_scale_y;
                        let jiggle_r = Parser.get_int(words,0);
                        Parser.test_word(words,"with");
                        Parser.test_word(words,"chance");
                        let jiggle_chance = Parser.get_int(words,50);
                        sg_sprite.jiggle(jiggle_x, jiggle_y, jiggle_r, jiggle_chance);
                    }
                } else {
                    Globals.log.error("Missing values at line " + line_no);
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
                action_group.complete_action("flash"); // not really, but also not very important
                if (words.length > 0) {
                    let sg_sprite_tag = words.shift();
                    let sg_sprite = SG_sprite.get_sprite(this.name, sg_sprite_tag);
                    if (!sg_sprite) { break; }
                    let flash_count = Parser.get_int(words,0,1,10);
                    sg_sprite.flash(flash_count, now);
                } else {
                    Globals.log.error("Missing values at line " + line_no);
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
                action_group.complete_action("blink"); // not really, but also not very important
                if (words.length > 0) {
                    let sg_sprite_tag = words.shift();
                    let sg_sprite = SG_sprite.get_sprite(this.name, sg_sprite_tag);
                    if (!sg_sprite) { break; }
                    let on_off = Parser.test_word(words,["at","stop"]);
                    if (on_off == "stop") {
                        sg_sprite.blink(0, 0, now);
                    } else {
                        let blink_rate = Parser.get_int(words,0,1,10);
                        Parser.test_word(words,"per");
                        Parser.test_word(words,"second");
                        Parser.test_word(words,"with");
                        Parser.test_word(words,"chance");
                        let blink_chance = Parser.get_int(words,100,0,100);
                        sg_sprite.blink(blink_rate, blink_chance, now);
                    }
                } else {
                    Globals.log.error("Missing values at line " + line_no);
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
                action_group.complete_action("pulse"); // not really, but also not very important
                if (words.length > 0) {
                    let sg_sprite_tag = words.shift();
                    let sg_sprite = SG_sprite.get_sprite(this.name, sg_sprite_tag);
                    if (!sg_sprite) { break; }
                    let on_off = Parser.test_word(words,"stop");
                    if (on_off == "stop") {
                        sg_sprite.pulse(0, 0, 100, now);
                    } else {
                        Parser.test_word(words,"at");
                        let pulse_rate = Parser.get_int(words,0,1,10);
                        Parser.test_word(words,"per");
                        Parser.test_word(words,"second");
                        Parser.test_word(words,"from");
                        let pulse_min = Parser.get_int(words,0,0,100);
                        Parser.test_word(words,"to");
                        let pulse_max = Parser.get_int(words,100,0,100);
                        sg_sprite.pulse(pulse_rate, pulse_min, pulse_max, now);
                    }
                } else {
                    Globals.log.error("Missing values at line " + line_no);
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
                        let sg_sprite_tag = words.shift();
                        let sg_sprite = SG_sprite.get_sprite(this.name, sg_sprite_tag);
                        if (!sg_sprite) { 
                            action_group.complete_action("fade");
                            break; 
                        }
                        let fade_type = Parser.test_word(words,["to","by", "up", "down"],"to");
                        let value = Parser.get_int(words,100);
                        Parser.test_word(words, "in");
                        let duration = Parser.get_duration(words, 0);
                        if (sprite != null) {
                            sg_sprite.set_trans(value, duration, fade_type, now, Utils.makeCompletionCallback(action_group));
                        }
                    } else {
                        Globals.log.error("Missing fade parameters");
                        action_group.complete_action("fade");
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
                    action_group.complete_action("wave"); // not really, but also not very important
                    if (words.length > 0) {
                        let sg_sprite_tag = words.shift();
                        let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                        if (!sg_sprite) { break; }
                        let on_off = Parser.test_word(words,["to","stop"]);
                        if (on_off == "stop") {
                            if (command == "wave") {
                                sg_sprite.wave(0, 0, 0);
                            } else {
                                sg_sprite.sway(0, 0, 0);
                            }
                        } else {
                            let wave_max = Parser.get_int(words,0,1,10);
                            Parser.test_word(words,"in");
                            let wave_rate = Parser.get_duration(words,1);
                            Parser.test_word(words,"with");
                            Parser.test_word(words,"chance");
                            let wave_chance = Parser.get_int(words,100,0,100);
                            if (command == "wave") {
                                sg_sprite.wave(wave_max, wave_rate, wave_chance);
                            } else {
                                sg_sprite.sway(wave_max, wave_rate, wave_chance);
                            }
                        }
                    } else {
                        Globals.log.error("Missing values at line " + line_no);
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
                        let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                        if (!sg_sprite) {
                            action_group.complete_action("blur");
                            break;
                        }
                        let blur_type = Parser.test_word(words,["to","by", "up", "down"],"to");
                        let value = Parser.get_int(words,100);
                        Parser.test_word(words, "in");
                        let duration = Parser.get_duration(words, 0);
                        if (sprite != null) {
                            sg_sprite.set_blur(value, duration, blur_type, now, Utils.makeCompletionCallback(action_group));
                        }
                    } else {
                        Globals.log.error("Missing fade parameters");
                        action_group.complete_action("blur");
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
                    action_group.complete_action("tint");
                    if (words.length > 0) {
                        let sprite_tag = words.shift();
                        let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                        if (!sg_sprite) { break; }
                        Parser.test_word(words, ["to", "by", "at"]);
                        const value = Parser.get_word(words, "red");
                            sg_sprite.set_tint(value);
                    } else {
                        Globals.log.error("Missing tint colour");
                    }
                    break;

                case "darken":
                case "lighten":
                    if (words.length > 0) {
                        let sprite_tag = words.shift();
                        let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
                        if (!sg_sprite) { 
                            action_group.complete_action(command);
                            break; 
                        }
                        Parser.test_word(words, ["to", "by", "at"]);
                        let value = Parser.get_int(words, 0, 0, 100);
                        if (command == "lighten") {
                            value = 100 - value;
                        }
                        Parser.test_word(words, "in");
                        let duration = Parser.get_duration(words, 0);
                        sg_sprite.set_tint(value, duration, now, Utils.makeCompletionCallback(action_group));
                    } else {
                        Globals.log.error("Missing " + command + " parameters");
                        action_group.complete_action(command);
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
                const type = Parser.get_word(words,"scene");
                const arg = Parser.get_word(words);
                switch(type) {
                    case "scene":
                        if (arg) {
                            const list_scene = Scene.find(arg);
                            if (list_scene) {
                                Globals.log.report(list_scene.scene_data());
                            }
                        } else {
                            Globals.log.report(this.scene_data());
                        }
                        break;
                    case "sprites":
                        if (arg) {
                            const list_scene = Scene.find(arg);
                            if (list_scene) {
                                Globals.log.report(list_scene.list_sprites());
                            }
                        } else {
                            Globals.log.report(this.list_sprites());
                        }
                        break;
                    case "images":
                        if (arg) {
                            const list_scene = Scene.find(arg);
                            if (list_scene) {
                                Globals.log.report(list_scene.list_images());
                            }
                        } else {
                            Globals.log.report(this.list_images());
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
