

import { Globals } from "./globals.js";
import { VarList, TagList } from "./vars.js";
import * as constants from './constants.js';
import defaults from "./defaults";

export function boolAsString(value) {
    return value ? constants.TRUE_VALUE : constants.FALSE_VALUE;
}

export function expandRange(str) {
    const match = str.match(/^(-?\d+)\.\.(-?\d+)$/);
    if (!match) {
        Globals.log.error("Invalid range format");
        return "";
    }
    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);
    const numbers = [];
    if (start <= end) {
        for (let i = start; i <= end; i++) {
            numbers.push(i);
        }
    } else {
        for (let i = start; i >= end; i--) {
            numbers.push(i);
        }
    }
    return numbers.join(" ");
}

/**************************************************************************************************
#                     
#        ####   ####  
#       #    # #    # 
#       #    # #      
#       #    # #  ### 
#       #    # #    # 
#######  ####   ####  
                      
**************************************************************************************************/

console.error = function(message) {
    Globals.log.error(message);
};

export class Log {
    constructor(debug_on) {
        this.debug_on = debug_on;
        this.errors = [];
        this.messageElement = null;
    }

    debug(text) {
        if (this.debug_on) {
            console.log(text);
        }
    }

    clearDuplicates() {
        this.errors = [];
    }

    // don't report duplicate errors
    error(text) {
        for ( let i = 0; i < this.errors.length; i++ ) {
            if (this.errors[i] == text) {
                return;
            }
        } // else
        if (this.messageElement != null) {
            this.report(text);
        } else {
            console.log(text);
        }
        this.errors.push(text);
    }

    log(text) {
        console.log(text);
    }

    report(text) {
        if (this.messageElement != null) {
            this.messageElement.value += text + "\n";
        }
    }

    messageParent(elementID) {
        this.messageElement = document.getElementById(elementID);
    }
}

/**************************************************************************************************
#                       
#       # #    # ###### 
#       # ##   # #      
#       # # #  # #####  
#       # #  # # #      
#       # #   ## #      
####### # #    # ###### 
                        
**************************************************************************************************/

export class Line {
    constructor(number, text) {
        this.number = number;
        this.text = text;
    }
}

/**************************************************************************************************

    ######  ########    ###     ######  ##    ## ######## ########     ###    ##     ## ######## 
   ##    ##    ##      ## ##   ##    ## ##   ##  ##       ##     ##   ## ##   ###   ### ##       
   ##          ##     ##   ##  ##       ##  ##   ##       ##     ##  ##   ##  #### #### ##       
    ######     ##    ##     ## ##       #####    ######   ########  ##     ## ## ### ## ######   
         ##    ##    ######### ##       ##  ##   ##       ##   ##   ######### ##     ## ##       
   ##    ##    ##    ##     ## ##    ## ##   ##  ##       ##    ##  ##     ## ##     ## ##       
    ######     ##    ##     ##  ######  ##    ## ##       ##     ## ##     ## ##     ## ######## 

**************************************************************************************************/

export class StackFrame {
    constructor(type, line_no, data = null, varName = null) {
        this.type = type;
        // Looping constructs
        this.varName = varName;
        this.forValues = data;
        // While constructs
        this.whileTest = data;
        // common
        this.jump_line = line_no;
        // runaway protection
        this.counter = 0;
    }
}

/**************************************************************************************************
   #                                  #####                              
  # #    ####  ##### #  ####  #    # #     # #####   ####  #    # #####  
 #   #  #    #   #   # #    # ##   # #       #    # #    # #    # #    # 
#     # #        #   # #    # # #  # #  #### #    # #    # #    # #    # 
####### #        #   # #    # #  # # #     # #####  #    # #    # #####  
#     # #    #   #   # #    # #   ## #     # #   #  #    # #    # #      
#     #  ####    #   #  ####  #    #  #####  #    #  ####   ####  #      
                                                                         
**************************************************************************************************/



export class ActionGroup {
    constructor() {
        this.triggered = false;
        this.triggers = [];
        this.actions = [];
        this.anyTrigger = true;
        this.unfinishedCount = 0;
        this.stack = [];
        this.suspended = false;
        this.nextAction = 0; // for looping
        this.failedIfCount = 0; // for nesting if statements
        this.waitType = false;
        this.waitClause = "";
        this.dataVarName = "";
    }

    addAction(action) {
        this.actions.push(action);
    }

    addTrigger(trigger) {
        this.triggers.push(trigger);
    }

    isFinished() {
        return (this.unfinishedCount <= 0);
    }

    suspend(type, action, clause = "") {
        this.waitType = type;
        this.suspended = action;
        this.waitClause = clause;
    }

    resume() {
        const nextAction = this.suspended + 1;
        this.suspended = false;
        return nextAction;
    }
        

    startCounting() {
        this.triggered = true;
        this.unfinishedCount = 0;
    }

