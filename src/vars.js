
import { Globals } from "./globals.js";
import defaults from "./defaults.js";
import * as Utils from "./utils.js";
import { SGSprite } from "./sgsprite.js";
import { Scene } from "./scene.js";
import * as constants from './constants.js';

export class TagList {
    constructor() {
        this.tags = [];
    }

    addTag(tag) {
        if (!Array.isArray(tag)) {
            tag = [tag];
        }
        for (let i = 0; i < tag.length; i++ ) {
            let cleanTag = tag[i];
            if (cleanTag.charAt(0) == '#') {
                cleanTag = cleanTag.slice(1);
            }
            if (!this.tags.includes(cleanTag)) { // don't allow duplicates
                this.tags.push(cleanTag);
            }
        }
    }

    hasTag(tag) {
        if (tag.charAt(0) == '#') {
            tag = tag.slice(1);
        }
        return this.tags.includes(tag);
    }
}

class Variable {
    constructor(name, value) {
        this.name = name;
        this.value = value;
        this.arrayValues = Object.create(null);
        this.tags = new TagList();
    }

    getValue(key = false) {
        if (key !== false) {
            return Object.prototype.hasOwnProperty.call(this.arrayValues, key) ? this.arrayValues[key] : false;
        }
        return this.value === undefined ? false : this.value;
    }

    getLength() {
        const arrayLength = Object.keys(this.arrayValues).length;
        return `${arrayLength > 0 ? arrayLength : 1}`;
    }

    getKeys() {
        const keys = Object.keys(this.arrayValues);
        return keys.length > 0 ? keys.join(" ") : defaults.NOTFOUND;
    }

    setValue(value, key = false) {
        if (key !== false) {
            this.arrayValues[key] = value;
        } else {
            this.value = value;
        }
        return true;
    }

    delete(key = false) {
        if (key !== false) {
            if (!Object.prototype.hasOwnProperty.call(this.arrayValues, key)) {
                return false;
            }
            delete this.arrayValues[key];
        }
        return true;
    }
}

export class VarList {
    static key = null;
    static lastKey = null;
    static hemisphere = null;

    constructor(sceneName) {
        this.variables = [];
        this.trigger = null;
        this.sceneName = sceneName;
        this.currentGroup = false;
    }

