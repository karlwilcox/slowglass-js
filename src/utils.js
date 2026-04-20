

import { Globals } from "./globals.js";
import { VarList } from "./vars.js";

/**************************************************************************************************
#                     
#        ####   ####  
#       #    # #    # 
#       #    # #      
#       #    # #  ### 
#       #    # #    # 
#######  ####   ####  
                      
**************************************************************************************************/

import defaults from "./defaults";


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
        this.triggers = [];
        this.actions = [];
        this.any_trigger = true;
        this.completed_actions = 0;
    }


    complete_action(action) {
        this.completed_actions += 1;
    }

    addAction(action) {
        this.actions.push(action);
    }

    addTrigger(trigger) {
        this.triggers.push(trigger);
    }

    actionCount() {
        return this.actions.length;
    }

    all_done() {
        return (this.completed_actions >= this.actionCount());
    }

    reset_count() {
        this.completed_actions = 0;
    }

    list() {
        let text = this.any_trigger ? "Any trigger\n" : "All triggers\n";
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
    return function(action) {
        object.completed_actions += 1;
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

    // const trigFunctions = {
    //     sin: Math.sin,
    //     cos: Math.cos,
    //     tan: Math.tan,
    //     int: Math.floor,
    // };

    // // Evaluate a single expression safely
    // function safeEval(expr) {
    //     try {
    //         // Only allow numbers, operators, decimal points, and whitespace
    //         if (!/^[0-9+\-*/%.()\s]+$/.test(expr)) {
    //             return "(" + expr + ")";
    //         }
    //         return Function('"use strict"; return (' + expr + ')')();
    //     } catch {
    //         return "(" + expr + ")";
    //     }
    // }

    // function safeTrigEval(name, expr) {
    //     const value = safeEval(expr);
    //     if (typeof value !== "number" || Number.isNaN(value)) {
    //         return name + "(" + expr + ")";
    //     }

    //     const radians = value * Math.PI / 180;
    //     return trigFunctions[name](radians);
    // }

    // let str = input;
    // if (!input.match(/\)/)) {
    //     return str;
    // }

    // // Handle nested parentheses by resolving innermost first
    // const regex = /\(([^()]+)\)/g;
    // const trigRegex = /\b(sin|cos|tan|int)\(([^()]+)\)/gi;

    // let previous;
    // do {
    //     previous = str;
    //     str = str.replace(trigRegex, (_, name, expr) => {
    //         return safeTrigEval(name.toLowerCase(), expr);
    //     });
    //     str = str.replace(regex, (_, expr) => {
    //         return safeEval(expr);
    //     });
    // } while (str !== previous);

    // return str;
// }


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
    constructor(start_time, duration, callback) {
        this.endtime = start_time + (1000 * duration);
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
    // Default to northern hemisphere
    const DEFAULT = "northern";

    // Check browser support
    if (!("geolocation" in navigator)) {
        callback(DEFAULT);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;

            if (lat < 0) {
                VarList.hemisphere = "southern";
            } else {
                VarList.hemisphere = "northern";
            }
        },
        (error) => {
            // Permission denied or other failure → default
            VarList.hemisphere = DEFAULT;
        },
        {
            timeout: 5000 // optional safeguard
        }
    );
}

export function t_or_f(value) {
    return value ? defaults.TRUEVALUE : defaults.FALSEVALUE;
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
