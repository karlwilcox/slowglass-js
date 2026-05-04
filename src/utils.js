

import { Globals } from "./globals.js";
import { VarList } from "./vars.js";
import * as constants from './constants.js';
import defaults from "./defaults";

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
        this.nextAction = 0; // for looping
        this.failedIfCount = 0; // for nesting if statements
    }

    addAction(action) {
        this.actions.push(action);
    }

    addTrigger(trigger) {
        this.triggers.push(trigger);
    }

    isFinished() {
        if (this.triggered && this.unfinishedCount == 0) {
            this.triggered = false;
            return true;
        } // else
        return false;
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
}

export function makeCompletionCallback(object) {
    return function(delta) {
        object.unfinishedCount += delta;
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
                    // Globals.log.report("Found: " + expr);
                    str += Globals.evaluator.eval(expr);
                    expr = "";
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
        } else if ( ["false","no","n","none"].includes(words[0].toLowerCase())) {
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
    }

    expired(now) {
        if (now > this.endtime) {
            this.callback("timer");
            return true;
        } // else
        return false;
    }
}

export function getHemisphere(callback) {
    // Check browser support
    if (!("geolocation" in navigator)) {
        callback(defaults.HEMISPHERE);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;

            if (lat < 0) {
                Globals.hemisphere = "southern";
            } else {
                Globals.hemisphere = "northern";
            }
        },
        (error) => {
            // Permission denied or other failure → default
            Globals.hemisphere = defaults.HEMISPHERE;
        },
        {
            timeout: 5000 // optional safeguard
        }
    );
}

export function boolAsString(value) {
    return value ? constants.TRUE_VALUE : defaults.FALSEVALUE;
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