    list() {
        let text = this.anyTrigger ? "Any trigger\n" : "All triggers\n";
        for(let i = 0; i < this.triggers.length; i++) {
            text += this.triggers[i].constructor.name + " ";
            text += this.triggers[i].params + "\n";
        }
        for(let i = 0; i < this.actions.length; i++) {
            text += this.actions[i].text + "\n";
        }
        return text;
    }

    updateCount(delta) {
        this.unfinishedCount += delta;
    }

    callback() {
        return (delta) => {
            this.unfinishedCount += delta;
        };
    }


}

/**************************************************************************************************

   ######## ##     ##    ###    ##       ##     ##    ###    ######## ######## 
   ##       ##     ##   ## ##   ##       ##     ##   ## ##      ##    ##       
   ##       ##     ##  ##   ##  ##       ##     ##  ##   ##     ##    ##       
   ######   ##     ## ##     ## ##       ##     ## ##     ##    ##    ######   
   ##        ##   ##  ######### ##       ##     ## #########    ##    ##       
   ##         ## ##   ##     ## ##       ##     ## ##     ##    ##    ##       
   ########    ###    ##     ## ########  #######  ##     ##    ##    ######## 

**************************************************************************************************/


export function evaluate(input) {
    let str = ""; // holds the output string
    // find a bracketed expression in the input
    let i = 0;
    let expr = ""; // temporarily holds the expression to be evaluated
    let brackets = 0; // bracket counter
    let escaped = false; // did we find a backslash?
    do {
        const char = input.charAt(i);
        if (escaped) { // just copy the next character
            str += char;
            escaped = false;
            continue;
        }
        if (char == '\\') {
            escaped = true;
            continue;
        }
        if (brackets > 0) { // we are in an expression
            if (char == ')') {
                if (--brackets == 0) { // matched brackets
                    try {
                        if (Globals.evaluator == "basic") {
                            str += Globals.basicEvaluator.eval(expr);
                        } else if (Globals.evaluator == "advanced") { 
                            str += Globals.advancedEvaluator.evaluate(expr);
                        } else {
                            Globals.log.error("unknown evaluator option");
                        } // provision for others...
                        expr = "";
                    }
                    catch(e) {
                        Globals.log.error(e.message);
                    }
                } else {
                    expr += char;
                }
                continue;
            } // else
            if (char == '(') {
                brackets++;
            }
            expr += char;
            continue;
        } // else in normal text
        if (char == '(') { // found an expression! Start counting
            brackets = 1;
            continue;
        } // else
        str += char;
    } while(++i < input.length);
    return str;
}

/**************************************************************************************************

   ##        #######   ######   ####  ######     ###    ##       
   ##       ##     ## ##    ##   ##  ##    ##   ## ##   ##       
   ##       ##     ## ##         ##  ##        ##   ##  ##       
   ##       ##     ## ##   ####  ##  ##       ##     ## ##       
   ##       ##     ## ##    ##   ##  ##       ######### ##       
   ##       ##     ## ##    ##   ##  ##    ## ##     ## ##       
   ########  #######   ######   ####  ######  ##     ## ######## 

**************************************************************************************************/

export function logical(words) {
    let result = false;
    let inverted = false;
    if (words[0] == "not") {
        words.shift();
        inverted = true;
    }
    if (words.length == 0) { // no arguments, just return something
        result = !inverted;
    } else if (words.length == 1) { // check it for truthiness / falseiness
        if (words[0].match(/^[-0-9\.\+]+$/)) { // looks like a number
            result = !(Math.abs(parseFloat(words[0])) < 0.001); // zero is false, all else true
        } else if ( ["false","no","n","none","invalid"].includes(words[0].toLowerCase())) {
            result = false;
        } else {
            result = true;
        }
    } else if (words.length == 2) { // string compare the two things
        result = words[0].toLowerCase == words[1].toLowerCase;
    } else if (words.length > 2) { // middle thing is a logical comparison
        let lvalue = words[0].toLowerCase();
        let rvalue = words[2].toLowerCase();
        let comparison = words[1].toLowerCase();
        switch(comparison) {
            case "is":
            case "equals":
            case "=":
            case "==":
                result = lvalue == rvalue;
                break;
            case "not":
            case "!=":
            case "!==":
                result = lvalue != rvalue;
                break;
            case ">":
                result = lvalue > rvalue;
                break;
            case "<":
                result = lvalue < rvalue;
                break;
            case ">=":
                result = lvalue >= rvalue;
                break;
            case "<=":
                result = lvalue <= rvalue;
                break;
            default:
                Globals.log.error("Unknown comparison - " + comparison);
                break;
        }
    }
    return inverted ? !result : result;
}

/**************************************************************************************************

   ######## #### ##     ## ######## ########   ######  
      ##     ##  ###   ### ##       ##     ## ##    ## 
      ##     ##  #### #### ##       ##     ## ##       
      ##     ##  ## ### ## ######   ########   ######  
      ##     ##  ##     ## ##       ##   ##         ## 
      ##     ##  ##     ## ##       ##    ##  ##    ## 
      ##    #### ##     ## ######## ##     ##  ######  

**************************************************************************************************/

