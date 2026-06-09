import { SGImage, SGSprite } from "./sgsprite.js";
import * as Triggers from "./triggers.js";
import * as Utils from "./utils.js";
import { Globals } from "./globals.js";
import { VarList, TagList } from "./vars.js";
import { AudioManager } from "./audio.js";
import defaults from "./defaults.js";
import { WordList } from "./wordlist.js";
import * as constants from './constants.js';
import { GraphicFactory } from "./graphicfactory.js";
import { TextFactory } from "./textfactory.js";

/**************************************************************************************************

    ######   ######  ######## ##    ## ######## ######## ######## ##     ## ######## 
   ##    ## ##    ## ##       ###   ## ##          ##    ##        ##   ##     ##    
   ##       ##       ##       ####  ## ##          ##    ##         ## ##      ##    
    ######  ##       ######   ## ## ## ######      ##    ######      ###       ##    
         ## ##       ##       ##  #### ##          ##    ##         ## ##      ##    
   ##    ## ##    ## ##       ##   ### ##          ##    ##        ##   ##     ##    
    ######   ######  ######## ##    ## ########    ##    ######## ##     ##    ##    

**************************************************************************************************/

export class SceneText {
    constructor(name, folder) {
        this.name = name;
        this.content = [];
        this.folder = folder;
        this.tags = new TagList();
    }

    addContent(lines) {
        this.text += text;
    }

    getContent() {
        return this.text;
    }

    static find(sceneName, report = true) {
        for (let i = 0; i < Globals.sceneTexts.length; i++) {
            if (sceneName == Globals.sceneTexts[i].name) {
                return Globals.sceneTexts[i];
            }
        } // else
        if (report) {
            Globals.log.error("Cannot find scene text " + sceneName);
        }
        return false;
    }

}

/**************************************************************************************************

    ######   ######  ######## ##    ## ######## 
   ##    ## ##    ## ##       ###   ## ##       
   ##       ##       ##       ####  ## ##       
    ######  ##       ######   ## ## ## ######   
         ## ##       ##       ##  #### ##       
   ##    ## ##    ## ##       ##   ### ##       
    ######   ######  ######## ##    ## ######## 

**************************************************************************************************/

export class Scene {
    constructor(sceneText, name) {
        this.sceneText = sceneText;
        this.name = name;
        this.interactive_index = 0;
        this.reset();
        this.load(sceneText);
        this.state = constants.SCENE_LOADED;
        this.runnable = false;
        this.args = "";
        // put new scenes at the front so they execute *before*
        // script that started them
        Globals.scenes.unshift(this);
        this.instance = Globals.unique();
        Globals.lastId = this.instance;
    }

    reset() {
        // Data for this scene
        this.actionGroups = [];
        this.images = [];
        this.sprites = [];
        this.varList = new VarList(this);
        this.defaultTags = [];
        this.tags = [...this.sceneText.tags.tags];
        // Scene information
        this.currentGroup = false;
        this.fromFolder = "";
        this.urlFolder = this.sceneText.folder; // where should we load from?
        this.spriteScene = this.name;
        // this.parameters = defaults.NOTFOUND;
        this.gravity = defaults.GRAVITY_PS2;
        this.groundLevel = false;
        // Graphic creation
        this.graphicFactory = new GraphicFactory();
        // Text creation
        this.textFactory = new TextFactory();
        // debug
        this.echo = false;
        // callback handling
        this.finished = false;
        this.completionCallback = null;
    }

    static find(sceneName, report = true) {
        let useName = true;
        if (sceneName == "LAST") {
            sceneName = Globals.lastId;
            useName = false;
        } else if (!sceneName.match(/[a-zA-Z]/)) {
            useName = false;
        }
        for (let i = 0; i < Globals.scenes.length; i++) {
            if (useName && sceneName == Globals.scenes[i].name) {
                return Globals.scenes[i];
            } else if (sceneName == Globals.scenes[i].instance) {
                return Globals.scenes[i];
            }
        } // else
        if (report) {
            Globals.log.error("Cannot find scene " + sceneName);
        }
        return false;
    }

    static findName(sceneName) {
        let response = [];
        for (let i = 0; i < Globals.scenes.length; i++) {
            if (sceneName == Globals.scenes[i].name) {
                response.push(Globals.scenes[i].instance); 
            }
        }
        return response;
    }

    static findInstance(instance) {
        for (let i = 0; i < Globals.scenes.length; i++) {
            if (instance == Globals.scenes[i].instance) {
                return Globals.scenes[i];
            }
        }
        return false;
    }

    appendNew(original, additional) {
        let origNames = [];
        for (let j = 0; j < original.length; j++) {
            origNames.push(original[i].name);
        }
        for (let i = 0; i < additional.length; i++) {
            if (!origNames.includes(additional[i].name)) {
                original.push(additional[i]);
            }
        }
    }

