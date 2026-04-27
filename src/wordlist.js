
import { Globals } from "./globals.js";
import { SGSprite } from "./sgsprite.js";
import * as constants from './constants.js';

export class WordList {
    constructor(input) {
        this.index = 0;
        const result = [];
        let current = '';
        let currentWord = "";
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
        this.words = result;
        if (result.length) {
            this.currentWord = this.words[0];
        }
    }

    nextWord() {
        if (++this.index < this.words.length) {
            this.currentWord = this.words[this.index];
        } else {
            this.currentWord = false;
        }
    }

    rewind(toIndex) {
        this.index = toIndex;
        this.currentWord = this.words[this.index];
    }

    allUsed() {
        return this.index >= this.words.length;
    }

    wordsLeft() {
        return this.words.length - this.index; // index points to the current word
    }

    joinWords() {
        let result = "";
        let isFirst = true;

        for (let i = this.index; i < this.words.length; i++) {
            if (isFirst) {
                isFirst = false;
            } else { // needs a space before
                result += " ";
            }
            if (this.words[i].includes(" ")) {
                result += `"${this.words[i]}"`;
            } else {
                result += this.words[i];
            }
        }
        return result;
    }

    randomWord() {
        if (this.allUsed()) {
            return false;
        } else if (this.wordsLeft() == 1) {
            return this.currentWord;
        } // else {
        const randomIndex = this.index + Math.floor(Math.random() * this.wordsLeft());
        return this.words[randomIndex];
    }

    matchWords(searchWord, anchor=false) {
        if (this.allUsed()) {
            return false;
        }
        const matchWords = this.words.slice(this.index);
        let matches = [];
        if (anchor == "start" ) {
            matches = matchWords.filter(word => word.startsWith(searchWord));
        } else if (anchor == "end") {
            matches = matchWords.filter(word => word.endsWith(searchWord));
        } else {
            matches = matchWords.filter(word => word.includes(searchWord));
        }
        return matches;
    }
    
    testWord(target, def=false) {
        let result = def;
        if (this.wordsLeft()) {
            const compareTo = this.currentWord.toLowerCase();
            if (target instanceof Array) {
                for ( let i = 0; i < target.length; i++ ) {
                    if (compareTo == target[i]) {
                        result = this.currentWord;
                        this.nextWord();
                        break;
                    }
                }
            } else if (compareTo == target) {
                result = this.currentWord;
                this.nextWord();
            }
        } // else
        return(result);
    }

    getInt(def=false, min=false, max=false) {
        let result = def;
        if (this.wordsLeft()) {
            const candidate = this.getFloat();
            if (candidate !== false) { // got a number, convert to int
                result = Math.floor(candidate);
                if (min !== false && result < min) {
                    result = min;
                }
                if (max !== false && result > max) {
                    result = max;
                }
            }
        }
        return result;
    }

    getFloat(def=false) {
        let result = def;
        if (this.wordsLeft()) {
            const candidate = this.currentWord;
            if (candidate.match(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/)) {
                result = parseFloat(candidate);
                this.nextWord();
            }
        }
        return result;
    }

    indexOfWord(target) {
        return this.words.indexOf(target);
    }

    sliceWords(start, end) {
        if (arguments.length == 1) {
            return this.words.slice(start);
        } else {
            return this.words.slice(start, end);
        }
    }


    getWord(def=false) {
        let result = def;
        if (this.wordsLeft()) {
            result = this.currentWord;
            this.nextWord();
        }
        return result;
    }

    getTimeUnitMultiplier() {
        // return a multiplier that gives seconds
        let mult = 1;
        if (this.allUsed()) {
            return mult;
        }
        const candidate = this.currentWord;
        let found = true;
        switch (candidate) {
            case "s":
            case "sec":
            case "secs":
            case "second":
            case "seconds":
                // already correct
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
                found = false;
                Globals.log.error("Unknown time unit - " + candidate );
                break;
        }
        if (found) {
            this.nextWord();
        }
        return mult;
    }

    getDuration(def=0, requireIn=false) {
        let value = def;
        const hold = this.index;
        if (this.wordsLeft()) {
            if (this.currentWord == "in") {
                this.nextWord();
            } else {
                if (requireIn) { // wasn't there, just give up
                    this.rewind(hold);
                    return value;
                }
            } // do we have a value?
            value = this.getFloat();
            if (value !== false) { // yes
                // by default duration is in seconds
                value *= this.getTimeUnitMultiplier();
            }
        }
        return value;
    }

    getGroup(sceneName) {
        let groupSprite = null;
        let hold = this.index;
        if (this.testWord(["in","to"])) {
            if (this.getWord() != "group") {
                this.rewind(hold);
            } else {
                const groupName = this.getWord();
                // got a group, check it exists
                if (groupName) {
                    groupSprite = SGSprite.getSprite(sceneName, groupName, true);
                    if (groupSprite && groupSprite.type != constants.SPRITE_GROUP) {
                        Globals.log.error("Not a group at line " + action.number);
                    }
                }
            }
        }
        return groupSprite;
    }
            
            
}
