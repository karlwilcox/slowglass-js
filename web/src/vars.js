
import { Globals } from "./globals.js";
import Defaults from "./defaults.js";
import * as Utils from "./utils.js";

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

    constructor() {
        this.variables = [];
        this.trigger = null;
        this.hemisphere = null;
        Utils.getHemisphere(this.makeHemisphereCallback(this));
    }

    makeHemisphereCallback(object) {
        return function(hemisphere) {
            object.hemisphere = hemisphere
        }
    }

    create(name, value) {
        if (VarList.built_in(name)) {
            Globals.log.error("Cannot create built-in variable " + name);
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
                return new Intl.DateTimeFormat(Defaults.LOCALE, { second: "numeric" }).format(date);
            case "MINUTES":
            case "MINUTE":
                return new Intl.DateTimeFormat(Defaults.LOCALE, { minute: "numeric" }).format(date);
            case "HOUR":
            case "HOURS":
                return new Intl.DateTimeFormat(Defaults.LOCALE, { hour: "numeric" }).format(date);
            case "DAYOFWEEK":
                return date.getDay() + 1; // Sunday = 1
            case "DAYNAME":
                return new Intl.DateTimeFormat(Defaults.LOCALE, { weekday: "long" }).format(date);
            case "MONTH":
                return month;
            case "MONTHNAME":
                return new Intl.DateTimeFormat(Defaults.LOCALE, { month: "long" }).format(date);
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
                            (this.hemisphere == "southern" && (month >= 6 && month <= 8))) ? Defaults.TRUEVALUE : Defaults.FALSEVALUE;
            case "SPRING":
                return ((this.hemisphere == "northern" && (month >= 3 && month <= 5)) ||
                            (this.hemisphere == "southern" && (month >= 9 && month <= 11))) ? Defaults.TRUEVALUE : Defaults.FALSEVALUE;
            case "SUMMER":
                return ((this.hemisphere == "northern" && (month >= 6 && month <= 8)) ||
                            (this.hemisphere == "southern" && (month >= 12 || month <= 2))) ? Defaults.TRUEVALUE : Defaults.FALSEVALUE;
            case "AUTUMN":
                return ((this.hemisphere == "northern" && (month >= 9 && month <= 11)) ||
                            (this.hemisphere == "southern" && (month >= 3 && month <= 5))) ? Defaults.TRUEVALUE : Defaults.FALSEVALUE;
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
                return date.getDay() > 0 && date.getDay() < 6 ? Defaults.TRUEVALUE : Defaults.FALSEVALUE;
            case "WEEKEND":
                return date.getDay() == 0 || date.getDay() == 6 ? Defaults.TRUEVALUE : Defaults.FALSEVALUE;
            case "MORNING":
                return date.getHour() > 6 && date.getHour() < 13 ? Defaults.TRUEVALUE : Defaults.FALSEVALUE;
            case "AFTERNOON":
                return date.getHour() > 11 && date.getHour() < 18 ? Defaults.TRUEVALUE : Defaults.FALSEVALUE;
            case "EVENING":
                return date.getHour() > 18 && date.getHour() < 22 ? Defaults.TRUEVALUE : Defaults.FALSEVALUE;
            case "NIGHT":
                return date.getHour() > 22 || date.getHour() < 6 ? Defaults.TRUEVALUE : Defaults.FALSEVALUE;
            case "KEY":
                return Globals.key == null ? Defaults.NOTFOUND : Globals.key;
            case "LASTKEY":
                return Globals.lastKey == null ? Defaults.NOTFOUND : Globals.lastKey;
            case "SCALEX":
                return Globals.script_scale_x;
            case "SCALEY":
                return Globals.script_scale_y;
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

    get_value(name) {
        let value = VarList.built_in(name);
        if (value === false) {
            let index = this.find(name);
            if (index !== false) {
                value = this.variables[index].getValue();
            } else {
                Globals.log.error("Variable not found " + name);
                value = Defaults.NOTFOUND;
            }
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
            return Defaults.NOTFOUND;
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

                let replacement = "";
                if (varName.match(/:/)) {
                    replacement = VarList.scene_var(varName);
                } else {
                    replacement = this.get_value(varName);
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