export class Timer {
    constructor(startTime, duration, callback) {
        this.endtime = startTime + (1000 * duration);
        this.callback = callback;
        this.running = true;
        callback(1);
    }

    expired(now) {
        if (this.running && now > this.endtime) {
            this.callback(-1);
            this.running = false;
            return true;
        } // else
        return false;
    }
}


/**************************************************************************************************

   ########  ######## ########   #######  ########  ######## ######## ########  
   ##     ## ##       ##     ## ##     ## ##     ##    ##    ##       ##     ## 
   ##     ## ##       ##     ## ##     ## ##     ##    ##    ##       ##     ## 
   ########  ######   ########  ##     ## ########     ##    ######   ########  
   ##   ##   ##       ##        ##     ## ##   ##      ##    ##       ##   ##   
   ##    ##  ##       ##        ##     ## ##    ##     ##    ##       ##    ##  
   ##     ## ######## ##         #######  ##     ##    ##    ######## ##     ## 

**************************************************************************************************/

export class  Reporter {
    constructor() {
    }

    dumpScene(scene) {
        if (typeof scene === "string") { // assume it is a name
            scene = Scene.find(scene);
        }
        Globals.log.report(scene.dump());
    }

}


/**************************************************************************************************

   ##        #######   ######     ###    ######## ####  #######  ##    ## 
   ##       ##     ## ##    ##   ## ##      ##     ##  ##     ## ###   ## 
   ##       ##     ## ##        ##   ##     ##     ##  ##     ## ####  ## 
   ##       ##     ## ##       ##     ##    ##     ##  ##     ## ## ## ## 
   ##       ##     ## ##       #########    ##     ##  ##     ## ##  #### 
   ##       ##     ## ##    ## ##     ##    ##     ##  ##     ## ##   ### 
   ########  #######   ######  ##     ##    ##    ####  #######  ##    ## 

**************************************************************************************************/

export class Location {

    constructor() {
        this.city = defaults.CITY;
        this.lat = defaults.LAT;
        this.lon = defaults.LON;
    }

    hemisphere() {
        return this.lat >= 0 ? "northern" : "southern";
    }

    season() {
        const date = new Date();
        switch (date.getMonth() + 1) {
            case 12:
            case 1:
            case 2:
                return this.lat >= 0 ?  "winter" : "summer";
            case 3:
            case 4:
            case 5:
                return this.this >= 0 ?  "spring" : "autumn";
            case 6:
            case 7:
            case 8:
                return this.this >= 0 ?  "summer" : "winter";
            case 9:
            case 10:
            case 11:
                return this.this >= 0 ?  "autumn" : "spring";
        }
    }

    isWinter() {
        const date = new Date();
        const month = date.getMonth() + 1;
        return boolAsString((this.lat >= 0 && (month >= 12 || month <= 2)) ||
                            (this.lat < 0 && (month >= 6 && month <= 8)));
    }

    isSpring() {
        const date = new Date();
        const month = date.getMonth() + 1;
        return boolAsString((this.lat >= 0 && (month >= 3 && month <= 5)) ||
                            (this.lat < 0 && (month >= 9 && month <= 11)));
    }

    isSummer() {
        const date = new Date();
        const month = date.getMonth() + 1;
        return boolAsString((this.lat >= 0 && (month >= 6 && month <= 8)) ||
                            (this.lat < 0 && (month >= 12 || month <= 2)))
    }

    isAutumn() {
        const date = new Date();
        const month = date.getMonth() + 1;
        return boolAsString((this.lat >= 0 && (month >= 9 && month <= 11)) ||
                            (this.lat < 0 && (month >= 3 && month <= 5)));
    }

    sunAngle() {
        const date = new Date();
        const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const deg2rad = Math.PI / 180;
        let delta = -23.44 * Math.cos(deg2rad * (360/365) * (dayOfYear + 10));
        let Ts = date.getHours() + this.lon / 15;
        let H = 15 * (Ts - 12);
        let phi = this.lat * deg2rad;
        let d = delta * deg2rad;
        let h = Math.asin(
            Math.sin(phi) * Math.sin(d) +
            Math.cos(phi) * Math.cos(d) * Math.cos(H * deg2rad)
        );

        return Math.floor(h / deg2rad); // degrees
    }

    setLat(input) {
        const digits = input.match(/[0-9]+/);
        let lat = parseInt(digits[0]);
        if ((input.includes("s") || input.includes("S")) && lat > 0) {
            lat *= -1;
        }
        this.lat = lat;
    }

    setLon(input) {
        const digits = input.match(/[0-9]+/);
        let lon = parseInt(digits[0]);
        if ((input.includes("w") || input.includes("W")) && lon > 0) {
            lon *= -1;
        }
        this.lon = lon;
    }
}
