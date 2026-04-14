
import { Globals } from "./globals.js";

export class Parser {
    constructor() {
        ; // set any options here
    }

    static test_word(words, word, def) {
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

    static get_int(words, def, min, max) {
        if (words.length > 0) {
            let word = words.shift();
            if (!word.match(/^[0-9-]+$/)) {
                Globals.log.error("Expected integer - " + word);
            }
            let retval = parseInt(word);
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

    static get_float(words, def) {
        if (words.length > 0) {
            return(parseFloat(words.shift()));
        }
        return(def);
    }

    static get_word(words, def) {
        if (words.length > 0) {
            return(words.shift());
        }
        return(def);
    }

    static get_time_units(words, def) {
        // return a multiplier that gives seconds
        let mult = 1;
        let units = Parser.get_word(words, def);
        if (units.startsWith("s")) {
                // no need to change anything
                ;
        } else if (units.startsWith("m")) {
            mult = 60;
        } else if (units.startsWith("h")) {
            mult = 3600;
        } else {
            Globals.log.error("Unknown time unit - " + units );
        }
        return mult;
    }

    static get_duration(words, def) {
        // by default duration is in seconds
        let value = Parser.get_float(words, def) * Parser.get_time_units(words, "s");
        return(Math.round(value));
    }

    static get_rate(words, def, extra) {
        let value = Parser.get_float(words, def);
        if (arguments.length > 2) {
            Parser.test_word(words, extra);
        }
        Parser.test_word(words,"per");
        value *= Parser.get_time_units(words,"s");
        return value;
    }
}
