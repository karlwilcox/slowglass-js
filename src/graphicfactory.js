
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

    makeIcon(wordList) {
        const iconName = wordList.getWord()
        wordList.testWord("size");
        const size = wordList.getInt(100);
        let svgContent = false;
        let graphic = false;
        let svgX = 24; // overwrite following if different
        let svgY = 24;
        let credit = "Icons from Fluent UI Icons Filled Collection svgrepo.com";
        switch (iconName) {
            case "playpause":
                svgContent = `<path
       fill="${this.fill}"
       d="m -8.34859,-5.38354 7.50149,4.75294 c 0.2144,0.13583 0.3299,0.35328 0.3465,0.57704 L -0.5015,-4.75 c 0,-0.41421 0.3357,-0.75 0.75,-0.75 h 3 c 0.4142,0 0.75,0.33579 0.75,0.75 v 9.5 c 0,0.4142 -0.3358,0.75 -0.75,0.75 h -3 c -0.4143,0 -0.75,-0.3358 -0.75,-0.75 l 8e-4,-4.6902 C -0.5177,0.2835 -0.633,0.501 -0.8475,0.6367 L -8.34894,5.3838 C -8.84832,5.6998 -9.5,5.341 -9.5,4.75 v -9.5 c 0,-0.59115 0.65205,-0.94993 1.15141,-0.63354 z M 9.2477,-5.49963 c 0.4142,0 0.75,0.33579 0.75,0.75 V 4.7496 c 0,0.4142 -0.3358,0.75 -0.75,0.75 h -3 c -0.4142,0 -0.75,-0.3358 -0.75,-0.75 v -9.49923 c 0,-0.41421 0.3358,-0.75 0.75,-0.75 z"
        />`;
                break;
            case "soundon":
                svgX = 28;
                svgY = 28;
                svgContent = `<path
       fill="${this.fill}"
       d="M 0.395,-10.0976 C 1.1932,-10.8462 2.5,-10.2801 2.5,-9.18575 V 9.1843 c 0,1.0942 -1.3063,1.6603 -2.1047,0.9121 L -4.54168,5.4703 C -4.866,5.1664 -5.29381,4.9973 -5.73826,4.9973 H -8.75 c -1.7949,0 -3.25,-1.4551 -3.25,-3.25 v -3.492 c 0,-1.7949 1.4551,-3.25001 3.25,-3.25001 h 3.01119 c 0.44468,0 0.87269,-0.16929 1.19707,-0.47347 z"
        />
    <path
       fill="${this.fill}"
       d="M 7.6436,-8.81563 C 7.9546,-9.08921 8.4285,-9.05886 8.702,-8.74783 10.7544,-6.41463 12,-3.3519 12,-1e-4 12,3.3517 10.7544,6.4145 8.702,8.7477 8.4285,9.0587 7.9546,9.089 7.6436,8.8157 7.3325,8.5419 7.3022,8.068 7.5756,7.757 9.3964,5.687 10.4998,2.9733 10.4998,-1e-4 c 0,-2.9733 -1.1034,-5.68712 -2.9242,-7.75704 -0.2736,-0.31101 -0.2433,-0.78491 0.068,-1.05849 z"
        />
    <path
       fill="${this.fill}"
       d="M 6.3528,-5.6972 C 6.1042,-6.0285 5.6341,-6.09552 5.3028,-5.8469 4.9715,-5.59827 4.9044,-5.12815 5.1531,-4.79685 6.156,-3.4603 6.75,-1.8007 6.75,-1e-4 6.75,1.8005 6.156,3.4602 5.1531,4.7967 4.9044,5.128 4.9715,5.5981 5.3028,5.8467 5.6341,6.0954 6.1042,6.0283 6.3528,5.697 7.544,4.1098 8.25,2.1362 8.25,-1e-4 8.25,-2.1364 7.544,-4.10994 6.3528,-5.6972 Z"
        />`;
                break;
            case "soundoff":
                svgX = 28;
                svgY = 28;
                svgContent = `<path
			       d="m 2.5,-9.18575 c 0,-1.09435 -1.3068,-1.66045 -2.105,-0.91185 l -4.93674,4.62942 c -0.32438,0.30418 -0.75239,0.47347 -1.19707,0.47347 H -8.75 c -1.7949,0 -3.25,1.45511 -3.25,3.25001 v 3.492 c 0,1.7949 1.4551,3.25 3.25,3.25 h 3.01174 c 0.44445,0 0.87226,0.1691 1.19658,0.473 L 0.3953,10.0964 C 1.1937,10.8446 2.5,10.2785 2.5,9.1843 Z"
			       fill="${this.fill}"
			        />
			    <path
			       d="m 5.7824,-3.2784 c -0.2919,-0.2939 -0.7667,-0.2957 -1.0607,-0.004 -0.294,0.2918 -0.2957,0.7667 0,1.0607 L 6.9398,0.0127 4.7247,2.2185 c -0.2935,0.2922 -0.2945,0.7671 0,1.0606 0.2922,0.2935 0.7671,0.2945 1.0606,0 L 8.0026,1.0712 10.2278,3.28 c 0.294,0.2918 0.7689,0.29 1.0607,0 0.2918,-0.294 0.29,-0.7689 0,-1.0607 L 9.0673,0.0144 11.2916,-2.2192 c 0.2923,-0.2935 0.2913,-0.7683 0,-1.0606 -0.2935,-0.2923 -0.7684,-0.2913 -1.0607,0.002 l -2.2221,2.2313 z"
			       fill="${this.fill}"
			        />`;
                break;
            case "stop":
                svgContent = `<path
			       d="M -7.25,-9 C -8.2165,-9 -9,-8.2165 -9,-7.25 V 7.25 C -9,8.2165 -8.2165,9 -7.25,9 H 7.25 C 8.2165,9 9,8.2165 9,7.25 V -7.25 C 9,-8.2165 8.2165,-9 7.25,-9 Z"
			       fill="${this.fill}"
			        />
                `;
                break;
            case "fastforward":
            case "forward":
                svgContent = `<path
			       d="m 0.7105,-7.84202 9,7 c 0.386,0.30029 0.386,0.88382 -10e-5,1.18412 l -9.0015,7 C 0.2162,7.7252 -0.5015,7.3741 -0.5015,6.7499 V 1.6726 L -7.79112,7.3421 C -8.2838,7.7252 -9.00153,7.374 -9.00153,6.7499 L -9,-7.25008 c 7e-5,-0.62408 0.71784,-0.97508 1.21046,-0.59194 l 7.28804,5.66863 v -5.07669 c 10e-5,-0.62408 0.7178,-0.97508 1.2105,-0.59194 z"
			       fill="${this.fill}"
			        />`;
                break;
            case "next":
                svgContent = `
			    <path
			       d="M 9,-8 C 9,-8.55228 8.5523,-9 8,-9 7.4477,-9 7,-8.55228 7,-8 V 8 C 7,8.5523 7.4477,9 8,9 8.5523,9 9,8.5523 9,8 Z"
			       fill="${this.fill}"
			        />
			    <path
			       d="m -9,-7.05257 c 0,-1.42483 1.61175,-2.25245 2.7697,-1.42222 L 4.2394,-0.9682 C 5.2443,-0.2477 5.2053,1.2593 4.1644,1.927 L -6.30508,8.6434 C -7.46981,9.3905 -9,8.5542 -9,7.1704 Z"
			       fill="${this.fill}"
			        />`;
                break;
            case "previous":
            case "prev":
                svgContent = `
			    <path
			       d="m -9.25,8 c 0,0.5523 0.44772,1 1,1 0.55228,0 1,-0.4477 1,-1 V -8 c 0,-0.55228 -0.44771,-1 -1,-1 -0.55228,0 -1,0.44772 -1,1 z"
			       fill="${this.fill}"
			        />
			    <path
			       d="M 8.75,7.0526 C 8.75,8.4774 7.1383,9.305 5.9803,8.4748 L -4.48938,0.9682 C -5.49426,0.2477 -5.45533,-1.2593 -4.4146,-1.927 L 6.0551,-8.64335 C 7.2198,-9.39054 8.75,-8.55415 8.75,-7.17039 Z"
			       fill="${this.fill}"
			        />`;
                break;
            case "rewind":
                svgContent = `<path
			       d="M 9.0015,-7.24992 9,6.7501 C 8.9999,7.3742 8.2822,7.7252 7.7895,7.342 L 0.5,1.6726 V 6.7501 C 0.4999,7.3742 -0.2178,7.7252 -0.7105,7.342 l -8.99996,-7 c -0.38604,-0.3003 -0.38604,-0.8838 5e-5,-1.18405 l 9.00151,-7 c 0.4927,-0.38313 1.2104,-0.032 1.2104,0.59213 v 5.07653 l 7.2911,-5.66866 c 0.4927,-0.38313 1.2104,-0.032 1.2104,0.59213 z"
			       fill="${this.fill}"
			        />
			    <path
			       d="M 9.0015,-7.24992 9,6.7501 C 8.9999,7.3742 8.2822,7.7252 7.7895,7.342 L 0.5,1.6726 V 6.7501 C 0.4999,7.3742 -0.2178,7.7252 -0.7105,7.342 l -8.99996,-7 c -0.38604,-0.3003 -0.38604,-0.8838 5e-5,-1.18405 l 9.00151,-7 c 0.4927,-0.38313 1.2104,-0.032 1.2104,0.59213 v 5.07653 l 7.2911,-5.66866 c 0.4927,-0.38313 1.2104,-0.032 1.2104,0.59213 z"
			       fill="${this.fill}"
			        />`;
                break;
            default:
                Globals.log.error("Unknown icon type " + iconName);
                break;
        }
        if (svgContent) {
            Globals.log.report(credit);
            graphic = new PIXI.Graphics().scaleTransform(size/svgX).svg('<svg>' + svgContent + "</svg>");
        }
        return graphic;
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
                                    if (!value) {
                                        Globals.log.error("Expected coordinate for polyline");
                                        wordList.getWord(); // eat the offender
                                        break;
                                    }
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
                                const xAdj = (maxX + minX) / 2;
                                const yAdj = (maxY + minY) / 2;
                                for (let i = 0; i < coords.length; i += 2) {
                                    coords[i] -= xAdj;
                                    coords[i+1] -= yAdj;
                                }
                                graphic = new PIXI.Graphics().poly(coords, true);
                            }
                            break;
                        case "line":
                            {
                                const l = wordList.getInt(0);
                                if (l > 0) {
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
                            break;
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
                        case "icon":
                            graphic = this.makeIcon(wordList);
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
                Globals.log.error("Unknown graphic command " + graphicCommand);
                break;
        }
        return {graphicName, graphic};
    }
}