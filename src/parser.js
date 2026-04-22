
import { Globals } from "./globals.js";
import * as constants from './constants.js';

export class Parser {
    constructor() {
        ; // set any options here
    }

    static testWord(words, word, def) {
        let retval = false;
        if (words.length > 0) {
            if (word instanceof Array) {
                for ( let i = 0; i < word.length; i++ ) {
                    if (words[0] == word[i]) {
                        retval = words[0];
                        words.shift();
                    }
                }
            } else if (words[0] == word) {
                retval = words[0];
                words.shift();
            }
        } // else
        if (retval == false && arguments > 2) {
            retval = def;
        }
        return(retval);
    }

    static getInt(words, def, min, max) {
        if (words.length > 0) {
            let word = words.shift();
            if (!word.match(/^[0-9-\.]+$/)) {
                Globals.log.error("Expected integer - " + word);
            }
            let retval = Math.floor(parseFloat(word));
            if (arguments.length > 2 && retval < min) {
                retval = min;
            }
            if (arguments.length > 3 && retval > max) {
                retval = max;
            }
            return(retval);
        }
        return(def);
    }

    static getFloat(words, def) {
        if (words.length > 0) {
            return(parseFloat(words.shift()));
        }
        return(def);
    }

    static getWord(words, def) {
        if (words.length > 0) {
            return(words.shift());
        }
        return(def);
    }

    static get_time_units(words, def) {
        // return a multiplier that gives seconds
        let mult = 1;
        let units = Parser.getWord(words, def);
        if (units.startsWith("s")) {
                // no need to change anything
                ;
        } else if (units.startsWith("m")) {
            mult = 60;
        } else if (units.startsWith("h")) {
            mult = 3600;
        } else if (units.startsWith("t")) {
            mult = 0.1;
        } else {
            Globals.log.error("Unknown time unit - " + units );
        }
        return mult;
    }

    static getDuration(words, def) {
        // by default duration is in seconds
        let value = Parser.getFloat(words, def) * Parser.get_time_units(words, "s");
        return(Math.round(value));
    }

    static getRate(words, def, extra) {
        let value = Parser.getFloat(words, def);
        if (arguments.length > 2) {
            Parser.testWord(words, extra);
        }
        Parser.testWord(words,"per");
        value *= Parser.get_time_units(words,"s");
        return value;
    }
}