    merge(other) {
        // if (other.state != constants.SCENE_STOPPED) {
        //     Globals.log.error("Can only merged with a stopped scene");
        //     return;
        // }
        // content is simply appended
        this.content = this.content.concat(other.content);
        // Images are merged but existing named items are NOT overwritten
        this.images = this.appendNew(this.images, other.images);
        // same for sprites
        this.sprites = this.appendNew(this.sprites, other.sprites);
        // And action groups (only if the other scene is running)
        this.actionGroups = this.appendNew(this.actionGroups, other.actionGroups);
        // just append the default tags (duplicates don't matter)
        this.defaultTags = this.defaultTags.concat(other.defaultTags);
        // same for our own, actual tags
        this.TagList.addTag(other.TagList.tags);
        // but don't overwrite variables
        this.varList.variables = merge(this.varList.variables, other.varList.variables);
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
                text += `size ${sx} x ${sy} (${sprite.origX} ${sprite.origY})`;
                if (sprite.sgParent) {
                    text += `child of ${sprite.sgParent.name}`;
                }
                // if (sprite.type == constants.SPRITE_GROUP || sprite.type == constants.SPRITE_GRAPHIC) {
                    const bounds = sprite.piSprite.getLocalBounds();
                    text += `\nlocal bounds ${bounds.width}  ${bounds.height}\n`;
                    const gbounds = sprite.piSprite.getBounds();
                    text += `global bounds ${gbounds.width}  ${gbounds.height}\n`;
                    const size = sprite.piSprite.getSize();
                    text += `size ${size.width}  ${size.height}\n`;
                // }
                text += "\n";
            } else {
                text += `${sprite.name} `;
            }
        }
        return text;
    }

    listSpriteTags(tag) {
        if (!Array.isArray(tag)) {
            tag = [tag];
        }
        let result = "";
        let first = true;
        for (let i = 0; i < this.sprites.length; i++ ) {
            for (let j = 0; j < tag.length; j++) {
                if (this.sprites[i].tags.hasTag(tag[j])) {
                    if (first) {
                        first = false;
                    } else {
                        result += " ";
                    }
                    result += this.sprites[i].name;
                    break; // don't need to check the rest of tags
                }
            }
        }
        return result;
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

    listImageTags(tag) {
        if (!Array.isArray(tag)) {
            tag = [tag];
        }
        let result = "";
        let first = true;
        for (let i = 0; i < this.images.length; i++ ) {
            for (let j = 0; j < tag.length; j++) {
                if (this.images[i].tags.hasTag(tag[j])) {
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
        return result;
    }

    async fetchRSSFeed(url) {
        try {
            const response = await fetch(`${defaults.CORS_PROXY}${url}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const rssText = await response.text();
            return rssText;
        } catch (error) {
            console.error('Error fetching RSS feed:', error);
        }
    }

    parseRSS(rssText) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(rssText, 'text/xml');
        return xmlDoc;
    }

    async getVariableFromRSS(varName, url, item, callback) {
        callback(1);
        const rawData = await this.fetchRSSFeed(url);
        const xmlDoc = this.parseRSS(rawData);
        const items = xmlDoc.getElementsByTagName('item');
        const thisItem = items[item - 1];
        this.varList.setValue(`${varName}[title]`, thisItem.getElementsByTagName('title')[0].textContent);
        this.varList.setValue(`${varName}[description]`, thisItem.getElementsByTagName('description')[0].textContent);
        this.varList.setValue(`${varName}[link]`, thisItem.getElementsByTagName('link')[0].textContent);
        this.varList.setValue(`${varName}[date]`, thisItem.getElementsByTagName('pubDate')[0].textContent);
        callback(-1);
    }

    async getVariableFromURL(varName, url, callback) {
        callback(1);
        try {
            const response = await fetch(`${defaults.CORS_PROXY}${url}`);
            if (!response.ok) {
                Globals.log.error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
                this.varList.setValue(varName, defaults.NOTFOUND);
            } else {
                const text = await response.text();
                const lines = text.split(/\r?\n/);
                for (i = 0; i < lines.length; i++) {
                    this.varList.setValue(`${varName}[${i}]`, lines[i]);
                }
            }
        } catch (error) {
            Globals.log.error("Failed to fetch URL: " + error.message);
            this.varList.setValue(varName, defaults.NOTFOUND);
        }
        callback(-1);
    }


    stop(reset = false) {
        this.state  = constants.SCENE_STOPPED;
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
        this.finished = true;
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

    folderPrefix(filename) {
        // Folder logic:
        // if filename looks like an absolute URL, use as is
        // else if this.fromFolder is set, use that
        // else use scene.URLFolder
        const mainScene = Scene.find(constants.MAIN_NAME);
        let prefix = "";
        if (filename.startsWith("http:") || filename.startsWith("https:")
            || filename.startsWith(".") || filename.startsWith('/')) {
            prefix = "";
        } else if (this.fromFolder) {
            prefix = this.fromFolder;
        } else if (mainScene.fromFolder) {
            prefix = mainScene.fromFolder;
        } else {
            prefix = this.urlFolder + "/";
        }
        return prefix;
    }

    getSprite(name) {
        for (let i = 0; i < this.sprites.length; i++) {
            if (this.sprites[i].name == name) {
                return this.sprites[i];
            }
        } // else
        return false;
    }

    static manageLifecycle(scene, stateAction = false) {
        // let message = `${scene.name} in state ${scene.state} with ${stateAction} `;
        switch (stateAction) {
            case constants.SCENE_PAUSE:
                if (scene.state == constants.SCENE_RUNNING) {
                    scene.state == constants.SCENE_PAUSED;
                } else {
                    Globals.log.error(`${scene.name} cannot pause (not running)`);
                }
                break;
            case constants.SCENE_RESUME:
                if (scene.state == constants.SCENE_PAUSED) {
                    scene.state == constants.SCENE_RUNNING;
                } else {
                    Globals.log.error(`${scene.name} cannot resume (not paused)`);
                }
                break;
            case constants.SCENE_MAKE_RUNNABLE:
                scene.runnable = true;
                break;
            case constants.SCENE_FINISH:
                scene.state = constants.SCENE_FINISHED;
                break;
            case constants.SCENE_NEXT_STATE:
                switch (scene.state) {
                    case constants.SCENE_LOADED: // Scene just been created
                        scene.state = constants.SCENE_SETUP; // scene has completed setup
                        break;
                    case constants.SCENE_SETUP:
                        if (scene.runnable) {
                            scene.state = constants.SCENE_READY;
                        }
                        break;
                    case constants.SCENE_READY:
                        scene.state = constants.SCENE_RUNNING;
                        break;
                    case constants.SCENE_FINISHED:
                        scene.state = constants.SCENE_DELETE_ME;
                        break;
                    case constants.SCENE_RUNNING:
                    case constants.SCENE_PAUSED:
                        break;
                    case constants.SCENE_DELETE_ME:
                        for (let i = 0; i < scene.sprites.length; i++) {
                            if (scene.sprites[i]) {
                                scene.sprites[i].piSprite.destroy();
                            }
                        }
                        for (let i = 0; i < Globals.scenes; i++) {
                            if (scene === Globals.scenes[i]) {
                                Globals.scenes.splice(i,1);
                                break;
                            }
                        }
                        break;
                    default:
                        break;
                }
                break;
        }
        // Globals.log.report(`${message} is now ${scene.state}`);
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

    load(sceneText) {
        this.actionGroups = [];
        let actionGroup = new Utils.ActionGroup();
        let state = "T";
        let timestamp = Date.now(); // Use same timestamp for all
        for (let i = 0; i < sceneText.content.length; i++) {
            let trigger = null;
            const lineNo = sceneText.content[i].number;
            const wordList = new WordList(sceneText.content[i].text);
            const keyword = wordList.getWord();
            // First look for triggers
            switch(keyword.toLowerCase()) {
                case 'cue':
                case 'cues':
                case 'trigger':
                case 'triggers':
                    wordList.testWord("on");
                    const allOrAny = wordList.testWord(["all","any"]);
                    if (allOrAny == "all") {
                        actionGroup.anyTrigger = false;
                    } else if (allOrAny == false) {
                        Globals.log.error("Unknown when condition - ");
                    } // else this is the default
                    continue;  // go to the next line
                case 'do':
                    // syntactic sugar, marks beginning of actions
                    continue;
                case 'setup':
                case 'init':
                    trigger = new Triggers.Setup(this, timestamp, "");
                    break;
                case 'begin':
                    trigger = new Triggers.Begin(this, timestamp, "");
                    break;
                case 'after':
                    trigger = new Triggers.After(this, timestamp, wordList.joinWords());
                    break;
                case 'when':
                    trigger = new Triggers.When(this, timestamp, wordList.joinWords());
                    break;
                case 'atend':
                    trigger = new Triggers.AtEnd(this, timestamp, wordList.joinWords());
                    break;
                case 'on':
                    let on_word = wordList.getWord();
                    switch (on_word) {
                        case 'key':
                            wordList.testWord("press");
                            trigger = new Triggers.OnKey(this, timestamp, wordList.joinWords());
                            break;
                        case 'call':
                            trigger = new Triggers.OnCall(this, timestamp, wordList.joinWords());
                            break;
                        case 'mouse':
                        case 'click':
                            wordList.testWord("click");
                            trigger = new Triggers.OnClick(this, timestamp, wordList.joinWords());
                            break;
                        default:
                            Globals.log.error("Unknown trigger type on " + on_word + " at line " + lineNo);
                            break;
                        }
                    break;
                case 'onkey':
                    wordList.testWord("press");
                    trigger = new Triggers.OnKey(this, timestamp, wordList.joinWords());
                    break;
                case 'oncall':
                    trigger = new Triggers.OnCall(this, timestamp, wordList.joinWords());
                    break;
                case 'onmouse':
                case 'onclick':
                    wordList.testWord("click");
                    trigger = new Triggers.OnClick(this, timestamp, wordList.joinWords());
                    break;
                case 'at':
                    wordList.testWord("time");
                    trigger = new Triggers.AtClass(this, timestamp, wordList.joinWords());
                    break;
                case 'each':
                    wordList.testWord("time");
                    trigger = new Triggers.Each(this, timestamp, wordList.joinWords());
                    break;
                case 'every':
                    trigger = new Triggers.Every(this, timestamp, wordList.joinWords());
                    break;
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
                Globals.log.error("No trigger for action in scene " + sceneText.name + " at line " + lineNo);
            }
            actionGroup.addAction(sceneText.content[i]);
        }
        this.actionGroups.push(actionGroup);
        this.state = constants.SCENE_LOADED;
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

    runGroup(index, now, start = 0) {
        let actionGroup = this.actionGroups[index];
        let actions = actionGroup.actions;
        this.varList.currentGroup = actionGroup;
        actionGroup.nextAction = start; // start at the top
        if (start == 0) {
            actionGroup.startCounting();
        }
        while (actionGroup.suspended == false && actionGroup.nextAction < actions.length ) {
            this.runAction(actionGroup.nextAction, actionGroup, now);
        }
        if (actionGroup.nextAction >= actions.length) { // we are done
            actionGroup.endCounting();
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
        if (actionGroup.dataVarName != "") {
            const key = wordList.getWord();
            if (key == "enddata") {
                actionGroup.dataVarName = "";
            } else {
                this.varList.setValue(`${actionGroup.dataVarName}[${key}]`,wordList.joinWords());
            }
            return;
        }
        // remove syntactic sugar and default item type
        wordList.testWord(["and","set","sprite"]);
        let command = wordList.getWord().toLowerCase();

        if (!["pause", "endif", "repeat", "then", "endfrom", "endwith", "endfor", "next", "enddata"].includes(command) && wordList.wordsLeft() < 1) {
            Globals.log.error(`Missing ${command} data at line ${action.number}`);
            return;
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
                const request = wordList.getWord("flip");
                const sceneName = wordList.getWord();
                const scene = Scene.find(sceneName);
                switch (request) {
                    case "flip":
                        if (scene) {
                            scene.echo = !scene.echo;
                        } else {
                            this.echo = !this.echo;
                        }
                        break;
                    case "on":
                        if (scene) {
                            scene.echo = true;
                        } else {
                            this.echo = true;
                        }
                        break;
                    case "off":
                        if (scene) {
                            scene.echo = false;
                        } else {
                            this.echo = false;
                        }
                        break;
                    default:
                        Globals.log.error("echo on|off|flip only");
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
                const loadType = wordList.testWord(["image","sound"],"image");
                // Look for a filename
                let name = null;
                let sync = true;
                let filename = wordList.getWord();
                if (!filename) {
                    Globals.log.error(`Missing filename for load at line ${action.number}`);
                    break;
                }
                // look for a name
                wordList.testWord(["named", "as"]);
                if (wordList.wordsLeft() > 0) {
                    name = wordList.getWord();
                } else { // use file basename as name
                    let slash = filename.lastIndexOf('/');
                    let dot = filename.lastIndexOf('.');
                    name = filename.slice(slash + 1, dot);
                }
                const prefix = this.folderPrefix(filename);
                switch(loadType) {
                    case "image":
                        if (wordList.testWord("no") && wordList.testWord(["delay","waiting"])) {
                            sync = false;
                        }
                        // check if resource already loaded (don't reload)
                        for ( let j = 0; j < this.images.length; j++) {
                            if (this.images[j].name == name) {
                                break; // move on to next action
                            }
                        }
                        wordList.testWord(["cels","cells","frames"]);
                        const cellX = wordList.getInt(0);
                        wordList.testWord("by");
                        const cellY = wordList.getInt(1);
                        const sgImage = new SGImage(prefix + filename, name, actionGroup.callback(), cellX, cellY);
                        sgImage.tags.addTag(wordList.getTags());
                        this.images.push(sgImage);
                        sgImage.load_image();
                        if (sync) {
                            actionGroup.suspend("newImage", actionIndex, sgImage);
                        }
                        break;
                    case "sound":
                        AudioManager.create(name, prefix + filename);
                        break;
                    default: // check for other resource types
                        break;
                    }
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
                this.fromFolder = wordList.getWord() + "/";
                break;
            
            case "endfrom":
                this.fromFolder = "";
                break;

/**************************************************************************************************

   #### ##    ##  ######  ##       ##     ## ########  ######## 
    ##  ###   ## ##    ## ##       ##     ## ##     ## ##       
    ##  ####  ## ##       ##       ##     ## ##     ## ##       
    ##  ## ## ## ##       ##       ##     ## ##     ## ######   
    ##  ##  #### ##       ##       ##     ## ##     ## ##       
    ##  ##   ### ##    ## ##       ##     ## ##     ## ##       
   #### ##    ##  ######  ########  #######  ########  ######## 

**************************************************************************************************/

            case "include":
            case "require":
                const URL = wordList.getWord();
                slowGlass.scriptFromURL(URL, true);
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
                {
                    let tags = [];
                    wordList.testWord(["tag","tags"]);
                    while (wordList.wordsLeft()) {
                        tags.push(wordList.getWord);
                    }
                    this.defaultTags = tags;
                }
                break;

            case "endwith":
                this.defaultTags = [];
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
                            let spriteName = wordList.getSpriteName();
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
                        this.fromFolder = "";
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

            case "create":
                {
                    let spriteName = false;
                    let groupName = null;
                    let sgSprite = null;
                    let imageName = null;
                    let sgImage = null;
                    // should the sprite have a different name?
                    if (wordList.testWord("named") || !wordList.testWord("from"))  {
                        spriteName = wordList.getSpriteName();
                    }
                    const fromURL = wordList.testWord(["load","loaded"]);
                    wordList.testWord("from");
                    if (fromURL) {
                        const filename = wordList.getWord();
                        const prefix = this.folderPrefix(filename);
                        imageName = Globals.unique("image");
                        sgImage = new SGImage(prefix + filename, imageName, actionGroup.callback());
                        this.images.push(sgImage);
                        sgImage.load_image();
                    } else { // which (already loaded) image to use?
                        imageName = wordList.getWord();
                        if (!spriteName) {
                            spriteName = imageName;
                        }
                        if (!SGImage.getImage(this.name, imageName)) {
                            break;
                        }
                    }
                    sgSprite = new SGSprite(imageName, spriteName, constants.SPRITE_IMAGE, this.defaultTags);
                    if (wordList.testWord("view")) {
                        const x = wordList.getInt(0);
                        const y = wordList.getInt(0);
                        const w = wordList.getInt(0);
                        const h = wordList.getInt(0);
                        if (w > 0 && h > 0) {
                            sgSprite.setView(x, y, w, h, "in", 0, now);
                            sgSprite.sizeX.setTargetValue(w);
                            sgSprite.sizeY.setTargetValue(h);
                        }
                    }
                    const piSprite = new PIXI.Sprite({
                            anchor: 0.5,
                            });
                    sgSprite.piSprite = piSprite;
                    sgSprite.tags.addTag(wordList.getTags());
                    this.sprites.push(sgSprite);
                    if (fromURL) {
                        actionGroup.suspend("newImage", actionIndex, sgImage);
                    }
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
                {
                    let spriteName = wordList.getSpriteName();
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
                            actionGroup.callback());
                    } else {
                        Globals.log.error("Not sensible view data at line " + action.number);
                    }
                }
                break;

/**************************************************************************************************

    ######   ######  ########   #######  ##       ##       
   ##    ## ##    ## ##     ## ##     ## ##       ##       
   ##       ##       ##     ## ##     ## ##       ##       
    ######  ##       ########  ##     ## ##       ##       
         ## ##       ##   ##   ##     ## ##       ##       
   ##    ## ##    ## ##    ##  ##     ## ##       ##       
    ######   ######  ##     ##  #######  ######## ######## 

**************************************************************************************************/

            case "scroll":
                {
                    let spriteName = wordList.getSpriteName();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) {
                        break;
                    }
                    if (!sgSprite.windowed) {
                        Globals.log.error("Sprite does not have view window " + action.number);
                        break;
                    }
                    const direction = wordList.testWord(["stop","left","right","up","down"]);
                    wordList.testWord("at");
                    const dx = wordList.getFloat(0);
                    const dy = wordList.getFloat(0);
                    switch (direction) {
                        case "stop":
                            sgSprite.setScroll(0,0);
                            break;
                        case "right":
                            sgSprite.setScroll(dx,0);
                            break;
                        case "left":
                            sgSprite.setScroll(dx * -1,0);
                            break;
                        case "up":
                            sgSprite.setScroll(0, dy * -1);
                            break;
                        case "down":
                            sgSprite.setScroll(0, dy);
                            break;
                        default:
                            sgSprite.setScroll(dx, dy);
                    }
                }
                break;

/**************************************************************************************************

      ###    ##    ## #### ##     ##    ###    ######## ######## 
     ## ##   ###   ##  ##  ###   ###   ## ##      ##    ##       
    ##   ##  ####  ##  ##  #### ####  ##   ##     ##    ##       
   ##     ## ## ## ##  ##  ## ### ## ##     ##    ##    ######   
   ######### ##  ####  ##  ##     ## #########    ##    ##       
   ##     ## ##   ###  ##  ##     ## ##     ##    ##    ##       
   ##     ## ##    ## #### ##     ## ##     ##    ##    ######## 

**************************************************************************************************/

            case "advance":
            case "reverse":
                {
                    let spriteName = wordList.getSpriteName();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) {
                        break;
                    }
                    const byOrTo = wordList.testWord(["to", "by"],"by");
                    let frame = wordList.getInt(1);
                    if (byOrTo == "by") {
                        if (command == "reverse") {
                            frame *= -1;
                        }
                        sgSprite.currentFrame += frame;
                    } else {
                        sgSprite.currentFrame = frame;
                    }
                }
                break;

            case "animate":
                {
                    let spriteName = wordList.getSpriteName();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) {
                        break;
                    }
                    const atOrStop = wordList.testWord(["at", "stop"],"at");
                    if (atOrStop == "stop") {
                        sgSprite.animationRate = 0;
                        break;
                    }
                    const rate = wordList.getInt(1);
                    sgSprite.animationRate = rate;
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
                {
                    let spriteName = wordList.getSpriteName();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) {
                        break;
                    }
                    const hidden = wordList.testWord("hidden");
                    const transparent = wordList.testWord("transparent");
                    const groupSprite = wordList.getInGroup(this.spriteScene);
                    let height = 0;
                    let width = 0;
                    // is there a location for the sprite?
                    wordList.testWord( "at");
                    const location = wordList.testWord(["center","centre","origin"]);
                    switch(location) {
                        case "centre":
                        case "center":
                            sgSprite.locX.setTargetValue(Globals.app.screen.width / 2);
                            sgSprite.locY.setTargetValue(Globals.app.screen.height / 2);
                            break;
                        case "origin":
                            sgSprite.locX.setTargetValue(0);
                            sgSprite.locY.setTargetValue(0);
                            break;
                        default:
                            sgSprite.locX.setTargetValue(wordList.getInt(0));
                            sgSprite.locY.setTargetValue(wordList.getInt(0));
                            break;
                    }
                    // is there a depth provided?
                    wordList.testWord("depth");
                    sgSprite.setDepth("to", wordList.getInt(0));
                    // is there a size? (or just use image size)
                    let dimensionType = wordList.testWord(["size","scale", "width", "height"]); 
                    let dimension1 = 0;
                    let dimension2 = 0;
                    let goodData = true;
                    if (dimensionType) {
                        switch (dimensionType) {
                            case "size":
                                dimension1 = wordList.getInt(0);
                                dimension2 = wordList.getInt(0);
                                if (dimension1 <= 0 || dimension2 <= 0) {
                                    Globals.log.error("Need positive sizes for both dimensions at line " + action.number);
                                    goodData = false;
                                }
                                break;
                            case "scale":
                                dimension1 = wordList.getPercent("0");
                                dimension2 = wordList.getPercent(dimension1);
                                if (dimension1 <= 0 || dimension2 <= 0) {
                                    Globals.log.error("Need positive sizes for both dimensions at line " + action.number);
                                    goodData = false;
                                }
                                break;
                            case "width":
                            case "height":
                                dimension1 = wordList.getInt(0);
                                if (dimension1 <= 0) {
                                    Globals.log.error("Need positive size for height or width at line " + action.number);
                                    goodData = false;
                                }
                                break;
                        }
                        if (!goodData) {
                            break;
                        }
                    } else {
                        dimensionType = "image";
                    }
                    if (!sgSprite.loaded) {
                        // not loaded yet, so we don't know the size, ask for when loaded
                        sgSprite.requestSize(dimensionType, dimension1, dimension2);
                    } else { // just set the size we want
                        sgSprite.applySize(dimensionType, dimension1, dimension2);
                    }
                    if (hidden) {
                        sgSprite.setVisibility(false);
                    }
                    if (transparent) {
                        sgSprite.setTransparency(0, 0, "to");
                    }
                    // update things *before* display, so it doesn't flash up at 0,0
                    sgSprite.update(this, now);
                    if (groupSprite) {
                        sgSprite.sgParent = groupSprite;
                        sgSprite.sgParent.children.push(sgSprite);
                        groupSprite.piSprite.addChild(sgSprite.piSprite);
                    } else {
                        Globals.root.addChild(sgSprite.piSprite);
                    }
                    sgSprite.placed = true;
                    if (sgSprite.type == constants.SPRITE_GROUP) {
                        actionGroup.suspend("placeGroup", actionIndex, sgSprite);
                    }
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
                {
                    // which (already loaded) image to use?
                    let spriteName = wordList.getSpriteName();
                    wordList.testWord("with");
                    const newSprite = wordList.getWord();
                    const matched = wordList.testWord("matched");
                    const sgSprite1 = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite1) { break; }
                    const sgSprite2 = SGSprite.getSprite(this.spriteScene, newSprite);
                    if (!sgSprite2) { break; }
                    sgSprite2.locX.setTargetValue(sgSprite1.locX.value());
                    sgSprite2.locY.setTargetValue(sgSprite1.locY.value());
                    if (matched) {
                        sgSprite2.sizeX.setTargetValue(sgSprite1.sizeX.value());
                        sgSprite2.sizeY.setTargetValue(sgSprite1.sizeY.value());
                    }
                    SGSprite.deleteSprite(this.spriteScene, spriteName);
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
                {
                    // which (already loaded) image to use?
                    let imageName = wordList.getWord();
                    let spriteName = false;
                    // should the sprite have a different name?
                    if (wordList.testWord("named")) {
                        spriteName = wordList.getWord(imageName);
                    }
                    wordList.testWord(["as","at"]);
                    let role = wordList.testWord(["background","backdrop","top","bottom","left",
                            "right","ground","sky","foreground","frame"]);
                    if (role == false) {
                        Globals.log.error("Unknown role " + role + " at line " + action.number);
                        break;
                    } // else 
                    if ( spriteName == false ) {
                        spriteName = role;
                    }
                    if (!SGImage.getImage(this.name, imageName)) {
                        break;
                    }
                    let sgSprite = new SGSprite(imageName, spriteName, constants.SPRITE_IMAGE, this.defaultTags);
                    sgSprite.role = role;
                    wordList.testWord(["as","at"]);
                    if (wordList.testWord("depth")) {
                        sgSprite.depth = wordList.getInt(0);
                    } else {
                        sgSprite.depth = null; // let the system set it instead
                    }
                    // can't set any other properties until we know the image size, so quit for now
                    const piSprite = new PIXI.Sprite({
                            anchor: 0.5,
                            });
                    sgSprite.piSprite = piSprite;
                    sgSprite.tags.addTag(wordList.getTags());
                    sgSprite.placed = true;
                    this.sprites.push(sgSprite);
                    Globals.root.addChild(sgSprite.piSprite);
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
                {
                    switch (wordList.getWord()) {
                        // more to add here?
                        case "create":
                            {
                                wordList.testWord("named");
                                const groupName = wordList.getWord();
                                if (SGSprite.getSprite(this.spriteScene, groupName, false)) {
                                    break; // already exists, but not an error
                                } 
                                const hidden = wordList.testWord("hidden");
                                const sgSprite = new SGSprite(null, groupName, constants.SPRITE_GROUP);
                                const group = new PIXI.Container();
                                group.enableRenderGroup();
                                sgSprite.depth = Globals.nextZ(0);
                                group.zIndex = sgSprite.depth;
                                // sgSprite.loaded = true;
                                sgSprite.piSprite = group;
                                sgSprite.setVisibility(!hidden);
                                sgSprite.tags.addTag(wordList.getTags());
                                // sgSprite.placed = true; // groups are always "placed"
                                this.sprites.push(sgSprite);                           
                            }
                            break;
                        case "add":
                            {
                                const spriteName = wordList.getSpriteName();
                                const sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                                if (!sgSprite) {
                                    Globals.log.error("Sprite not found" + action.number);
                                    break;
                                }
                                const groupSprite = wordList.getInGroup(this.spriteScene);
                                if (!groupSprite) {
                                    break;
                                }
                                sgSprite.sgParent = groupSprite;
                                sgSprite.sgParent.children.push(sgSprite);
                                groupSprite.piSprite.reparentChild(sgSprite.piSprite);
                                break;
                            }
                        case "measure":
                                const groupSprite = wordList.getGroup(this.spriteScene);
                                if (!groupSprite) {
                                    break;
                                }
                                groupSprite.setFromBounds("all");
                                break;
                        default:
                            Globals.log.error("Unknown group command at line " + action.number);
                        }
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
                {
                    const resourceName = wordList.getWord();
                    wordList.testWord("fade");
                    wordList.testWord("in");
                    const fadein = wordList.getDuration(0);
                    wordList.testWord("at");
                    wordList.testWord("volume");
                    const volume = wordList.getInt( 50, defaults.VOLUME_MIN, defaults.VOLUME_MAX);
                    AudioManager.play(resourceName, { fadeInMs: fadein * 1000, targetVolume: volume });
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
                {
                    wordList.testWord("of");
                    const resourceName = wordList.getWord();
                    wordList.testWord("to");
                    const volume = wordList.getInt( 0, defaults.VOLUME_MIN, defaults.VOLUME_MAX);
                    const fadein = wordList.getDuration(0);
                    AudioManager.setVolume(resourceName, volume, { fadeMs: fadein * 1000});
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
                {
                    let sgSprite = null;
                    const {textName, textImage} = this.textFactory.create(wordList);
                    if (textImage != null) {
                        sgSprite = new SGSprite(null, textName, constants.SPRITE_TEXT, this.defaultTags);
                        sgSprite.piSprite = textImage;
                        sgSprite.piSprite.anchor = 0.5;
                        sgSprite.sizeX.setTargetValue(textImage.width);
                        sgSprite.sizeY.setTargetValue(textImage.height);                            
                        sgSprite.origX = textImage.width;
                        sgSprite.origY = textImage.height;
                        sgSprite.loaded = true;
                        this.sprites.push(sgSprite);
                    }
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
                const { graphicName, graphic } = this.graphicFactory.create(wordList);
                if (graphic != null) {
                    const sgSprite = new SGSprite(null, graphicName, constants.SPRITE_GRAPHIC, this.defaultTags);
                    sgSprite.piSprite = graphic;
                    const size = graphic.getSize();
                    sgSprite.sizeX.forceValue(size.width);
                    sgSprite.sizeY.forceValue(size.height);
                    sgSprite.origX = size.width;
                    sgSprite.origY = size.height;
                    sgSprite.tags.addTag(wordList.getTags());
                    sgSprite.loaded = true;
                    this.sprites.push(sgSprite);
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
                {
                    let spriteName = wordList.getSpriteName();
                    const direction = wordList.testWord(["horizontally","hor","h","vertically","vert","v","up","down","left","right"]);
                    let delta = 0;
                    let x = 0;
                    let y = 0;
                    let byOrTo = wordList.testWord( ["by","to"], "by");
                    if (direction !== false) {
                        delta = wordList.getInt(0);
                    } else {
                        x = wordList.getInt(0);
                        y = wordList.getInt(0);
                    }
                    let inOrAt = wordList.testWord( ["in","at"], "in");
                    let duration = wordList.getDuration(0);
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    let callback = false;
                    if (duration > 0) {
                        callback = actionGroup.callback()
                    }
                    switch ( direction ) {
                        case "horizontally":
                        case "hor":
                        case "h":
                        case "right":
                            sgSprite.move(delta, false, byOrTo, inOrAt, duration, now, callback);
                            break;
                        case "left":
                            sgSprite.move(delta * -1, false, byOrTo, inOrAt, duration, now, callback);
                            break;
                        case "vertically":
                        case "vert":
                        case "v":
                        case "down":
                            sgSprite.move(false, delta, byOrTo, inOrAt, duration, now, callback);
                            break;
                        case "up":
                            sgSprite.move(false, delta * -1, byOrTo, inOrAt, duration, now, callback);
                            break;
                        default:
                            sgSprite.move(x, y, byOrTo, inOrAt, duration, now, callback);
                            break;
                    }
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
                {
                    let spriteName = wordList.getSpriteName();
                    wordList.testWord(["around","from"]);
                    let x = wordList.getInt(0);
                    let y = wordList.getInt(0);
                    let duration = wordList.getDuration(0);
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) {
                        break;
                    }
                    sgSprite.pivotPoint(x, y, duration, now, actionGroup.callback());
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
                let spriteName = wordList.getSpriteName();
                wordList.testWord("to");
                let speed = wordList.getInt(0);
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
                {
                    let spriteName = wordList.getSpriteName();
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
                {
                    let spriteName = wordList.getSpriteName();
                    let toOrBy = wordList.testWord( ["to","by", "reset"], "to");
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    if (toOrBy == "reset") {
                        sgSprite.sizeX.setTargetValue(sgSprite.origX);
                        sgSprite.sizeY.setTargetValue(sgSprite.origY);
                        break;
                    }
                    let dimensionType = wordList.testWord(["size", "width", "height"], "size"); 
                    let dimension1 = 0;
                    let dimension2 = 0;
                    switch (dimensionType) {
                        case "width":
                        case "height":
                            dimension1 = wordList.getInt(0);
                            break;
                        case "size":
                        default:
                            dimension1 = wordList.getInt(0);
                            dimension2 = wordList.getInt(0);
                            break;
                    }
                    if (dimensionType == "size") {
                        // Fixups if we don't get both dimensions
                         if (dimension1 <= 0 && dimension2 <= 0) {
                            Globals.log.error(`Bad resize for ${spriteName}`);
                        break;
                         } else if (dimension1 <= 0) {
                            dimensionType = "height";
                            dimension1 = dimension2;
                         } else if (dimension2 <= 0) {
                            dimensionType = "width";
                         }
                    }
                    let inOrAt = wordList.testWord( ["in","at"]);
                    let duration = wordList.getDuration(0);
                    // sgSprite.update(this.name, now);
                    if (toOrBy == "reset") {
                        sgSprite.resetSize();
                    } else if (!sgSprite.loaded) {
                        // not loaded yet, so we don't know the size, ask for when loaded
                        sgSprite.requestSize(dimensionType, dimension1, dimension2, duration, now, actionGroup.callback());
                    } else { // just set the size we want
                        sgSprite.applySize(dimensionType, dimension1, dimension2,
                                toOrBy, inOrAt, duration, now, actionGroup.callback());
                    }
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
                {
                    let spriteName = wordList.getSpriteName();
                    const toOrBy = wordList.testWord( ["to", "by", "reset"]);
                    let w = wordList.getPercent(0);
                    let h = wordList.getPercent(w);
                    let duration = wordList.getDuration(0);
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    // sgSprite.update(this.name, now);
                    if  (toOrBy == "reset") {
                        sgSprite.scaleX.setTargetValue(1);
                        sgSprite.scaleY.setTargetValue(1);
                        if (sgSprite.type == constants.SPRITE_GROUP) {
                            sgSprite.resetSize(); // pick up any new bounds
                        }
                    } else if (w != 0 || h != 0) {
                        sgSprite.setScale( w, h, command, toOrBy, duration, now,
                            actionGroup.callback());
                    } else {
                        Globals.log.error("Invalid scale data at line " + action.number);
                    }
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
            case "alignment":
                {
                    const spriteName = wordList.getSpriteName();
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
                            actionGroup.callback());
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
            case "finish":
                {
                    const type = wordList.testWord(["sprite","audio","sound","var","variable","scene"]);
                    const item = wordList.getWord();
                    switch (type) {
                        case "sprite":
                            SGSprite.deleteSprite(this.spriteScene, item, false);
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
                            if (!item) {
                                Scene.manageLifecycle(this, constants.SCENE_FINISH);
                            } else if (item == constants.MAIN_NAME) {
                                Globals.log.error("Cannot delete main scene on line " + action.number);
                            } else {
                                for (let i = 0; i < Globals.scenes.length; i++) {
                                    if (Globals.scenes[i].name == item) { // delete this one
                                        Scene.manageLifecycle(Globals.scenes[i], constants.SCENE_FINISH);
                                        break;
                                    }
                                }
                            }
                            // Not an error if scene doesn't exist
                            break;
                        default:
                            Globals.log.error("Unknown deletion type on line " + action.number);
                            break;
                        }
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
            case "rotation":
            case "turn":
                {
                    let spriteName = wordList.getSpriteName();
                    let turn_type = wordList.testWord( ["to","by","at"], "to");
                    let value = wordList.getInt(0);
                    let dur_type = wordList.testWord( ["in", "per"], "in");
                    let duration = wordList.getDuration(0);
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    sgSprite.rotate(turn_type, value, dur_type, duration, now, actionGroup.callback());
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
                {
                    let spriteName = wordList.getSpriteName();
                    let skew_type = wordList.testWord( ["to","by","at"], "to");
                    let skewX = wordList.getInt(0);
                    let skewY = wordList.getInt(0);
                    let dur_type = wordList.testWord( ["in", "per"], "in");
                    let duration = wordList.getDuration(0);
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    sgSprite.setSkew(skewX, skewY, skew_type, duration, now, actionGroup.callback());
                }
                break;

/**************************************************************************************************

   ##      ##    ###    ########  ########  
   ##  ##  ##   ## ##   ##     ## ##     ## 
   ##  ##  ##  ##   ##  ##     ## ##     ## 
   ##  ##  ## ##     ## ########  ########  
   ##  ##  ## ######### ##   ##   ##        
   ##  ##  ## ##     ## ##    ##  ##        
    ###  ###  ##     ## ##     ## ##        

**************************************************************************************************/

            case "warp":
                {
                    let spriteName = wordList.getSpriteName();
                    let warpType = wordList.testWord(["to","by","reset"], "to");
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) {
                        break;
                    }
                    if (warpType == "reset") {
                        sgSprite.clearWarp();
                        break;
                    }
                    const points = [];
                    for (let i = 0; i < 4; i++) {
                        points.push(wordList.getFloat(0));
                        points.push(wordList.getFloat(0));
                    }
                    let duration = wordList.getDuration(0);
                    sgSprite.setWarp(points, warpType, duration, now, actionGroup.callback());
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
                {
                    let spriteName = wordList.getSpriteName();
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
                        sgSprite.throw(angle, initialVelocity, now, actionGroup.callback());
                    }
                }
                break;

            case "gravity":
                this.gravity = wordList.getFloat(defaults.GRAVITY_PS2);
                break;

            case "ground":
                this.groundLevel = wordList.getFloat(Globals.displayHeight);
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
                {
                    let spriteName = wordList.getSpriteName();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    if (wordList.testWord( "stop")) {
                        sgSprite.throw("stop");
                    } else {
                        sgSprite.throw(180, 0, now,actionGroup.callback());
                    }
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
                {
                    let spriteName = wordList.getSpriteName();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { break; }
                    let axis = wordList.getWord("h");
                    sgSprite.flip(axis.charAt(0));
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
                {
                    let spriteName = wordList.getSpriteName();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { break; }
                    if (command == "show") {
                        sgSprite.setVisibility(true);
                    } else if (command == "hide") {
                        sgSprite.setVisibility(false);
                    } else if (command == "toggle") {
                        sgSprite.setVisibility("toggle");
                    }
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
            case "perform":
                {
                    wordList.testWord("scene");
                    const sceneName = wordList.getWord();
                    const sceneText = SceneText.find(sceneName);
                    if (!sceneText) {
                        Globals.log.error(`Scene named ${sceneName} not found`);
                        break;
                    }
                    let activeName = sceneText.name;
                    if (wordList.testWord("named")) {
                        wordList.testWord("as");
                        activeName = WordList.getWord(activeName);
                        if (!activeName.match(/[a-zA-z]/)) {
                            Globals.log.error("Active name must include at least one letter");
                            break;
                        }
                    }
                    if (wordList.testWord("with")) {
                        wordList.testWord(["params","parameters"]);
                    }
                    const params = wordList.joinWords();
                    this.completionCallback = actionGroup.callback(1);
                    const newScene = new Scene(sceneText, activeName);
                    newScene.parameters = params;
                    Scene.manageLifecycle(newScene, constants.SCENE_MAKE_RUNNABLE);
                    actionGroup.suspend("newScene", actionIndex, newScene);
                }
                break;


/**************************************************************************************************

   ########  ########  ######## ########     ###    ########  ######## 
   ##     ## ##     ## ##       ##     ##   ## ##   ##     ## ##       
   ##     ## ##     ## ##       ##     ##  ##   ##  ##     ## ##       
   ########  ########  ######   ########  ##     ## ########  ######   
   ##        ##   ##   ##       ##        ######### ##   ##   ##       
   ##        ##    ##  ##       ##        ##     ## ##    ##  ##       
   ##        ##     ## ######## ##        ##     ## ##     ## ######## 

**************************************************************************************************/

            case "prepare":
                {
                    wordList.testWord("scene");
                    const sceneName = wordList.getWord();
                    const sceneText = SceneText.find(sceneName);
                    if (!sceneText) {
                        Globals.log.error(`Scene named ${sceneName} not found at line ${action.line}`);
                        break;
                    }
                    let activeName = sceneText.name;
                    if (wordList.testWord("named")) {
                        wordList.testWord("as");
                        activeName = WordList.getWord(activeName);
                    }
                    if (Scene.find(activeName, false)) {
                        Globals.log.error(`name ${activeName} is already in use as active scene name at line ${action.line}`);
                        break;
                    }
                    if (wordList.testWord("with")) {
                        wordList.testWord(["params","parameters"]);
                    }
                    const params = wordList.joinWords();
                    this.completionCallback = actionGroup.callback(1);
                    const newScene = new Scene(sceneText, activeName);
                    newScene.parameters = params;
                    actionGroup.suspend("newScene", actionIndex);
                }
                break;

/**************************************************************************************************

   ########  ##     ## ##    ## 
   ##     ## ##     ## ###   ## 
   ##     ## ##     ## ####  ## 
   ########  ##     ## ## ## ## 
   ##   ##   ##     ## ##  #### 
   ##    ##  ##     ## ##   ### 
   ##     ##  #######  ##    ## 

**************************************************************************************************/

            case "run":
            case "act":
                {
                    wordList.testWord("out");
                    wordList.testWord("scene");
                    const sceneName = wordList.getWord();
                    const scene= Scene.find(sceneName);
                    if (!scene) {
                        Globals.log.error(`No active scene called ${sceneName} found at line ${action.number}`);
                        break;
                    }
                    if (wordList.testWord("with")) {
                        wordList.testWord(["params","parameters"]);
                    }
                    const params = wordList.joinWords();
                    this.completionCallback = actionGroup.callback(1);
                    if (params) {
                        scene.parameters = params;
                    }
                    Scene.manageLifecycle(scene, constants.SCENE_MAKE_RUNNABLE);
                    actionGroup.suspend("newScene", actionIndex);
                }
                break;

// /**************************************************************************************************

//     ######  ##        #######  ##    ## ######## 
//    ##    ## ##       ##     ## ###   ## ##       
//    ##       ##       ##     ## ####  ## ##       
//    ##       ##       ##     ## ## ## ## ######   
//    ##       ##       ##     ## ##  #### ##       
//    ##    ## ##       ##     ## ##   ### ##       
//     ######  ########  #######  ##    ## ######## 

// **************************************************************************************************/

//             case "copy":
//             case "clone":
//                 {
//                     const sceneName = wordList.getWord();
//                     if (sceneName == constants.MAIN_NAME) {
//                         Globals.log.error("Cannot duplicate main scene at line " + action.number);
//                         break;
//                     }
//                     wordList.testWord("as");
//                     const new_name = wordList.getWord();
//                     const scene = Scene.find(sceneName, false);
//                     if (scene === false) {
//                         Globals.log.error("Scene not found at line " + action.number);
//                         break;
//                     }
//                     if (Scene.find(new_name, false)) {
//                         Globals.log.error("Scene with that name already exists " + action.number);
//                         break;
//                     }
//                     // Everything checks out, make the copy
//                     const new_scene = new Scene(new_name);
//                     new_scene.content = scene.content; // this is the only bit we need to copy over
//                     // but can do others if we ever want to preserve variable states etc...?
//                     Globals.scenes.push(new_scene);
//                 }
//                 break;

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
                this.completionCallback = actionGroup.callback();
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
                    if (stop_type) {
                        switch(stop_type) {
                            case "audio":
                            case "sound":
                            case "track":
                                if (AudioManager.exists(item)) {
                                    AudioManager.delete(item);
                                }
                                break;
                            case "scene":
                                {
                                    const scene = Scene.find(item);
                                    if (scene !== false) {
                                        scene.stop(false);
                                    }
                                }
                                break;
                            case "sprite":
                                {
                                    let sgSprite = SGSprite.getSprite(this.spriteScene, item, false);
                                    if (sgSprite) {
                                        sgSprite.stop();
                                    }
                                }
                                break;
                            case "all":
                            case "play":
                            case "app":
                                Globals.app.stop();
                                break;
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
                {
                    let varName = wordList.getWord();
                    let assignType = wordList.testWord(["be","to","from"]);
                    if (assignType == "from") {
                        actionGroup.dataVarName = varName;
                    } else {
                        this.varList.setValue(varName, wordList.joinWords());
                    }
                }
                break;                   

            case "assign":
                {
                    const assignIndex = wordList.indexOfWord("as");
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
                            this.varList.setTag(varNames[i], this.defaultTags);
                        }
                    }
                }
                break;

            case "increment":
            case "decrement":
                {
                    const varName = wordList.getWord();
                    if (this.varList.find(varName) === false) {
                        Globals.log.error(`Variable not found ${varName} at line ${action.number}`);
                    } else {
                        const currentValue = this.varList.getValue(varName);
                        if (`${currentValue}`.match(/^-?[0-9]+(\.[0-9]+)?$/)) {
                            const delta = command == "increment" ? 1 : -1;
                            this.varList.setValue(varName, parseFloat(currentValue) + delta);
                        }
                    }
                }
                break;

            case "choose":
                {
                    let varName = wordList.getWord();
                    wordList.testWord("from");
                    this.varList.setValue(varName, wordList.randomWord());
                    this.varList.setTag(varName, this.defaultTags);
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
                                this.varList.setTag(varName, this.defaultTags);
                            }
                        }
                    }
                } else {
                    Globals.log.error("Missing values for match at line " + action.number);
                }
                break;

            case "get":
                if (wordList.wordsLeft() > 2) {
                    const varName = wordList.getWord();
                    if (!wordList.testWord("from")) {
                        Globals.log.error("Missing get separator 'from' at line " + action.number);
                    } else {
                        wordList.testWord("url");
                        const url = wordList.joinWords();
                        if (url.length < 1) {
                            Globals.log.error("Missing URL at line " + action.number);
                        } else {
                            this.getVariableFromURL(varName, url, actionGroup.callback());
                        }
                    }
                } else {
                    Globals.log.error("Missing get parameters at line " + action.number);
                }
                break;

            case "rssget":
            case "getrss":
                if (wordList.wordsLeft() > 2) {
                    const varName = wordList.getWord();
                    if (!wordList.testWord("from")) {
                        Globals.log.error("Missing get separator 'from' at line " + action.number);
                    } else {
                        wordList.testWord("url");
                        const url = wordList.getWord();
                        if (url.length < 1) {
                            Globals.log.error("Missing URL at line " + action.number);
                            break;
                        }
                        wordList.testWord("item");
                        const item = wordList.getInt(1);
                        this.getVariableFromRSS(varName, url, item, actionGroup.callback());
                    }
                } else {
                    Globals.log.error("Missing get parameters at line " + action.number);
                }
                break;

/**************************************************************************************************

   ########    ###     ######   
      ##      ## ##   ##    ##  
      ##     ##   ##  ##        
      ##    ##     ## ##   #### 
      ##    ######### ##    ##  
      ##    ##     ## ##    ##  
      ##    ##     ##  ######   

**************************************************************************************************/

            case "tag":
                if (wordList.wordsLeft() > 2) {
                    const what = wordList.testWord(["sprite","variable","var","image"]);
                    const name = wordList.getWord();
                    wordList.testWord(["with","as"]);
                    const value = wordList.getWord();
                    if (value === false) {
                        Globals.log.error("Missing tag value at line " + action.number);
                        break;
                    }
                    switch(what) {
                        case "scene":
                            const scene = Scene.find(name);
                            if (scene) {
                                scene.tags.addTag(value);
                            }
                            break;
                        case "sprite":
                            const sgSprite = SGSprite.getSprite(this.spriteScene, name);
                            if (sgSprite) {
                                sgSprite.tags.addTag(value);
                            }
                            break;
                        case "image":
                            const sgImage = SGImage.getImage(this.spriteScene, name);
                            if (sgImage) {
                                sgImage.tags.addTag(value);
                            }
                            break;
                        case "variable":
                        case "var":
                        default:
                            this.varList.setTag(name, value);
                            break;
                    }
                } else {
                    Globals.log.error("Missing tag parameters at line " + action.number);
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
                {
                    let spriteName = wordList.getSpriteName();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { break; }
                    let on_off = wordList.testWord(["by","stop"]);
                    if (on_off == "stop") {
                        sgSprite.flicker(0,0);
                    } else {
                        let flickerStrength = wordList.getInt(0,0,50);
                        wordList.testWord("with");
                        wordList.testWord("chance");
                        let flickerChance = wordList.getInt(50);
                        sgSprite.flicker(flickerStrength, flickerChance);
                    }
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
                {
                    let sgSpriteName = wordList.getWord();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, sgSpriteName);
                    if (!sgSprite) { break; }
                    let on_off = wordList.testWord(["by","stop"]);
                    if (on_off == "stop") {
                        sgSprite.jiggle(0,0,0);
                    } else {
                        let jiggleX = wordList.getInt(0);
                        let jiggleY = wordList.getInt(0);
                        let jiggle_r = wordList.getInt(0);
                        wordList.testWord("with");
                        wordList.testWord("chance");
                        let jiggleChance = wordList.getInt(50);
                        sgSprite.jiggle(jiggleX, jiggleY, jiggle_r, jiggleChance);
                    }
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
                {
                    let sgSpriteName = wordList.getWord();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, sgSpriteName);
                    if (!sgSprite) { break; }
                    let flashCount = wordList.getInt(0,1,10);
                    sgSprite.flash(flashCount, now);
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
                {
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
                {
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
                {
                    let sgSpriteName = wordList.getWord();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, sgSpriteName);
                    if (!sgSprite) { 
                        break; 
                    }
                    let fade_type = wordList.testWord(["to","by", "up", "down"],"to");
                    let value = wordList.getPercent(100);
                    let duration = wordList.getDuration(0);
                    if (sgSprite) {
                        sgSprite.setTransparency(value, duration, fade_type, now, actionGroup.callback());
                    }
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
                {
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
                {
                    let spriteName = wordList.getSpriteName();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) {
                        break;
                    }
                    let blur_type = wordList.testWord(["to","by", "up", "down"],"to");
                    let value = wordList.getInt(100);
                    let duration = wordList.getDuration(0);
                    if (sgSprite) {
                        sgSprite.setBlur(value, duration, blur_type, now, actionGroup.callback());
                    }
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
                {
                    let spriteName = wordList.getSpriteName();
                    let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
                    if (!sgSprite) { break; }
                    wordList.testWord( ["to", "by", "at"]);
                    const value = wordList.getWord( "red");
                        sgSprite.setTint(value);
                }
                break;

            case "darken":
            case "lighten":
                {
                    let spriteName = wordList.getSpriteName();
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
                    sgSprite.setTint(value, duration, now, actionGroup.callback());
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
                {
                    let varName = wordList.getWord();
                    let rangeOrList = wordList.testWord(["range","in"]);
                    let values = "";
                    switch(rangeOrList) {
                        case "range":
                            values = Utils.expandRange(wordList.getWord);
                            break;
                        case "in":
                            values = wordList.sliceWords(4);
                            break;
                        default:
                            Globals.log.error("for must be 'range' or 'in'");
                            break;
                    }
                    this.varList.setValue(varName,wordList.getWord(defaults.NOTFOUND));
                    const stackFrame = new Utils.StackFrame(constants.STACK_FOR, actionIndex + 1, values, varName);
                    actionGroup.stack.push(stackFrame);
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
                { 
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
                }
                break;
            
            case "endif":
                // only happens after a succesful if clause so can just ignore
                break;

/**************************************************************************************************

    ######     ###    ##       ##       
   ##    ##   ## ##   ##       ##       
   ##        ##   ##  ##       ##       
   ##       ##     ## ##       ##       
   ##       ######### ##       ##       
   ##    ## ##     ## ##       ##       
    ######  ##     ## ######## ######## 

**************************************************************************************************/

            case "call":
                {
                    const callName = wordList.getWord();
                    const args = wordList.joinWords();
                    let found = false;
                    for (let i = 0; i < this.actionGroups.length; i++) {
                        for (let j = 0; j < this.actionGroups[i].triggers.length; j++) {
                            const trigger = this.actionGroups[i].triggers[j];
                            if (trigger.callName == callName) {
                                this.args = args;
                                trigger.called = true;
                                found = this.actionGroups[i];
                                break;
                            }
                        }
                    }
                    if (!found) {
                        Globals.log.error("No call found for " + callName);
                    } else {
                        actionGroup.suspend("call", actionIndex, found);
                    }
                    break;
                }

/**************************************************************************************************

   ##      ##    ###    #### ########       ## ######## ##     ## ######## ##    ## 
   ##  ##  ##   ## ##    ##     ##         ##     ##    ##     ## ##       ###   ## 
   ##  ##  ##  ##   ##   ##     ##        ##      ##    ##     ## ##       ####  ## 
   ##  ##  ## ##     ##  ##     ##       ##       ##    ######### ######   ## ## ## 
   ##  ##  ## #########  ##     ##      ##        ##    ##     ## ##       ##  #### 
   ##  ##  ## ##     ##  ##     ##     ##         ##    ##     ## ##       ##   ### 
    ###  ###  ##     ## ####    ##    ##          ##    ##     ## ######## ##    ## 

**************************************************************************************************/

            case 'pause':
                wordList.testWord("for");
                let duration = wordList.getDuration(5);
                actionGroup.suspend("pause", actionIndex, now + (1000 * duration));
                break;

            case 'then':
                if (!actionGroup.allPriorFinished()) {
                    actionGroup.suspend("then", actionIndex);
                }
                break;

            case 'wait':
                if (wordList.wordsLeft() > 0) { 
                    const waitType = wordList.testWord(["until","while"]);
                    if (!waitType) {
                        Globals.log.error("Unknown wait condition at " + action.number);
                        break;
                    }
                    let rawWords = action.text.split(/ +/).slice(2).join(' ');
                    actionGroup.suspend(waitType, actionIndex, rawWords);
                } else {
                    Globals.log.error("Missing wait condition at line " + action.number);
                }
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
