import { Parser } from "./parser";
import * as Utils from "./utils.js";
import { Globals } from "./globals.js";

export class Trigger {
    constructor(scene, timestamp, params) {
        this.scene = scene;
        this.triggered = false; // don't think this is ever used...
        this.expired = false;
        this.nextUpdate = 0;
        this.triggerTime = 0;
        this.createTime = timestamp;
        this.params = params;
        this.expanded = null;
    }

    fired(timestamp) {
        return false;
    }

    expandAll(input) {
        let expanded = this.scene.varList.expandVars(input);
        expanded = Utils.evaluate(expanded);
        return Parser.splitWords(expanded);
    }
}


/**************************************************************************************************

    ######  ########    ###    ########  ######## 
   ##    ##    ##      ## ##   ##     ##    ##    
   ##          ##     ##   ##  ##     ##    ##    
    ######     ##    ##     ## ########     ##    
         ##    ##    ######### ##   ##      ##    
   ##    ##    ##    ##     ## ##    ##     ##    
    ######     ##    ##     ## ##     ##    ##    

**************************************************************************************************/


export class Start extends Trigger {
    constructor(scene, timestamp, params) {
        super(scene, timestamp, params);
    }

    fired(timestamp) {
        if (this.expired) {
            return false;
        }
        this.triggered = true;
        this.expired = true;
        return true;
    }
}

/**************************************************************************************************

    ######  ######## ######## ##     ## ########  
   ##    ## ##          ##    ##     ## ##     ## 
   ##       ##          ##    ##     ## ##     ## 
    ######  ######      ##    ##     ## ########  
         ## ##          ##    ##     ## ##        
   ##    ## ##          ##    ##     ## ##        
    ######  ########    ##     #######  ##        

**************************************************************************************************/

export class Setup extends Trigger {
    constructor(scene, timestamp, params) {
        super(scene, timestamp, params);
    }

    fired(timestamp) {
        if (this.expired) {
            return false;
        }
        this.triggered = true;
        this.expired = true;
        return true;
    }
}

/**************************************************************************************************
   #                               
  # #   ###### ##### ###### #####  
 #   #  #        #   #      #    # 
#     # #####    #   #####  #    # 
####### #        #   #      #####  
#     # #        #   #      #   #  
#     # #        #   ###### #    # 
                                   
**************************************************************************************************/

export class After extends Trigger {
    constructor(scene, timestamp, params) {
        super(scene, timestamp, params);
        this.triggerTime = null;
    }

    fired(timestamp) {
        if (this.expired) {
            return false;
        }
        // expand on first use
        if (this.expanded == null) {
            this.expanded = this.expandAll(this.params);
            this.triggerTime = this.createTime + Parser.getDuration(this.expanded,1) * 1000;
        }
        if (timestamp > this.triggerTime) {
            this.triggered = true;
            this.expired = true;
            return true;
        }
        return false;
    }
}


/**************************************************************************************************

   ######## ##     ## ######## ########  ##    ## 
   ##       ##     ## ##       ##     ##  ##  ##  
   ##       ##     ## ##       ##     ##   ####   
   ######   ##     ## ######   ########     ##    
   ##        ##   ##  ##       ##   ##      ##    
   ##         ## ##   ##       ##    ##     ##    
   ########    ###    ######## ##     ##    ##    

**************************************************************************************************/

export class Every extends Trigger {
    constructor(scene, timestamp, params) {
        super(scene, timestamp, params);
        this.triggerRate = null;
        this.last_triggered = timestamp;
    }

    fired(timestamp) {
        // expand on first use
        if (this.expanded == null) {
            this.expanded = this.expandAll(this.params);
            this.triggerRate = Parser.getDuration(this.expanded,1) * 1000;
        }
        if (timestamp - this.last_triggered > this.triggerRate) {
            this.triggered = true;
            this.last_triggered = timestamp;
            return true;
        } // else
        this.triggered = false;
        return false;
    }
}


/**************************************************************************************************

   ##      ## ##     ## ######## ##    ## 
   ##  ##  ## ##     ## ##       ###   ## 
   ##  ##  ## ##     ## ##       ####  ## 
   ##  ##  ## ######### ######   ## ## ## 
   ##  ##  ## ##     ## ##       ##  #### 
   ##  ##  ## ##     ## ##       ##   ### 
    ###  ###  ##     ## ######## ##    ## 

**************************************************************************************************/

export class When extends Trigger {
    constructor(scene, timestamp, params) {
        super(scene, timestamp, params);
        this.nextCheck = 0;
    }

