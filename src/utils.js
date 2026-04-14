

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
        console.log(text);
        this.errors.push(text);
    }

    log(text) {
        console.log(text);
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
        // console.log("reset count");
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
    // Evaluate a single expression safely
    function safeEval(expr) {
        try {
            // Only allow numbers, operators, decimal points, and whitespace
            if (!/^[0-9+\-*/%.()\s]+$/.test(expr)) {
                return "(" + expr + ")";
            }
            return Function('"use strict"; return (' + expr + ')')();
        } catch {
            return "(" + expr + ")";
        }
    }

    let str = input;
    if (!input.match(/\)/)) {
        return str;
    }

    // Handle nested parentheses by resolving innermost first
    const regex = /\(([^()]+)\)/g;

    let previous;
    do {
        previous = str;
        str = str.replace(regex, (_, expr) => {
            return safeEval(expr);
        });
    } while (str !== previous);

    return str;
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