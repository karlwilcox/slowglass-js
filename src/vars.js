
import { Globals } from "./globals.js";
import defaults from "./defaults.js";
import * as Utils from "./utils.js";
import { SGSprite } from "./sgsprite";
import { Scene } from "./scene.js";
import * as constants from './constants.js';

class Variable {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }

    getValue() {
        return this.value;
    }

    setValue(value) {
        this.value = value;
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
        Utils.getHemisphere();
    }

    setValue(name, value) {
        if (this.built_in(name)) {
            Globals.log.error("Cannot create built-in variable " + name);
        } else if (name.match(/[\.:]/)) {
            Globals.log.error("Cannot create variable with dot or colon in name " + name);
        } else {
            const index = this.find(name);
            if (index !== false) {
                this.variables[index].setValue(value);
            } else {
                this.variables.push(new Variable(name, value));
            }
        }
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
        switch (name) {
            case "SECONDS":
            case "SECOND":
                return new Intl.DateTimeFormat(defaults.LOCALE, { second: "numeric" }).format(date);
            case "MINUTES":
            case "MINUTE":
                return new Intl.DateTimeFormat(defaults.LOCALE, { minute: "numeric" }).format(date);
            case "HOUR":
            case "HOURS":
                return new Intl.DateTimeFormat(defaults.LOCALE, { hour: "numeric" }).format(date);
            case "DAYOFWEEK":
                return date.getDay() + 1; // Sunday = 1
            case "DAYNAME":
                return new Intl.DateTimeFormat(defaults.LOCALE, { weekday: "long" }).format(date);
            case "MONTH":
                return month;
            case "MONTHNAME":
                return new Intl.DateTimeFormat(defaults.LOCALE, { month: "long" }).format(date);
            case "YEAR":
                return date.getFullYear();
            case "HEMISPHERE":
                return this.hemisphere;
            case "SEASON":
                switch (month) {
                    case 12:
                    case 1:
                    case 2:
                        return this.hemisphere == "northern" ?  "winter" : "summer";
                    case 3:
                    case 4:
                    case 5:
                        return this.hemisphere == "northern" ?  "spring" : "autumn";
                    case 6:
                    case 7:
                    case 8:
                        return this.hemisphere == "northern" ?  "summer" : "winter";
                    case 9:
                    case 10:
                    case 11:
                        return this.hemisphere == "northern" ?  "autumn" : "spring";
                }
                break;
            case "WINTER":
                return ((this.hemisphere == "northern" && (month >= 12 || month <= 2)) ||
                            (this.hemisphere == "southern" && (month >= 6 && month <= 8))) ? constants.TRUE_VALUE : defaults.FALSEVALUE;
            case "SPRING":
                return ((this.hemisphere == "northern" && (month >= 3 && month <= 5)) ||
                            (this.hemisphere == "southern" && (month >= 9 && month <= 11))) ? constants.TRUE_VALUE : defaults.FALSEVALUE;
            case "SUMMER":
                return ((this.hemisphere == "northern" && (month >= 6 && month <= 8)) ||
                            (this.hemisphere == "southern" && (month >= 12 || month <= 2))) ? constants.TRUE_VALUE : defaults.FALSEVALUE;
            case "AUTUMN":
                return ((this.hemisphere == "northern" && (month >= 9 && month <= 11)) ||
                            (this.hemisphere == "southern" && (month >= 3 && month <= 5))) ? constants.TRUE_VALUE : defaults.FALSEVALUE;
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
                return date.getDay() > 0 && date.getDay() < 6 ? constants.TRUE_VALUE : defaults.FALSEVALUE;
            case "WEEKEND":
                return date.getDay() == 0 || date.getDay() == 6 ? constants.TRUE_VALUE : defaults.FALSEVALUE;
            case "MORNING":
                return date.getHours() > 6 && date.getHour() < 13 ? constants.TRUE_VALUE : defaults.FALSEVALUE;
            case "AFTERNOON":
                return date.getHours() > 11 && date.getHour() < 18 ? constants.TRUE_VALUE : defaults.FALSEVALUE;
            case "EVENING":
                return date.getHours() > 18 && date.getHour() < 22 ? constants.TRUE_VALUE : defaults.FALSEVALUE;
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
        let value = "NONE";
        const parts = varName.split(/:/);
        const scene = Scene.find(parts[0]);
        if (scene !== false) {
            value = scene.varList.getValue(parts[1]);
        }
        return value;
    }

    find(name) {
        for (let i = 0; i < this.variables.length; i++) {
            let variable = this.variables[i];
            if (variable.name == name) {
                return i;   
            }
        } // else
        return false;
    }

    getValue(varName) {
        let value = false;
        let sceneName = this.sceneName; // assume we are local
        if (varName.match(/:/)) { // this is a different scene
            const colonParts = varName.split(/:/);
            varName = colonParts[1];
            sceneName = colonParts[0];
        }
        // First, find out which scene we are looking at
        const scene = Scene.find(sceneName);
        if (!scene) {
            value = defaults.NOTFOUND;
        }
        // Is this a list request?
        switch(varName) {
            case 'SPRITES':
                value = scene.listSprites(false);
                break;
            case 'IMAGES':
            case 'IMGS':
                value = scene.listImages(false);
                break;
            case 'SCENES':
                value = Globals.listScenes(false);
                break;
            default:
                break;
        }
        // Or is this is a sprite name?
        if (value === false && varName.match(/\./)) { // should be a sprite name/property pair
            const parts = varName.split(/\./, 2);
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
        if (value === false) {
            // Otherwise, Look for built-ins first
            value = this.built_in(varName);
        }
        if (value === false) {
            // then look for user defined 
            if (sceneName != this.sceneName) { // look in a different scene
                    value = scene.varList.getValue(varName);
            } else {
                let index = this.find(varName);
                if (index !== false) {
                    value = this.variables[index].getValue();
                } 
            }
        }
        if (value === false) {
            Globals.log.error("Variable not found " + varName);
            value = defaults.NOTFOUND;
        }
        return value;
    }

    delete(name, report = false) {
        let index = this.find(name);
        if (index === false && report) {
            Globals.log.error("Variable not found " + name);
            return false;
        } // else
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
                let j = i + 1;
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
                    while (j < input.length && /[a-zA-Z0-9_:]/.test(input[j])) {
                        j++;
                    }
                    varName = input.slice(start, j);
                }

                let replacement = this.getValue(varName);

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