    fired(timestamp) {
        if (this.triggered)  {
            if (this.nextCheck > timestamp) {
                // we have triggered recently, come back later
                return false;
            } else {
                // OK, start checking again
                this.triggered = false;
            }
        }
        let result = false;
        // use the raw parameters and expand on *every* use
        let expanded = this.expandAll(this.params);
        result = Utils.logical(expanded);
        if (result) {
            this.triggered = true;
            this.nextCheck = timestamp + (1000 * 60);
            return true
        } // else
        this.triggered = false;
        return false;
    }
}


/**************************************************************************************************

      ###    ######## 
     ## ##      ##    
    ##   ##     ##    
   ##     ##    ##    
   #########    ##    
   ##     ##    ##    
   ##     ##    ##    

**************************************************************************************************/

export class AtClass extends Trigger {
    constructor(scene, timestamp, params) {
        super(scene, timestamp, params);
        this.minutes = null;
        this.hours = null;
        this.seconds = 0;
        this.nextCheck = 0;
        this.valid = true;
    }

    fired(timestamp) {
        if (!this.valid) {
            return false;
        }
        // expand on first use
        if (this.expanded == null) {
            this.expanded = this.expandAll(this.params);
            if (this.expanded.length > 0) {
                const timeofDay = this.expanded[0];
                if (timeofDay.match(/^[0-9]+:[0-9]+(:[0-9]+)?$/)) { // HH:MM:SS
                    const parts = timeofDay.split(":");
                    this.hours = parseInt(parts[0]);
                    this.minutes = parseInt(parts[1]);
                    if (parts.length > 2) {
                        this.seconds = parseInt(parts[2]);
                    }
                } else {
                    Globals.log.error("Incorrect time format " + timeofDay);
                    this.valid = false;
                }
            } else {
                Globals.log.error("Missing time for at ");
                    this.valid = false;
            }
        }
        if (this.nextCheck > timestamp) {
            // try again later
            return false;
        }
        const d = new Date();
        d.setTime(timestamp);
        let matched = true;
        if (this.hours != d.getHours()) {
            matched = false;
        }
        if (this.minutes != d.getMinutes()) {
            matched = false;
        }
        if (this.seconds != d.getSeconds()) {
            matched = false;
        }
        if (matched) { // If triggered, leave it for a while, as we can only trigger once per day at most
            this.nextCheck = timestamp + (60 * 60 * 1000); // wait an hour
        }
        return matched;
    }
}

/**************************************************************************************************

   ########    ###     ######  ##     ## 
   ##         ## ##   ##    ## ##     ## 
   ##        ##   ##  ##       ##     ## 
   ######   ##     ## ##       ######### 
   ##       ######### ##       ##     ## 
   ##       ##     ## ##    ## ##     ## 
   ######## ##     ##  ######  ##     ## 

**************************************************************************************************/

export class Each extends Trigger {
    constructor(scene, timestamp, params) {
        super(scene, timestamp, params);
        this.matchString = "**:**:**";
        this.nextCheck = 0;
    }

    fired(timestamp) {
        // expand on first use
        if (this.expanded == null) {
            this.expanded = this.expandAll(this.params);
            let temp;
            if (this.expanded.length > 0) {
                const candidate = this.expanded[0];
                if (!candidate.match(/^[*0-2][*0-9]:[*0-5][*0-9](:[*0-5][*0-9])?$/)) {
                    Globals.log.error("Incorrect time format- " + candidate);
                    return false;
                }
                if (candidate.length == 5) {
                    this.matchString = candidate + ":00";
                } else {
                    this.matchString = candidate;
                }
            } else {
                Globals.log.error("Missing time for each ");
            }
        }
        // Do we need to run yet?
        if (this.nextCheck > timestamp) {
            return false;
        }
        // Now check for a match
        const d = new Date(timestamp);
        const timeString = d.toTimeString();
        let matched = true;
        for (let i = 0; i < this.matchString.length; i++ ) {
            let match = this.matchString.charAt(i);
            if (match == "*") {
                continue;
            }
            if (match != timeString.charAt(i)) {
                matched = false;
                break;
            }
        }
        // check again in another second
        this.nextCheck = timestamp + 1000;

        return matched;
    }
}

/**************************************************************************************************

      ###    ######## ######## ##    ## ########  
     ## ##      ##    ##       ###   ## ##     ## 
    ##   ##     ##    ##       ####  ## ##     ## 
   ##     ##    ##    ######   ## ## ## ##     ## 
   #########    ##    ##       ##  #### ##     ## 
   ##     ##    ##    ##       ##   ### ##     ## 
   ##     ##    ##    ######## ##    ## ########  

**************************************************************************************************/

export class AtEnd extends Trigger {
    constructor(scene, timestamp, params) {
        super(scene, timestamp, params);
    }

    fired(timestamp) {
        if (this.expired) {
            return false;
        }
        // triggered when the scene is stopped
        if (this.scene.finished) {
            this.expired = true;
            this.scene.finished = false; // consume this event
            return true;
        } // else
        return false;
    }
}
