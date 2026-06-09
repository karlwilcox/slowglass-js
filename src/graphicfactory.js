
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
        const size = wordList.getInt(100);
        let svgContent = false;
        let graphic = false;
        let svgX = 24; // overwrite following if different
        let svgY = 24;
        let credit = "Icons from Fluent UI Icons Filled Collection svgrepo.com";
        switch (iconName) {
            case "playpause":
                svgContent = `<path fill="${this.fill}" d="M3.65140982,6.61646219
                L11.1528787,11.3693959 C11.3672679,11.5052331
                11.4827597,11.722675 11.4993749,11.9464385 L11.4984593,7.25
                C11.4984593,6.83578644 11.8342458,6.5 12.2484593,6.5
                L15.2484593,6.5 C15.6626729,6.5 15.9984593,6.83578644
                15.9984593,7.25 L15.9984593,16.75 C15.9984593,17.1642136
                15.6626729,17.5 15.2484593,17.5 L12.2484593,17.5
                C11.8342458,17.5 11.4984593,17.1642136 11.4984593,16.75
                L11.4993494,12.0597632 C11.4826318,12.2835468
                11.3670166,12.5009613 11.1525249,12.6366956
                L3.65105604,17.3837618 C3.15168144,17.6997752 2.5,17.3409648
                2.5,16.75 L2.5,7.25 C2.5,6.65884683 3.15205264,6.30006928
                3.65140982,6.61646219 Z M21.2477085,6.50037474
                C21.661922,6.50037474 21.9977085,6.83616118
                21.9977085,7.25037474 L21.9977085,16.7496253
                C21.9977085,17.1638388 21.661922,17.4996253
                21.2477085,17.4996253 L18.2477085,17.4996253
                C17.8334949,17.4996253 17.4977085,17.1638388
                17.4977085,16.7496253 L17.4977085,7.25037474
                C17.4977085,6.83616118 17.8334949,6.50037474
                18.2477085,6.50037474 L21.2477085,6.50037474 Z">`;
                break;
            case "soundon":
                svgX = 28;
                svgY = 28;
                svgContent = `<path fill="${this.fill}" 
                d="M14.395 3.90244C15.1932 3.15384 16.5 3.71986 16.5
                4.81425V23.1843C16.5 24.2785 15.1937 24.8446 14.3953
                24.0964L9.45832 19.4703C9.134 19.1664 8.70619 18.9973 8.26174
                18.9973H5.25C3.45507 18.9973 2 17.5422 2 15.7473V12.2553C2
                10.4604 3.45508 9.00529 5.25 9.00529H8.26119C8.70587 9.00529
                9.13388 8.836 9.45826 8.53182L14.395 3.90244Z"/>
                <path fill="${this.fill}" 
                d="M21.6436 5.18437C21.9546 4.91079 22.4285 4.94114 22.702
                5.25215C24.7544 7.58537 26 10.6481 26 13.9999C26 17.3517
                24.7544 20.4145 22.702 22.7477C22.4285 23.0587 21.9546 23.089
                21.6436 22.8155C21.3325 22.5419 21.3022 22.068 21.5758
                21.757C23.3966 19.687 24.5 16.9733 24.5 13.9999C24.5 11.0266
                23.3966 8.31278 21.5758 6.24286C21.3022 5.93185 21.3325 5.45795
                21.6436 5.18437Z" />
                <path fill="${this.fill}" d="M20.3528 8.3028C20.1042 7.9715
                19.6341 7.90448 19.3028 8.1531C18.9715 8.40173 18.9044 8.87185
                19.1531 9.20315C20.156 10.5397 20.75 12.1993 20.75
                13.9999C20.75 15.8005 20.156 17.4602 19.1531 18.7967C18.9044
                19.128 18.9715 19.5981 19.3028 19.8467C19.6341 20.0954 20.1042
                20.0283 20.3528 19.697C21.544 18.1098 22.25 16.1362 22.25
                13.9999C22.25 11.8636 21.544 9.89006 20.3528 8.3028Z"/>`;
                break;
            case "soundoff":
                svgX = 28;
                svgY = 28;
                svgContent = `
                <path d="M16.5 4.81425C16.5 3.71986 15.1932 3.15384 14.395 3.90244L9.45826
                8.53182C9.13388 8.836 8.70587 9.00529 8.26119 9.00529H5.25C3.45508 9.00529 2
                10.4604 2 12.2553V15.7473C2 17.5422 3.45507 18.9973 5.25
                18.9973H8.26174C8.70619 18.9973 9.134 19.1664 9.45832 19.4703L14.3953
                24.0964C15.1937 24.8446 16.5 24.2785 16.5 23.1843V4.81425Z" fill="${this.fill}"/>
                <path d="M19.7824 10.7216C19.4905 10.4277 19.0157 10.4259 18.7217
                10.7177C18.4277 11.0095 18.426 11.4844 18.7178 11.7784L20.9359 14.0128L18.7208
                16.2186C18.4273 16.5108 18.4263 16.9857 18.7186 17.2792C19.0108 17.5727 19.4857
                17.5737 19.7792 17.2814L21.9965 15.0735L24.2217 17.2823C24.5157 17.5741 24.9906
                17.5723 25.2824 17.2784C25.5742 16.9844 25.5724 16.5095 25.2784 16.2177L23.0572
                14.0128L25.2815 11.7792C25.5738 11.4857 25.5728 11.0109 25.2793 10.7186C24.9858
                10.4263 24.5109 10.4273 24.2186 10.7208L21.9965 12.9521L19.7824 10.7216Z"
                fill="${this.fill}"/>`;
                break;
            case "stop":
                svgContent = `
                <path d="M4.75 3C3.7835 3 3 3.7835 3 4.75V19.25C3 20.2165 3.7835 21 4.75
                21H19.25C20.2165 21 21 20.2165 21 19.25V4.75C21 3.7835 20.2165 3 19.25 3H4.75Z"
                fill="${this.fill}"/>`;
                break;
            case "fastforward":
            case "forward":
                svgContent = `
                <path d="M12.7104555,4.15798491 L21.7104555,11.1579849 C22.0965349,11.458269
                22.096511,12.0417988 21.7104068,12.3420511 L12.70888,19.3420511
                C12.2161976,19.7251835 11.4984732,19.3740377 11.4984732,18.7499173
                L11.4984732,13.6726109 L4.20887999,19.3420511 C3.71619763,19.7251835
                2.9984732,19.3740377 2.9984732,18.7499173 L3,4.74991728 C3.00006806,4.12584403
                3.71784185,3.774841 4.21045546,4.15798491 L11.4984732,9.82661094
                L11.5,4.74991728 C11.5000681,4.12584403 12.2178419,3.774841
                12.7104555,4.15798491 Z" fill="${this.fill}" />`;
                break;
            case "next":
                svgContent = `
                <path d="M21 4C21 3.44772 20.5523 3 20 3C19.4477 3 19 3.44772 19 4V20C19
                20.5523 19.4477 21 20 21C20.5523 21 21 20.5523 21 20V4Z" fill="${this.fill}"/> <path
                d="M3 4.94743C3 3.5226 4.61175 2.69498 5.7697 3.52521L16.2394 11.0318C17.2443
                11.7523 17.2053 13.2593 16.1646 13.927L5.69492 20.6434C4.53019 21.3905 3
                20.5542 3 19.1704V4.94743Z" fill="${this.fill}"/>`;
                break;
            case "previous":
            case "prev":
                svgContent = `
                <path d="M2.75 20C2.75 20.5523 3.19772 21 3.75 21C4.30228 21 4.75 20.5523 4.75
                20L4.75 4C4.75 3.44772 4.30229 3 3.75 3C3.19772 3 2.75 3.44772 2.75 4V20Z"
                fill="${this.fill}"/> <path d="M20.75 19.0526C20.75 20.4774 19.1383 21.305 17.9803
                20.4748L7.51062 12.9682C6.50574 12.2477 6.54467 10.7407 7.5854 10.073L18.0551
                3.35665C19.2198 2.60946 20.75 3.44583 20.75 4.82961L20.75 19.0526Z"
                fill="${this.fill}"/> </svg>`;
                break;
            case "rewind":
                svgContent = `
                <path d="M21.0015268,4.75008179 L21,18.7500818
                C20.9999319,19.374155 20.2821581,19.7251581 19.7895445,19.3420142
                L12.5,13.6726109 L12.5,18.7500818 C12.4999319,19.374155
                11.7821581,19.7251581 11.2895445,19.3420142 L2.28954454,12.3420142
                C1.90346505,12.0417301 1.90348904,11.4582003 2.28959321,11.157948
                L11.29112,4.15794799 C11.7838024,3.77481559 12.5015268,4.12596134
                12.5015268,4.75008179 L12.5,9.82661094 L19.79112,4.15794799
                C20.2838024,3.77481559 21.0015268,4.12596134 21.0015268,4.75008179
                Z" <path d="M21.0015268,4.75008179 L21,18.7500818
                C20.9999319,19.374155 20.2821581,19.7251581 19.7895445,19.3420142
                L12.5,13.6726109 L12.5,18.7500818 C12.4999319,19.374155
                11.7821581,19.7251581 11.2895445,19.3420142 L2.28954454,12.3420142
                C1.90346505,12.0417301 1.90348904,11.4582003 2.28959321,11.157948
                L11.29112,4.15794799 C11.7838024,3.77481559 12.5015268,4.12596134
                12.5015268,4.75008179 L12.5,9.82661094 L19.79112,4.15794799
                C20.2838024,3.77481559 21.0015268,4.12596134 21.0015268,4.75008179
                Z" fill="${this.fill}"/>`;
                break;
            default:
                Globals.log.error("Unknown icon type " + iconName);
                break;
        }
        if (svgContent) {
            Globals.log.report(credit);
            const shiftX = svgX / -2;
            const shiftY = svgY / -2;
            graphic = new PIXI.Graphics().translateTransform(shiftX,shiftY).svg('<svg>' + svgContent + "</svg>");
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