
import { WordList } from "./wordlist.js";
import { Globals } from "./globals.js";

export class TextFactory {
    constructor() {
        this.textFill = "black";
        this.textStroke = "black";
        this.textFont = "Arial";
        this.textSize = "24";
        this.textAlign = "centre";
        this.textWrap = 0;
    }

    wrapText(text) {
        if (this.textWrap <= 0) {
            return(text);
        }
        const words = text.split(/\s+/);
        let lines = [];
        let current = "";
        for (const word of words) {
            if (current.length === 0) {
                current = word;
            } else if (current.length + 1 + word.length <= this.textWrap) {
                current += " " + word;
            } else {
                lines.push(current);
                current = word;
            }
        }
        if (current.length > 0) {
            lines.push(current);
        }
        return lines.join("\n");
    }

    create(wordList) {
        let textName = "";
        let textImage = null;
        const textCommand = wordList.getWord();
        switch(textCommand) {
            case "font":
            case "fontfamily":
                this.textFont = wordList.joinWords();
                break;
            case "fontsize":
            case "size":
                this.textFont = wordList.joinWords();
                break;
            case "align":
                this.textAlign = wordList.joinWords();
                if (this.textAlign == "centre") {
                    this.textAlign = "center";
                }
                break;
            case "color":
            case "colour":
                this.textFill = wordList.joinWords();
                this.textStroke = this.textFill;
                break;
            case "fill":
                this.textFill = wordList.joinWords();
                break;
            case "stroke":
                this.textStroke = wordList.joinWords();
                break;
            case "wrap":
                this.textWrap = wordList.getInt(0);
                break;
            case "create":
                {
                    textName = wordList.getWord();
                    wordList.testWord("as");
                    const text = wordList.joinWords();
                    textImage = new PIXI.Text(this.wrapText(text), {
                        fontFamily: this.textFont,
                        fontSize: this.textSize,
                        fill: this.textFill,
                        stroke: this.textStroke,
                        align: this.textAlign,
                    });
                    break;
                }
            default:
                break;
        }
        return {textName, textImage};
    }
}
