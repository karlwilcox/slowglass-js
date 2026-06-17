
import { Globals } from "./globals.js";
import * as constants from './constants.js';

export class Parser {
    constructor() {
        ; // set any options here
    }

    static joinWords(words) {
        let result = "";
        let isFirst = true;

        for (let i = 0; i < words.length; i++) {
            if (isFirst) {
                isFirst = false;
            } else { // needs a space before
                result += " ";
            }
            if (words[i].includes(" ")) {
                result += `"${words[i]}"`;
            } else {
                result += words[i];
            }
        }
        return result;
    }

    static splitWords(input) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let escape = false;

        for (let i = 0; i < input.length; i++) {
            const char = input[i];

            if (escape) {
            // Add character literally (including quotes)
            current += char;
            escape = false;
            continue;
            }

            if (char === '\\') {
            escape = true;
            continue;
            }

            if (char === '"') {
            inQuotes = !inQuotes;
            continue; // Do not include the quote itself
            }

            if (char === ' ' && !inQuotes) {
            if (current.length > 0) {
                result.push(current);
                current = '';
            }
            continue;
            }

            current += char;
        }

        if (current.length > 0) {
            result.push(current);
        }

        return result;
    }

    static testWord(words, word, def) {
        let retval = false;
        if (words.length > 0) {
            if (word instanceof Array) {
                for ( let i = 0; i < word.length; i++ ) {
                    if (words[0] == word[i]) {
                        retval = words[0];
                        words.shift();
                        break;
                    }
                }
            } else if (words[0] == word) {
                retval = words[0];
                words.shift();
            }
        } // else
        if (retval == false && arguments.length > 2) {
            retval = def;
        }
        return(retval);
    }

    static getInt(words, def, min, max) {
        let retval = def;
        if (words.length > 0) {
            let word = words.shift();
            if (!word.match(/^-?[0-9][0-9\.]*$/)) {
                Globals.log.error("Expected integer - " + word);
            } else {
                let retval = Math.floor(parseFloat(word));
                if (arguments.length > 2 && retval < min) {
                    retval = min;
                }
                if (arguments.length > 3 && retval > max) {
                    retval = max;
                }
            }
        }
        return retval;
    }

    static getFloat(words, def) {
        let retval = def;
        if (words.length > 0) {
            let word = words.shift();
            if (!word.match(/^-?[0-9][0-9\.]*$/)) {
                Globals.log.error("Expected float - " + word);
            } else {
                retval = parseFloat(words.shift());
            }
        }
        return retval;
    }

    static getWord(words, def) {
        if (words.length > 0) {
            return(words.shift());
        }
        return(def);
    }

    static getTime_units(words, def) {
        // return a multiplier that gives seconds
        let mult = 1;
        let units = Parser.getWord(words, def);
        switch(units) {
            case "s":
            case "sec":
            case "secs":
            case "second":
            case "seconds":
                // no need to change anything
                break; 
            case "m":
            case "min":
            case "mins":
            case "minute":
            case "minutes":
                mult = 60;
                break;
            case "h":
            case "hr":
            case "hrs":
            case "hour":
            case "hours":
                mult = 3600;
                break;
            case "t":
            case "tenth":
            case "tenths":
                mult = 0.1;
                break;
            default:
                Globals.log.error("Unknown time unit - " + units );
                break;
        }
        return mult;
    }

    static getDuration(words, def) {
        // by default duration is in seconds
        let value = Parser.getFloat(words, def) * Parser.getTime_units(words, "s");
        return(Math.round(value));
    }

    static getRate(words, def, extra) {
        let value = Parser.getFloat(words, def);
        if (arguments.length > 2) {
            Parser.testWord(words, extra);
        }
        Parser.testWord(words,"per");
        value *= Parser.getTime_units(words,"s");
        return value;
    }
}
