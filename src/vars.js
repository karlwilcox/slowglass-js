
import { Globals } from "./globals.js";
import defaults from "./defaults.js";
import * as Utils from "./utils.js";
import { SG_sprite } from "./sg_sprite";

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

    create(name, value) {
        if (VarList.built_in(name)) {
            Globals.log.error("Cannot create built-in variable " + name);
        } else if (name.match(/[\.:]/)) {
            Globals.log.error("Cannot create variable with dot or colon in name " + name);
        } else {
            this.variables.push(new Variable(name, value));
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

    static built_in(name) {
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
                            (this.hemisphere == "southern" && (month >= 6 && month <= 8))) ? defaults.TRUEVALUE : defaults.FALSEVALUE;
            case "SPRING":
                return ((this.hemisphere == "northern" && (month >= 3 && month <= 5)) ||
                            (this.hemisphere == "southern" && (month >= 9 && month <= 11))) ? defaults.TRUEVALUE : defaults.FALSEVALUE;
            case "SUMMER":
                return ((this.hemisphere == "northern" && (month >= 6 && month <= 8)) ||
                            (this.hemisphere == "southern" && (month >= 12 || month <= 2))) ? defaults.TRUEVALUE : defaults.FALSEVALUE;
            case "AUTUMN":
                return ((this.hemisphere == "northern" && (month >= 9 && month <= 11)) ||
                            (this.hemisphere == "southern" && (month >= 3 && month <= 5))) ? defaults.TRUEVALUE : defaults.FALSEVALUE;
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
                return date.getDay() > 0 && date.getDay() < 6 ? defaults.TRUEVALUE : defaults.FALSEVALUE;
            case "WEEKEND":
                return date.getDay() == 0 || date.getDay() == 6 ? defaults.TRUEVALUE : defaults.FALSEVALUE;
            case "MORNING":
                return date.getHours() > 6 && date.getHour() < 13 ? defaults.TRUEVALUE : defaults.FALSEVALUE;
            case "AFTERNOON":
                return date.getHours() > 11 && date.getHour() < 18 ? defaults.TRUEVALUE : defaults.FALSEVALUE;
            case "EVENING":
                return date.getHours() > 18 && date.getHour() < 22 ? defaults.TRUEVALUE : defaults.FALSEVALUE;
            case "NIGHT":
                return Utils.t_or_f(date.getHours() > 22 || date.getHour() < 6);
            case "KEY":
                return Globals.key == null ? defaults.NOTFOUND : Globals.key;
            case "LASTKEY":
                return Globals.lastKey == null ? defaults.NOTFOUND : Globals.lastKey;
            case "SCALEX":
                return Globals.script_scale_x;
            case "SCALEY":
                return Globals.script_scale_y;
            case "SCENE":
                return this.sceneName;
            case "PARAMS":
            case "PARAMETERS":
                const scene = Scene.find(this.sceneName);
                return scene.parameters;
            case "ELAPSED":
                return Math.floor((Date.now() - Globals.start_time) / 1000);
            case "MILLIS":
            case "MS":
                return (Date.now() - Globals.start_time) / 1000;
            default:
                return false;
        }
    }

    static  scene_var(varName) {
        let value = "NONE";
        const parts = varName.split(/:/);
        const scene = Scene.find(parts[0]);
        if (scene !== false) {
            value = scene.varList.get_value(parts[1]);
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

    get_value(varName) {
        let value = false;
        let sceneName = this.sceneName; // assume we are local
        if (varName.match(/:/)) { // this is a different scene
            const colonParts = varName.split(/:/);
            varName = colonParts[1];
            sceneName = colonParts[0];
        }
        // Is this is a sprite name?
        if (varName.match(/\./)) { // should be a sprite name/property pair
            const parts = varName.split(/\./, 2);
            const sprite = SG_sprite.get_sprite(sceneName, parts[0], false);
            if (sprite != null) {
                switch(parts[1]) {
                    case 'x':
                    case 'loc.x':
                    case 'location.x':
                    case 'pos.x':
                    case 'position.x':
                        value = sprite.loc_x.value();
                        break;
                    case 'y':
                    case 'loc.y':
                    case 'location.y':
                    case 'pos.y':
                    case 'position.y':
                        value = sprite.loc_y.value();
                        break;
                    case 'z':
                    case 'depth':
                        value = sprite.depth;
                        break;
                    case 'sx':
                    case 'size.x':
                        value = sprite.size_x.value();
                        break;
                    case 'sy':
                    case 'size.y':
                        value = sprite.size_y.value();
                        break;
                    case 'angle':
                    case 'rotation':
                        value = sprite.angle.value();
                        break;
                    case 'visible':
                        value = Utils.t_or_f(sprite.visible);
                        break;
                    case 'role':
                        if (sprite.role == null) {
                            value = defaults.NOTFOUND;
                        } else {
                            value = sprite.role;
                        }
                        break;
                        // More still to do
                    default:
                }
            }
        }
        if (value === false) {
            // Otherwise, Look for built-ins first
            value = VarList.built_in(varName);
        }
        if (value === false) {
            // then look for user defined 
            if (sceneName != this.sceneName) { // look in a different scene
                const otherScene = Scene.find(sceneName);
                if (scene !== false) {
                    value = otherScene.varList.get_value(varName);
                }
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

    update(name, value) {
        if (VarList.built_in(name)) {
            Globals.log.error("Cannot update built-in variable " + name);
            return false;
        }
        let index = this.find(name);
        if (index === false) {
            Globals.log.error("Variable not found " + name);
            return defaults.NOTFOUND;
        } // else
        return this.variables[index].setValue(value);
    }

    delete(name) {
        let index = this.find(name);
        if (index === false) {
            Globals.log.error("Variable not found " + name);
            return false;
        } // else
        // can we update it?
        if (!this.variables[index].setValue(0)) {
            Globals.log.error("Cannot delete readonly variable " + name);
            return false;
        } // else
        this.variables.splice(index, 1);
        return true;
    }

    expand_vars(input) {
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

                let replacement = this.get_value(varName);

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