    parseArrayReference(name) {
        const match = `${name}`.match(/^([a-zA-Z0-9_:#]+)(?:\[([^\]]+)\])?(?:\.(length|keys))?$/);
        if (!match) {
            return { name, key: false, property: false };
        }
        return {
            name: match[1],
            key: match[2] === undefined ? false : this.expandVars(match[2]),
            property: match[3] === undefined ? false : match[3]
        };
    }

    setValue(name, value) {
        const reference = this.parseArrayReference(name);
        if (this.built_in(reference.name)) {
            Globals.log.error("Cannot create built-in variable " + name);
        } else if (reference.name.match(/[\.:]/) || reference.property !== false) {
            Globals.log.error("Cannot create variable with dot or colon in name " + name);
        } else {
            const index = this.find(reference.name);
            if (index !== false) {
                this.variables[index].setValue(value, reference.key);
            } else {
                const variable = new Variable(reference.name);
                variable.setValue(value, reference.key);
                this.variables.push(variable);
            }
        }
    }


    setTag(name, tag) {
        if (Array.isArray(tag) && tag.length == 0) {
            return;
        }
        const reference = this.parseArrayReference(name);
        if (this.built_in(reference.name)) {
            Globals.log.error("Cannot tag built-in variable " + name);
        } else if (reference.name.match(/[\.:]/) || reference.property !== false) {
            Globals.log.error("Cannot tag variable with dot or colon in name " + name);
        } else {
            const index = this.find(reference.name);
            if (index !== false) {
                this.variables[index].tags.addTag(tag);
            }
        }
    }

    listTags(tags) {
        if (!Array.isArray(tags)) {
            tags = [tags];
        }
        let result = "";
        let first = true;
        for (let i = 0; i < this.variables.length; i++ ) {
            for (let j = 0; j < tags.length; j++) {
                if (this.variables[i].tags.hasTag(tags[j])) {
                    if (first) {
                        first = false;
                    } else {
                        result += " ";
                    }
                    result += this.variables[i].name;
                    break; // don't need to check the rest of tags
                }
            }
        }
        return result;
    }


    listNames() {
        let result = "";
        let first = true;
        for (let i = 0; i < this.variables.length; i++ ) {
            if (first) {
                first = false;
            } else {
                result += " ";
            }
            result += this.variables[i].name;
        }
        return result;
    }

/**************************************************************************************************

   ########  ##     ## #### ##       ########         #### ##    ##  ######  
   ##     ## ##     ##  ##  ##          ##             ##  ###   ## ##    ## 
   ##     ## ##     ##  ##  ##          ##             ##  ####  ## ##       
   ########  ##     ##  ##  ##          ##    #######  ##  ## ## ##  ######  
   ##     ## ##     ##  ##  ##          ##             ##  ##  ####       ## 
   ##     ## ##     ##  ##  ##          ##             ##  ##   ### ##    ## 
   ########   #######  #### ########    ##            #### ##    ##  ######  

**************************************************************************************************/

    built_in(name) {
        const date = new Date();
        const month = date.getMonth() + 1;
        const dayOfYear = date => Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        switch (name) {
            case "SECONDS":
            case "SECOND":
                return new Intl.DateTimeFormat(defaults.LOCALE, { second: "numeric" }).format(date).padStart(2,'0');
            case "MINUTES":
            case "MINUTE":
                return new Intl.DateTimeFormat(defaults.LOCALE, { minute: "numeric" }).format(date).padStart(2,'0');
            case "HOUR":
            case "HOURS":
                return new Intl.DateTimeFormat(defaults.LOCALE, { hour: "numeric" }).format(date).padStart(2,'0');
            case "DAYOFWEEK":
                return date.getDay() + 1; // Sunday = 1
            case "DAYOFYEAR":
                return Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
            case "DAYNAME":
                return new Intl.DateTimeFormat(defaults.LOCALE, { weekday: "long" }).format(date);
            case "DAYOFMONTH":
            case "DAY":
                return new Intl.DateTimeFormat(defaults.LOCALE, { day: "numeric" }).format(date).padStart(2,'0');
            case "MONTH":
                return month;
            case "MONTHNAME":
                return new Intl.DateTimeFormat(defaults.LOCALE, { month: "long" }).format(date);
            case "YEAR":
                return date.getFullYear();
            case "TIMEZONE":
                return new Intl.DateTimeFormat.resolvedOptions().timezone;
            case "HEMISPHERE":
                return Globals.location.hemisphere();
            case "SEASON":
                return Globals.location.season();
                break;
            case "WINTER":
                return Globals.location.isWinter();
            case "SPRING":
                return Globals.location.isSpring();
            case "SUMMER":
                return Globals.location.isSummer();
            case "AUTUMN":
            case "FALL":
                return Globals.location.isAutumn();
            case "SUNANGLE":
                return Globals.location.sunAngle();
            case "LAT":
            case "LATITUDE":
                return Globals.location.lat;
            case "LON":
            case "LONG":
            case "LONGITUDE":
                return Globals.location.lon;
            case "WIDTH":
                return Globals.app.screen.width;
            case "HEIGHT":
                return Globals.app.screen.height;
            case "CENTREX":
            case "CENTERX":
                return Math.floor(Globals.app.screen.width / 2);
            case "CENTREY":
            case "CENTERY":
                return Math.floor(Globals.app.screen.height / 2);
            case "RANDOMX":
                return Math.floor(Math.random() * Globals.app.screen.width);
            case "RANDOMY":
                return Math.floor(Math.random() * Globals.app.screen.height);
            case "CHANCE":
                return Math.random();
            case "PERCENT":
            case "PERCENTAGE":
                return Math.floor(Math.random() * 101);
            case "TRIGGER":
                return this.trigger;
            case "WEEKDAY":
                return Utils.boolAsString(date.getDay() > 0 && date.getDay() < 6);
            case "WEEKEND":
                return Utils.boolAsString(date.getDay() == 0 || date.getDay() == 6);
            case "MORNING":
                return Utils.boolAsString(date.getHours() > 6 && date.getHour() < 13);
            case "AFTERNOON":
                return Utils.boolAsString(date.getHours() > 11 && date.getHour() < 18);
            case "EVENING":
                return Utils.boolAsString(date.getHours() > 18 && date.getHour() < 22);
            case "NIGHT":
                return Utils.boolAsString(date.getHours() > 22 || date.getHour() < 6);
            case "KEY":
                return Globals.key == null ? defaults.NOTFOUND : Globals.key;
            case "LASTKEY":
                return Globals.lastKey == null ? defaults.NOTFOUND : Globals.lastKey;
            case "SCALEX":
                return Globals.scriptScaleX;
            case "SCALEY":
                return Globals.scriptScaleY;
            case "SCENENAME":
                return this.sceneName;
            case "FINISHED":
                return Utils.boolAsString(this.currentGroup.isFinished());
            case "PARAMS":
            case "PARAMETERS":
                const scene = Scene.find(this.sceneName);
                return scene.parameters;
            case "ELAPSED":
                return Math.floor((Date.now() - Globals.startTime) / 1000);
            case "MILLIS":
            case "MS":
                return (Date.now() - Globals.startTime);
            default:
                return false;
        }
    }

    sceneVar(varName) {
        let value = defaults.NOTFOUND;
        const parts = varName.split(/:/);
        const scene = Scene.find(parts[0]);
        if (scene !== false) {
            value = scene.varList.getValue(parts[1]);
        }
        return value;
    }

    find(name) {
        const reference = this.parseArrayReference(name);
        for (let i = 0; i < this.variables.length; i++) {
            let variable = this.variables[i];
            if (variable.name == reference.name) {
                if (reference.key === false || variable.getValue(reference.key) !== false) {
                    return i;
                }
                return false;
            }
        } // else
        return false;
    }

    findVariable(name) {
        for (let i = 0; i < this.variables.length; i++) {
            let variable = this.variables[i];
            if (variable.name == name) {
                return i;   
            }
        } // else
        return false;
    }

    getValue(varName, report=false) {
        let value = false;
        let sceneName = this.sceneName; // assume we are local
        if (varName.match(/:/)) { // this is a different scene
            const colonParts = varName.split(/:/);
            varName = colonParts[1];
            sceneName = colonParts[0];
        }
        const reference = this.parseArrayReference(varName);
        // First, find out which scene we are looking at
        const scene = Scene.find(sceneName);
        if (!scene) {
            value = defaults.NOTFOUND;
        }
        if (reference.property === false) {
            // Is this a list request?
            let listName = reference.name;
            let tagName = false;
            if (reference.name.match(/#/)) {
                const listParts = reference.name.split(/#/);
                listName = listParts[0];
                tagName = listParts[1];
            }
            switch(listName) {
                case "VARIABLES":
                case "VARNAMES":
                    if (tagName) {
                        value = this.listTags(tagName);
                    } else {
                        value = this.listNames();
                    }
                    break;
                case 'SPRITES':
                    if (tagName) {
                        value = scene.listSpriteTags(tagName);
                    } else {
                        value = scene.listSprites(false);
                    }
                    break;
                case 'IMAGES':
                case 'IMGS':
                    if (tagName) {
                        value = scene.listImageTags(tagName);
                    } else {
                        value = scene.listImages(false);
                    }
                    break;
                case 'SCENES':
                    if (tagName) {
                        value = Globals.listSceneTags(tagName);
                    } else {
                        value = Globals.listScenes(false);
                    }
                    break;
                default:
                    break;
            }
        }
        // Or is this is a sprite name?
        if (value === false && reference.property === false && varName.match(/\./)) { // should be a sprite name/property pair
            const parts = reference.name.split(/\./, 2);
            const sgSprite = SGSprite.getSprite(sceneName, parts[0], false);
            if (sgSprite != null) {
                switch(parts[1]) {
                    case 'x':
                    case 'loc.x':
                    case 'location.x':
                    case 'pos.x':
                    case 'position.x':
                        value = sgSprite.locX.value();
                        break;
                    case 'y':
                    case 'loc.y':
                    case 'location.y':
                    case 'pos.y':
                    case 'position.y':
                        value = sgSprite.locY.value();
                        break;
                    case 'speed.x':
                    case 'dx':
                        value = sgSprite.locX.speed();
                        break;
                    case 'speed.y':
                    case 'dy':
                        value = sgSprite.locY.speed();
                        break;
                    case 'z':
                    case 'depth':
                        value = sgSprite.depth;
                        break;
                    case 'sx':
                    case 'size.x':
                        value = sgSprite.sizeX.value();
                        break;
                    case 'sy':
                    case 'size.y':
                        value = sgSprite.sizeY.value();
                        break;
                    case 'pivot.x':
                    case 'px':
                        value = sgSprite.piSprite.pivot.x;
                        break;
                    case 'pivot.y':
                    case 'py':
                        value = sgSprite.piSprite.pivot.y;
                        break;
                    case 'angle':
                    case 'rotation':
                        value = sgSprite.angle.value();
                        break;
                    case 'visible':
                        value = Utils.boolAsString(sgSprite.visible);
                        break;
                    case 'role':
                        if (sgSprite.role == null) {
                            value = defaults.NOTFOUND;
                        } else {
                            value = sgSprite.role;
                        }
                        break;
                    case 'bounds':
                        const bounds = sgSprite.piSprite.getBounds();
                        value = `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`;
                        break;
                        // More still to do
                    default:
                }
            }
        }
        if (value === false && reference.property === false) {
            // Otherwise, Look for built-ins first
            value = this.built_in(reference.name);
        }
        if (value === false) {
            // then look for user defined 
            if (sceneName != this.sceneName) { // look in a different scene
                    value = scene.varList.getValue(varName);
            } else {
                let index = this.findVariable(reference.name);
                if (index !== false) {
                    if (reference.property == "length" && reference.key === false) {
                        value = this.variables[index].getLength();
                    } else if (reference.property == "keys" && reference.key === false) {
                        value = this.variables[index].getKeys();
                    } else if (reference.property === false) {
                        value = this.variables[index].getValue(reference.key);
                    }
                } 
            }
        }
        if (report && value === false) {
            Globals.log.error("Variable not found " + varName);
            value = defaults.NOTFOUND;
        }
        return value;
    }

    delete(name, report = false) {
        const reference = this.parseArrayReference(name);
        let index = this.find(reference.name);
        if (index === false) {
            if (report) {
                Globals.log.error("Variable not found " + name);
            }
            return false;
        } // else
        if (reference.key !== false) {
            const deleted = this.variables[index].delete(reference.key);
            if (!deleted && report) {
                Globals.log.error("Variable not found " + name);
            }
            return deleted;
        }
        this.variables.splice(index, 1);
        return true;
    }

    expandVars(input) {
        let output = '';
        let i = 0;

        while (i < input.length) {
            // Handle escaped $ (i.e. \$)
            if (input[i] === '\\' && input[i + 1] === '$') {
                output += '$';
                i += 2;
                continue;
            }

            // Handle variable starting with $
            if (input[i] === '$') {
                let indirect = input[i + 1] === '$';
                let j = i + (indirect ? 2 : 1);
                let varName = '';

                // Case: ${varName}
                if (input[j] === '{') {
                    j++; // skip '{'
                    const start = j;

                    while (j < input.length && input[j] !== '}') {
                        j++;
                    }

                    // If closing brace found
                    if (j < input.length && input[j] === '}') {
                        varName = input.slice(start, j);
                        j++; // skip '}'
                    } else {
                        // No closing brace — treat literally
                        output += '$';
                        i++;
                        continue;
                    }
                } else {
                    // Case: $varName
                    const start = j;
                    while (j < input.length && /[a-zA-Z0-9_:#]/.test(input[j])) {
                        j++;
                    }
                    varName = input.slice(start, j);
                }

                if (input[j] === '[') {
                    const start = j;
                    j++;
                    while (j < input.length && input[j] !== ']') {
                        j++;
                    }
                    if (j < input.length && input[j] === ']') {
                        j++; // skip ']'
                        varName += input.slice(start, j);
                    }
                }

                const property = input.slice(j).match(/^\.(length|keys)(?![a-zA-Z0-9_])/);
                if (property) {
                    varName += property[0];
                    j += property[0].length;
                }

                let replacement = this.getValue(varName);
                if (indirect) {
                    replacement = this.getValue(replacement);
                }

                output += replacement;
                i = j;
                continue;
            }

            // Default: copy character
            output += input[i];
            i++;
        }

        return output;
    }
}
