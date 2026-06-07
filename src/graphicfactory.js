
import { WordList } from "./wordlist.js";
import { Globals } from "./globals.js";

export class GraphicFactory {
    constructor() {
        this.fill = "black";
        this.fillAlpha = 1;
        this.stroke = "black";
        this.strokeWidth = 1;
        this.strokeAlpha = 1;
    }

    create(wordList) {
        const graphicCommand = wordList.getWord();
        let graphic = null;
        let graphicName = "";
        switch (graphicCommand) {
            case"create":
                {
                    graphicName = wordList.getWord();
                    wordList.testWord("as");
                    const graphicType = wordList.getWord();
                    graphic = null;
                    switch (graphicType) {
                        case "rectangle":
                        case "rect": 
                            {
                                const w = wordList.getInt(0);
                                const h = wordList.getInt(w);
                                const r = wordList.getInt(0);
                                if (w > 0 && h > 0) {
                                    if (r > 0) {
                                        graphic = new PIXI.Graphics().roundRect(w/-2, h/-2, w, h, r);
                                    } else {
                                        graphic = new PIXI.Graphics().rect(w/-2, h/-2, w, h);
                                    }
                                }
                            }
                            break;
                        case "circle":
                            {
                                const r = wordList.getInt(0);
                                if (r > 0) {
                                    graphic = new PIXI.Graphics().circle(0, 0, r);
                                }
                            }
                            break;
                        case "polygon":
                            {
                                const s = wordList.getInt(0);
                                const r = wordList.getInt(0);
                                if (s > 2 && r > 0) {
                                    graphic = new PIXI.Graphics().regularPoly(0, 0, r, s);
                                }
                            }
                            break;
                        case "polyline":
                            {
                                const coords = [];
                                let minX = Number.MAX_SAFE_INTEGER;
                                let maxX = Number.MIN_SAFE_INTEGER;
                                let minY = Number.MAX_SAFE_INTEGER;
                                let maxY = Number.MIN_SAFE_INTEGER;
                                let XorY = "X";
                                while (wordList.wordsLeft()) {
                                    const value = wordList.getFloat();
                                    coords.push(value);
                                    if (XorY == "X") {
                                        maxX = Math.max(maxX, value);
                                        minX = Math.min(minX, value);
                                        XorY = "Y";
                                    } else {
                                        maxY = Math.max(maxY, value);
                                        minY = Math.min(minY, value);
                                        XorY = "X";
                                    }
                                }
                                if (XorY != "X") {
                                    Globals.log.error("Uneven coordinates for polyline");
                                    coords.pop();
                                }
                                // Rewrite coordinates to draw around the origin
                                const xAdj = (maxX - minX) / 2;
                                const yAdj = (maxY - minY) / 2;
                                for (let i = 0; i < coords.length; i += 2) {
                                    coords[i] -= xAdj;
                                    coords[i+1] -= yAdj;
                                }
                                graphic = new PIXI.Graphics().poly(coords, true);
                            }
                            break;
                        case "line":
                            {
                                const r = wordList.getInt(0);
                                if (r > 0) {
                                    graphic = new PIXI.Graphics().moveTo(l / -2, 0).lineTo(l/2, 0);
                                }
                            }
                            break;                               
                        case "ellipse":
                            {
                                const w = wordList.getInt(0);
                                const h = wordList.getInt(w);
                                if (w > 0 && h > 0) {
                                    graphic = new PIXI.Graphics().ellipse(0, 0, w, h);
                                }
                            }
                            break;
                        case "bubble":
                        case "speech":
                            {
                                const w = wordList.getInt(0);
                                const h = wordList.getInt(w);
                                let r = wordList.getInt(w/10);
                                const pointers = wordList.getPointers();
                                // half sizes
                                const hw = w / 2;
                                const hh = h / 2;
                                // segment lengths
                                const sh = (h - (3 * r)) / 2;
                                const sw = (w - (3 * r)) / 2;
                                // Prevent impossible radii
                                r = Math.min(r, hw, hh);
                                graphic = new PIXI.Graphics();
                                graphic.moveTo(-hw + r, -hh); // to right of top left corner
                                graphic.lineTo(-hw + r + sw, -hh); // top left segment
                                if (pointers.includes("top")) { // optional top pointer
                                    graphic.quadraticCurveTo(0, -hh, 0, -hh -r, 0.5);
                                    graphic.quadraticCurveTo(0, -hh, r / 2, -hh, 0.5);
                                }
                                graphic.lineTo(hw - r, -hh); // top right segment
                                if (pointers.includes("topright")) { // optional corner pointer
                                    graphic.quadraticCurveTo(hw, -hh, hw + r, -hh - r, 0.5);
                                    graphic.quadraticCurveTo(hw, -hh, hw, -hh + r, 0.5);
                                } else {
                                    graphic.arcTo(hw, -hh, hw, -hh + r, r); // plain corner
                                }
                                graphic.lineTo(hw, r / -2, hw); // right top segment
                                if (pointers.includes("right")) { // optional right pointer
                                    graphic.quadraticCurveTo(hw, 0, hw + r, 0, 0.5);
                                    graphic.quadraticCurveTo(hw, 0, hw, r / 2, 0.5);
                                }
                                graphic.lineTo(hw, hh - r); // right bottom segment
                                if (pointers.includes("bottomright")) { // optional corner pointer
                                    graphic.quadraticCurveTo(hw, hh, hw + r, hh + r, 0.5);
                                    graphic.quadraticCurveTo(hw, hh, hw - r, hh, 0.5);
                                } else {
                                    graphic.arcTo(hw, hh, hw - r, hh, r); // plain corner
                                }
                                graphic.lineTo(r / 2, hh); // bottom right segment
                                if (pointers.includes("bottom")) { // optional bottom pointer
                                    graphic.quadraticCurveTo(0, hh, 0, hh + r, 0.5);
                                    graphic.quadraticCurveTo(0, hh, r / -2, hh, 0.5);
                                }
                                graphic.lineTo(-hw + r, hh); 
                                if (pointers.includes("bottomleft")) { // optional corner pointer
                                    graphic.quadraticCurveTo(-hw, hh, -hw - r, hh + r, 0.5);
                                    graphic.quadraticCurveTo(-hw, hh, -hw, hh - r, 0.5);
                                } else {
                                    graphic.arcTo(-hw, hh, -hw, hh - r, r); // plain corner
                                }
                                graphic.lineTo(-hw, r / 2); // left bottom segment
                                if (pointers.includes("left")) { // optional left pointer
                                    graphic.quadraticCurveTo(-hw, 0, -hw - r, 0, 0.5);
                                    graphic.quadraticCurveTo(-hw, 0, -hw, r / -2, 0.5);
                                }
                                graphic.lineTo(-hw, -hh + r);
                                if (pointers.includes("topleft")) { // optional corner pointer
                                    graphic.quadraticCurveTo(-hw, -hh, -hw - r, -hh - r, 0.5);
                                    graphic.quadraticCurveTo(-hw, -hh, -hw + r, -hh, 0.5);
                                } else {
                                    graphic.arcTo(-hw, -hh, -hw + r, -hh, r); // plain corner
                                }
                                graphic.closePath();
                            }
                        case "star":
                            {
                                const p = wordList.getInt(0);
                                const ro = wordList.getInt(0);
                                let ri = wordList.getInt(0);
                                if (ri > ro) {
                                    ri = 0;
                                }
                                if (p > 2 && ro > 0) {
                                    if (ri > 0) {
                                        graphic = new PIXI.Graphics().star(0, 0, p, ro, ri);
                                    } else {
                                        graphic = new PIXI.Graphics().star(0, 0, p, ro);
                                    }
                                }
                            }
                            break;
                        case "grid":
                            {
                                const x = wordList.getInt(100);
                                const y = wordList.getInt( x);
                                graphic = new PIXI.Graphics();
                                const width = Globals.app.screen.width;
                                const height = Globals.app.screen.height;
                                if (x > 10 && y > 10) {
                                    for ( let i = (width / -2 ) + x; i < width / 2; i += x ) {
                                        graphic.moveTo(i,height / -2).lineTo(i,height / 2);
                                    }
                                    for ( let j = (height / -2) + y; j < height / 2; j += y) {
                                        graphic.moveTo(width / -2,j).lineTo(width / 2,j);
                                    }
                                }
                            }
                            break;
                        default:
                            Globals.log.error("Unknown graphic type at ");
                            break;
                        }
                        if (graphic != null) {
                            graphic.fill({color: this.fill, alpha: this.fillAlpha}).stroke({width: this.strokeWidth, color: this.stroke, alpha: this.strokeAlpha});
                        } else {
                            Globals.log.error("Invalid graphic arguments");
                        }
                        break;
                    }
            case "color":
            case "colour":
                this.fill = wordList.getWord("black");
                this.stroke = this.fill;
                const alpha = wordList.getWord();
                if (alpha) {
                    this.fillAlpha = alpha;
                }
                break;
            case "fill":
                const fill = wordList.getWord("black");
                if (fill == "none") {
                    this.fillAlpha = 0;
                } else {
                    this.fill = fill;
                    const alpha = wordList.getWord();
                    if (alpha) {
                        this.fillAlpha = alpha;
                    } else if (this.fillAlpha == 0) {
                        this.fillAlpha = 1;
                    }
                }
                break;
            case "stroke":
                if (wordList.testWord("width")) {
                    this.strokeWidth = wordList.getInt(1);
                } else {
                    const stroke = wordList.getWord("black");
                    if (stroke == "none") {
                        this.strokeWidth = 0;
                    } else {
                        this.stroke = stroke;
                        const alpha = wordList.getWord();
                        if (alpha) {
                            this.strokeAlpha = alpha;
                        } else if (this.strokeAlpha == 0) {
                            this.strokeAlpha = 1;
                        }
                    }
                    break;
                }
                break;
            default:
                Globals.log.error("Unknown graphic command at " + action.number);
                break;
        }
        return {graphicName, graphic};
    }
}