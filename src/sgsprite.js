
import { Adjustable } from "./adjustable.js";
import defaults from "./defaults.js";
import { Globals } from "./globals.js";
import * as constants from './constants.js';
import { TagList } from "./vars.js";

/**************************************************************************************************

    ######   ######   #### ##     ##    ###     ######   ######## 
   ##    ## ##    ##   ##  ###   ###   ## ##   ##    ##  ##       
   ##       ##         ##  #### ####  ##   ##  ##        ##       
    ######  ##   ####  ##  ## ### ## ##     ## ##   #### ######   
         ## ##    ##   ##  ##     ## ######### ##    ##  ##       
   ##    ## ##    ##   ##  ##     ## ##     ## ##    ##  ##       
    ######   ######   #### ##     ## ##     ##  ######   ######## 

**************************************************************************************************/

export class SGImage {
    constructor(data, name) {
        this.name = name;
        this.width = 0;
        this.height = 0;
        this.tags = new TagList();
        if (typeof data === "string") {
            this.piImage = null;
            this.loading = true;
            this.url = data;
        } else { // must be text - careful if new types added!
            this.piImage = data;
            this.loading = false;
            this.url = null;
        }
    }

    async load_image() {
        this.piImage = await PIXI.Assets.load(this.url);
        this.loading = false;
        this.width = this.piImage.width;
        this.height = this.piImage.height;
    }

    static getImage(scene, name) {
        let parts = name.split(":");
        if (parts.length > 1) {
            scene = parts[0];
            name = parts[1];
        }
        for ( let i = 0; i < Globals.scenes.length; i++ ) {
            if (Globals.scenes[i].name == scene) {
                for ( let j = 0; j < Globals.scenes[i].images.length; j++ ) {
                    if (Globals.scenes[i].images[j].name == name) {
                        if (Globals.scenes[i].images[j].loading) {
                            return("loading");
                        } else {
                            return(Globals.scenes[i].images[j]);
                        }
                    }
                }
            }
        }
        Globals.log.error("No image found- " + scene + ":" + name);
        return(null);
    }
}

/**************************************************************************************************
 #####   #####           #####                               
#     # #     #         #     # #####  #####  # ##### ###### 
#       #               #       #    # #    # #   #   #      
 #####  #  ####          #####  #    # #    # #   #   #####  
      # #     #               # #####  #####  #   #   #      
#     # #     #         #     # #      #   #  #   #   #      
 #####   #####           #####  #      #    # #   #   ###### 
                #######                                      
**************************************************************************************************/

export class SGSprite {
    constructor(imageName, spriteName = imageName, type = constants.SPRITE_IMAGE, tags = []) {
        // We duplicated a lot of sprite properties so that we can manipulate independently
        // of whether the PI sprite has been created yet (e.g. waiting for the image to
        // load) and also in case we want to switch to a different rendering engine at a
        // future date.
        // Identification
        this.type = type;
        this.imageName = imageName;
        this.name = spriteName
        this.tags = new TagList();
        this.tags.addTag(tags); // default tags
        this.sgParent = null;
        // created yet?
        this.piSprite = null;
        this.enabled = true;
        // location
        this.locX = new Adjustable(0);
        this.locY = new Adjustable(0);
        // rotation
        this.angle = new Adjustable(0,0,360);
        // depth
        this.depth = 0;
        // size
        this.sizeX = new Adjustable(0);
        this.sizeY = new Adjustable(0);
        // scale
        this.scaleX = new Adjustable(1);
        this.scaleY = new Adjustable(1);
        // flipping
        this.flipH = false;
        this.flipV = false;
        this.flipChange = false;
        // View window
        this.windowed = false;
        this.viewX = new Adjustable(0);
        this.viewY = new Adjustable(0);
        this.viewWidth = new Adjustable(0);
        this.viewHeight = new Adjustable(0);
        this.scrollX = 0;
        this.scrollY = 0;
        this.lastScrollX = 0;
        this.lastScrollY = 0;
        // rotation point
        this.pivotX = new Adjustable(50,0,100);
        this.pivotY = new Adjustable(50,0,100);
        // visibility
        this.visible = true;
        this.transparency = new Adjustable(100,0,100);
        this.tintValue = new Adjustable(0,0,100);
        this.tintColour = null;
        this.newTint = false;
        // usage
        this.role = null;
        // blinking
        this.next_blink = 0;
        this.blinkRate = 0;
        this.blinkChance = 0;
        // pulsing
        this.pulseRate = 0;
        this.pulseMin = 0;
        this.pulseMax = 0;
        this.pulseUp = true;
        // flashing
        this.flashCount = 0;
        this.nextFlash = 0;
        // thrown
        this.throwVx = 0;
        this.throwVy = 0; 
        this.throwTime = 0;
        this.falling = false;
        this.throwCallback = null;
        // bluriness
        this.bluriness = new Adjustable(0,0,100);
        this.blurFilter = null;
        // Text features
        this.textFont = 'arial';
        this.textSize = 24;
        this.textAlign = "center";
        this.fillColour = "black";
        this.strokeColour = "black";
        // skewiness
        this.skewX = new Adjustable(0);
        this.skewY = new Adjustable(0);
        // perspective warp corners, stored relative to the sprite position
        this.warped = false;
        this.warpCorners = [
            new Adjustable(0), new Adjustable(0),
            new Adjustable(0), new Adjustable(0),
            new Adjustable(0), new Adjustable(0),
            new Adjustable(0), new Adjustable(0)
        ];
        // debugging
        // this.logged = false;
    }

    setPosition(x, y, depth = 0) {
        this.locX.setTargetValue(x)
        this.locY.setTargetValue(y);
        this.setDepth("to", depth);
    }

    setDepth(depth_type, value="to") {
        if (depth_type == "by") {
            this.depth += value;
        } else {
            this.depth = value;
        }
        // We don't use depth values below 0
        if (this.depth < 1) {
            this.depth = 1;
        }
        if (this.enabled && this.piSprite != null) {
            this.piSprite.zIndex = this.depth;
        }
    }

    setSkew(newX, newY, to_or_by, duration, now, callback) {
         if (to_or_by == "by") {
            newX += this.skewX.value();
            newY += this.skewY.value();
        }       
        this.skewX.setTargetValue(newX, duration, now, callback);
        this.skewY.setTargetValue(newY, duration, now);
    }

    setStyle() {
        if (this.imageName == defaults.TEXT_NAME) {
            this.piSprite.style = {
                fontFamily: this.textFont,
                fontSize: this.textFont,
                fill: this.fillColour,
                stroke: this.strokeColour,
                align: this.textAlign
            };
        }
    }

    move(newX, newY, to_or_by, in_or_at, duration, now, callback) {
        if (to_or_by == "by") {
            if (newX === false) {
                newX = 0;
            }
            if (newY === false) {
                newY = 0;
            }
            newX += this.locX.value();
            newY += this.locY.value();
        } else { // to
            if (newX === false) {
                newX = this.locX.value();
            }
            if (newY === false) {
                newY = this.locY.value();
            }
        }
        if (in_or_at == "at") {
            // to be done...
        }
        this.locX.setTargetValue(newX, duration, now, callback);
        this.locY.setTargetValue(newY, duration, now); // only need one callback
        this.enabled = true;
    }

    setView(x, y, w, h, dur_type, duration, now, callback) {
        if (dur_type == "stop") {
            this.windowed = false;
            this.viewX.forceValue(this.viewX.value());
            this.viewY.forceValue(this.viewY.value());
            this.viewWidth.forceValue(this.viewWidth.value());
            this.viewHeight.forceValue(this.viewHeight.value());
        } else {
            this.windowed = true;
            this.viewX.setTargetValue(x, duration, now, callback);
            this.viewY.setTargetValue(y, duration, now);
            this.viewWidth.setTargetValue(w, duration, now);
            this.viewHeight.setTargetValue(h, duration, now);
        }
    }

    setScroll(dx, dy) {
        this.scrollX = dx;
        this.scrollY = dy;
    }

    rotate(turn_type, value, dur_type, duration, now, callback) {
        let newValue = 0;
        if (turn_type == "to") {
            newValue = value;
        } else if (turn_type == "by") {
            newValue = this.angle.value() + value;
        } // add "at"
        if (dur_type == "in") {
            this.angle.setTargetValue(newValue, duration, now, callback);
        } else {
            this.angle.setTargetValue(newValue, 0);
        }
    }

    pivotPoint(pivotX, pivotY, duration, now, callback) {
        this.pivotX.setTargetValue(pivotX, duration, now, callback);
        this.pivotY.setTargetValue(pivotY, duration, now); // only need one callback
    }

    setTransparency(target, duration, fade_type, now, callback) {
        switch (fade_type) {
            case "by":
            case "down":
                target = this.transparency.value() - target;
                break;
            case "up":
                target = this.transparency.value() + target;
                break;
            // "to" no action needed
            default:
                break;
        }
        this.transparency.setTargetValue(target, duration, now, callback);
    }

    setBlur(target, duration, blur_type, now, callback) {
        switch (blur_type) {
            case "by":
            case "down":
                target = this.bluriness.value() - target;
                break;
            case "up":
                target = this.bluriness.value() + target;
                break;
            // "to" no action needed
            default:
                break;
        }
        if (target > 0) {
            if (this.blurFilter == null) {
                this.blurFilter = new PIXI.BlurFilter();
            }
        } else {
            this.blurFilter = null;
        }
        this.bluriness.setTargetValue(target, duration, now, callback);
    }

    setTint(target, duration, now, callback) {
        if (arguments.length == 1) {
            if (target == "stop") {
                this.tintColour = null;
                this.tintValue.setTargetValue(100, 0, now, callback);
            } else {
                this.tintColour = target;
            }
            this.newTint = true;
        } else {
            this.tintValue.setTargetValue(target, duration, now, callback);
        }
    }

    flip(axis) {
        if (axis == "h") {
            this.flipH = !this.flipH;
        } else if (axis == "v") {
            this.flipV = !this.flipV;
        } else if (axis == "r") { // reset
            this.flipV = false;
            this.flipH = false;
        }
        this.flipChange = true;
    }

    currentTint() {
        const shade = Math.round(255 * (100 - this.tintValue.value()) / 100);
        return (shade << 16) | (shade << 8) | shade;
    }

    flash(flashCount, now) {
        this.flashCount = flashCount;
        this.nextFlash = now + 100; // 1/10th of second
    }

    jiggle(x, y, rot, chance) {
        if (chance > 0 ) {
            this.locX.jiggle_start(x, chance);
            this.locY.jiggle_start(y, chance);
            this.angle.jiggle_start(rot, chance);
        } else {
            this.locX.jiggle_stop();
            this.locY.jiggle_stop();
            this.angle.jiggle_stop();
        }
    }

    wave(max, rate, chance) {
        if (chance < 1 || max < 1) {
            this.skewY.sway_stop();
        } else {
            this.skewY.sway_start(max, chance);
        }
    }

    sway(max, rate, chance) {
        if (chance < 1 || max < 1) {
            this.skewX.sway_stop();
        } else {
            this.skewX.sway_start(max, rate, chance);
        }
    }

    flicker(d, chance) {
        if (chance > 0) {
            this.transparency.jiggle_start(d, chance);
        } else {
            this.transparency.jiggle_stop();
        }
    }

    throw(angle, initialVelocity, now, callback) {
        if (arguments.length > 3) {
            this.throwCallback = callback;
        }
        if (angle == "stop") {
            this.falling = false;
            if (this.throwCallback != null) {
                this.throwCallback();
            }
        } else {
            this.falling = true;
            const radians = angle * Math.PI / 180;
            this.thrownVx = initialVelocity * Math.sin(radians);
            this.thrownVy = initialVelocity * Math.cos(radians) * -1; // y grows downwards
            this.throwTime = now;
        }
    }

    blink(rate, chance, now) {
        this.blinkRate = rate;
        this.blinkChance = chance;
        if ( rate <= 0 ) { // disappear when turning off
            this.visible = false;
        }
        this.next_blink = now + (1000 / this.blinkRate);
    }

    pulse(rate, pulseMin, pulseMax, now) {
        if (rate == 0) {
            this.pulseRate = 0;
            this.transparency.setTargetValue(100);
        } else {
            this.pulseRate = 1 / rate;
            this.pulseMin = pulseMin;
            this.pulseMax = pulseMax;
            this.transparency.setTargetValue(this.pulseMin);
            this.transparency.setTargetValue(this.pulseMax, this.pulseRate, now);
        }
    }

    setVisibility( visible ) {
        if (visible === true) {
            this.visible = true;
        } else if (visible === false) {
            this.visible = false;
        } else if (visible == "toggle") {
            this.visible = !this.visible;
        }
        if (this.enabled && this.piSprite != null) {
            this.piSprite.visible = this.visible;
        }
    }

    resize(new_w, newH, to_or_by, in_or_at, duration, now, callback) {
        if (to_or_by == "by") {
            new_w += this.sizeX.value();
            newH += this.sizeY.value();
        }
        if (in_or_at == "at") {
            // (future: rate-based resizing)
        }
        this.sizeX.setTargetValue(new_w, duration, now, callback);
        this.sizeY.setTargetValue(newH, duration, now);
    }

    resetSize() {
        this.sizeX.setTargetValue(this.piImage.orig.width);
        this.sizeY.setTargetValue(this.piImage.orig.height);
    }

    setScale(scaleX, scaleY, command, toOrBy, duration, now, callback) {
        const currentX = this.scaleX.value() * 100;
        const currentY = this.scaleY.value() * 100;
        switch (command) {
            case "shrink":
                // e.g. shrink by 10% means go from 100% to 90%
                if (toOrBy == "by") {
                    scaleX = currentX - scaleX;
                    scaleY = currentY - scaleY;
                } // else
                // shrink to 10% means go to 10%
                break;
            case "grow":
                if (toOrBy == "by") {
                    scaleX = currentX + scaleX;
                    scaleY = currentY + scaleY;
                } // else
                // e.g. grow by 10% means go from 100% to 110%
                // grow to 110% means just that
                break;
            case "scale": // just use the given values
                // toOrBy is ignored (it means the same thing)
            default:
                break;
        }
        // Do some sense checks
        if (scaleX <= 0) {
            scaleX = 1; // %
        }
        if (scaleY <=0) {
            scaleY = 1; // %
        }
        // convert percentages to float values
        this.scaleX.setTargetValue(scaleX / 100, duration, now, callback);
        this.scaleY.setTargetValue(scaleY / 100);
    }

    getDefaultWarpCorners() {
        const halfWidth = this.sizeX.value() * this.scaleX.value() * Globals.scriptScaleX / 2;
        const halfHeight = this.sizeY.value() * this.scaleY.value() * Globals.scriptScaleY / 2;
        return [
            -halfWidth, -halfHeight,
             halfWidth, -halfHeight,
             halfWidth,  halfHeight,
            -halfWidth,  halfHeight
        ];
    }

    getWarpCorners() {
        if (!this.warped) {
            return this.getDefaultWarpCorners();
        }
        return this.warpCorners.map(corner => corner.value());
    }

    currentWarpPoints() {
        const corners = this.getWarpCorners();
        const points = [];
        for (let i = 0; i < corners.length; i += 2) {
            points.push(corners[i] + this.locX.value(), corners[i + 1] + this.locY.value());
        }
        return points;
    }

    setWarp(points, toOrBy, duration, now, callback) {
        if (points.length != 8) {
            return;
        }
        const currentPoints = this.currentWarpPoints();
        const targetPoints = [];
        for (let i = 0; i < points.length; i++) {
            targetPoints[i] = toOrBy == "by" ? currentPoints[i] + points[i] : points[i];
        }
        const centerX = (targetPoints[0] + targetPoints[2] + targetPoints[4] + targetPoints[6]) / 4;
        const centerY = (targetPoints[1] + targetPoints[3] + targetPoints[5] + targetPoints[7]) / 4;
        this.warped = true;
        this.locX.setTargetValue(centerX, duration, now, callback);
        this.locY.setTargetValue(centerY, duration, now);
        for (let i = 0; i < targetPoints.length; i += 2) {
            this.warpCorners[i].setTargetValue(targetPoints[i] - centerX, duration, now);
            this.warpCorners[i + 1].setTargetValue(targetPoints[i + 1] - centerY, duration, now);
        }
        this.applyWarpCorners();
    }

    clearWarp() {
        this.warped = false;
        if (this.piSprite !== null && this.piSprite.constructor.name == "PerspectiveMesh") {
            const texture = this.piSprite.texture;
            const replacement = new PIXI.Sprite({
                texture: texture,
                anchor: 0.5,
                position: {x: this.locX.value(), y: this.locY.value()},
                visible: this.visible,
            });
            replacement.setSize(this.sizeX.value() * this.scaleX.value() * Globals.scriptScaleX,
                this.sizeY.value() * this.scaleY.value() * Globals.scriptScaleY);
            this.replacePixiSprite(replacement);
        }
    }

    replacePixiSprite(replacement) {
        if (this.piSprite !== null) {
            replacement.zIndex = this.piSprite.zIndex;
            replacement.tint = this.piSprite.tint;
            replacement.alpha = this.piSprite.alpha;
            replacement.filters = this.piSprite.filters;
            if (this.piSprite.parent) {
                this.piSprite.parent.addChild(replacement);
                this.piSprite.destroy();
            }
        }
        this.piSprite = replacement;
    }

    ensurePerspectiveMesh(texture) {
        if (typeof PIXI.PerspectiveMesh !== "function") {
            Globals.log.error("PerspectiveMesh is not available in this PixiJS build");
            return false;
        }
        if (this.piSprite !== null && this.piSprite.constructor.name == "PerspectiveMesh") {
            return true;
        }
        const mesh = new PIXI.PerspectiveMesh({
            texture: texture,
            verticesX: 20,
            verticesY: 20,
            position: {x: this.locX.value(), y: this.locY.value()},
            visible: this.visible,
        });
        if (this.piSprite === null) {
            this.piSprite = mesh;
            return true;
        }
        this.replacePixiSprite(mesh);
        return true;
    }

    applyWarpCorners() {
        if (!this.warped || this.piSprite === null) {
            return;
        }
        if (!this.ensurePerspectiveMesh(this.piSprite.texture)) {
            return;
        }
        this.piSprite.setCorners(...this.getWarpCorners());
    }
        
    update(scene, now) {
        if (!this.enabled) {
            return;
        }
        // First, do we need to load an image (and can we?)
        if (this.type == constants.SPRITE_IMAGE && 
                (this.piSprite === null || this.piSprite.texture == PIXI.Texture.EMPTY)) { // no image loaded
            let image = SGImage.getImage(scene, this.imageName);
            if (image === null) { // doesn't exist, give up
                this.enabled = false;
                return;
            }
            if (image != "loading") { // now ready
                const img_width = image.piImage.width;
                const imgHeight = image.piImage.height;
                // Are we in a specific location?
                if (this.role != null) {
                    // Yes, but we need the image size to work out scaling
                    const wdw_width = Globals.app.screen.width;
                    const wdwHeight = Globals.app.screen.height;
                    const aspectY = imgHeight / wdwHeight ;
                    const aspectX = img_width / wdw_width ;
                    let depth = null;
                    switch ( this.role ) {
                        case "background": // centre, and scale to window size
                        case "backdrop": // centre, and scale to window size
                            this.locX.setTargetValue(wdw_width / 2);
                            this.locY.setTargetValue(wdwHeight / 2);
                            this.sizeX.setTargetValue(wdw_width);
                            this.sizeY.setTargetValue(wdwHeight);
                            depth = defaults.DEPTH_BACKGROUND;
                            break;
                        case "left":
                            this.locX.setTargetValue(img_width / 2);
                            this.locY.setTargetValue(wdwHeight / 2);
                            this.sizeX.setTargetValue(aspectY * img_width);
                            this.sizeY.setTargetValue(aspectY * imgHeight);
                            depth = defaults.DEPTH_LEFT;
                            break;
                        case "right":
                            this.locX.setTargetValue(wdw_width - (img_width / 2));
                            this.locY.setTargetValue(wdwHeight / 2);
                            this.sizeX.setTargetValue(aspectY * img_width);
                            this.sizeY.setTargetValue(aspectY * imgHeight);
                            depth = defaults.DEPTH_RIGHT;
                            break;
                        case "top":
                        case "sky":
                            this.locX.setTargetValue(wdw_width / 2);
                            this.locY.setTargetValue(imgHeight / 2);
                            this.sizeX.setTargetValue(aspectX * img_width);
                            this.sizeY.setTargetValue(aspectX * imgHeight);
                            depth = defaults.DEPTH_SKY;
                            break;
                        case "bottom":
                        case "ground":
                        case "foreground":
                            this.locX.setTargetValue(wdw_width / 2);
                            this.locY.setTargetValue(wdwHeight - (imgHeight / 2));
                            this.sizeX.setTargetValue(aspectX * img_width);
                            this.sizeY.setTargetValue(aspectX * imgHeight);
                            depth = this.role == "ground" ? defaults.DEPTH_GROUND : defaults.DEPTH_FOREGROUND;
                            break;
                    }
                    if (this.depth == null ) {
                        this.depth = depth;
                    }
                } else { // set size from the image, if not already set
                    if (this.sizeX.value() == 0) {
                        this.sizeX.setTargetValue(img_width);
                    }
                    if (this.sizeY.value() == 0) {
                        this.sizeY.setTargetValue(imgHeight);
                    }
                }
                const fullTexture = new PIXI.Texture(image.piImage);
                let texture = null;
                if (this.windowed) {
                    const viewRectangle =  new PIXI.Rectangle(this.viewX.value(), this.viewY.value(),
                                    this.viewWidth.value(), this.viewHeight.value());
                    texture = new PIXI.Texture({
                        source: fullTexture.source,
                        frame: viewRectangle,
                        });
                    texture.source.wrapMode = "mirror-repeat";
                    this.sizeX.setTargetValue(this.viewWidth.value());
                    this.sizeY.setTargetValue(this.viewHeight.value());
                } else {
                    texture = fullTexture;
                }
                if (this.warped && typeof PIXI.PerspectiveMesh === "function") {
                    this.piSprite = new PIXI.PerspectiveMesh({
                            texture: texture,
                            verticesX: 20,
                            verticesY: 20,
                            position: {x: this.locX.value(),
                                y: this.locY.value() },
                            visible: this.visible,
                            });
                    this.piSprite.setCorners(...this.getWarpCorners());
                } else {
                    if (this.warped) {
                        Globals.log.error("PerspectiveMesh is not available in this PixiJS build");
                    }
                    this.piSprite = new PIXI.Sprite({
                            texture: texture,
                            anchor: 0.5,
                            position: {x: this.locX.value(),
                                y: this.locY.value() },
                            visible: this.visible,
                            });
                }
                // set depth to next highest, unless it is already set
                this.depth = Globals.nextZ(this.depth);
                this.piSprite.zIndex = this.depth;
                this.piSprite.tint = this.currentTint();
                if (this.warped) {
                    this.applyWarpCorners();
                } else {
                    this.piSprite.setSize(this.sizeX.value() * this.scaleX.value() * Globals.scriptScaleX,
                        this.sizeY.value() * this.scaleY.value() * Globals.scriptScaleY);
                }
                if (this.sgParent) {
                    this.sgParent.piSprite.addChild(this.piSprite);
                } else {
                    Globals.root.addChild(this.piSprite);
                }
            } // else, still loading, try again later
        }
        // Do we need to flip?
        if (this.piSprite !== null && this.flipChange) {
            this.piSprite.scale.set(this.flipH ? -1 : 1, this.flipV ? -1 : 1);
            this.flipChange = false;
        }

        // Is our window moving?
        if (this.windowed) {
            let scrolled = false;
            // Are we scrolling the window?
            if (this.scrollX || this.scrollY) {
                if (this.scrollX != 0 && (now - this.lastScrollX) > 1000 / this.scrollX) {
                    this.viewX.tweak(this.scrollX > 0 ? 1 : -1);
                    this.lastScrollX = now;
                    scrolled = true;
                }
                if (this.scrollY != 0 && (now - this.lastScrollY) > 1000 / this.scrollY) {
                    this.viewY.tweak(this.scrollY > 0 ? 1 : -1);
                    this.lastScrollY = now;
                    scrolled = true;
                }
            }
            const updateViewX = this.viewX.updateValue();
            const updateViewY = this.viewY.updateValue();
            const updateViewWidth = this.viewWidth.updateValue();
            const updateViewHeight = this.viewHeight.updateValue();
            if (scrolled || updateViewHeight || updateViewWidth || updateViewX || updateViewY) {
                if (this.piSprite !== null) {
                    this.piSprite.texture.frame = new PIXI.Rectangle(this.viewX.value(), this.viewY.value(),
                                    this.viewWidth.value(), this.viewHeight.value());
                    this.piSprite.texture.updateUvs();
                    this.sizeX.setTargetValue(this.viewWidth.value());
                    this.sizeY.setTargetValue(this.viewHeight.value());
                }
            }
        }

        // Now update position
        // can't test both in same expression because of short-circuiting
        let changeX = this.locX.updateValue();
        let changeY = this.locY.updateValue();
        if (changeX || changeY) {
            if (this.piSprite !== null ) { // image has been loaded
                this.piSprite.position.set(this.locX.value(), this.locY.value());
            }
        }
        // Bounds checking
        if ((Math.abs(this.locX.value()) > (Globals.width * defaults.BOUNDS_X))
              || (Math.abs(this.locY.value()) > (Globals.width * defaults.BOUNDS_Y)) ) {
            this.enabled = false;
            return;
        }    
        // Let's see if we have been thrown...?
        if (this.falling) {
            const fallingTime = (now - this.throwTime) / 1000; // elapsed time in seconds
            const deltaX = this.thrownVx * fallingTime * Globals.scriptScaleX;
            // gravity is negative because y grows downwards on a canvas
            const deltaY = ((this.thrownVy * fallingTime) - (0.5 * Globals.gravity * -1 * fallingTime * fallingTime)) * Globals.scriptScaleY;
            if (((Math.abs(deltaX) > Globals.app.screen.width * 2) || (Math.abs(deltaY) > Globals.app.screen.height * 2)) ||
                (Globals.ground_level > 0 && this.locY.value + deltaY > Globals.ground_level)) {
                this.falling = false; // gone off the edge of the world or hit the ground
                this.visible = false; 
                this.enabled = false;
                if (this.throwCallback != null) {
                    this.throwCallback();
                }
            }
            this.locX.setTargetValue(this.locX.value() + deltaX);
            this.locY.setTargetValue(this.locY.value() + deltaY);
            if (this.piSprite !== null ) { // image has been loaded
                this.piSprite.position.set(this.locX.value(), this.locY.value());
            }
        }

        // Update rotation angle
        const pivotOnX = this.pivotX.updateValue();
        const pivotOnY = this.pivotY.updateValue();
        const changeAngle = this.angle.updateValue();
        if (pivotOnX || pivotOnY || changeAngle) {
            if (this.piSprite !== null ) { // image has been loaded
                // if (this.type == constants.SPRITE_GRAPHIC) { // graphics are drawn around their centre
                    // update pivot point (before turning)
                //     this.piSprite.origin.set((this.sizeX / -2) + (this.sizeX * this.pivotX.value()/100),
                //                              (this.sizeY / -2) + (this.sizeY * this.pivotY.value()/100));
                // } else { // sprite.type == constants.SPRITE_IMAGE, etc.
                //         // update pivot point (before turning)
                        // this.piSprite.anchor.set(this.sizeX * this.pivotX.value()/100, this.sizeY * this.pivotY.value()/100);
                // }
                this.piSprite.angle = this.angle.value();
                // put it back to the centre for scaling etc. afterwards
                // this.piSprite.origin.set(this.sizeX / 2, this.sizeY / 2);
            }
        }

        // Update transparency
        if (this.transparency.updateValue()) {
            if (this.piSprite !== null ) { // image has been loaded
                this.piSprite.alpha = this.transparency.value() / 100;
            }
        } else { // if pulsing, switch directions
            if (this.pulseRate > 0) {
                if (this.pulseUp) {
                    this.transparency.setTargetValue(this.pulseMin, this.pulseRate, now);
                    this.pulseUp = false;
                } else {
                    this.transparency.setTargetValue(this.pulseMax, this.pulseRate, now);
                    this.pulseUp = true;
                }
            }
        }

        // colour tint
        if (this.newTint) {
            if (this.piSprite !== null ) { // image has been loaded
                this.piSprite.tint = this.tintColour;
                this.newTint = false;
            }
        }

        // darken / lighten
        if (this.tintValue.updateValue()) {
            if (this.piSprite !== null ) { // image has been loaded
                this.piSprite.tint = this.currentTint();
            }
        }
        
        // update scale
        // can't test both in same expression because of short-circuiting
        const changeSX = this.scaleX.updateValue();
        const changeSY = this.scaleY.updateValue();
        // update size
        changeX = this.sizeX.updateValue();
        changeY = this.sizeY.updateValue();
        if (changeSX || changeSY || changeX || changeY) {
            if (this.piSprite !== null ) { // image has been loaded
                if (this.warped) {
                    this.applyWarpCorners();
                } else {
                    this.piSprite.setSize(this.sizeX.value() * this.scaleX.value() * Globals.scriptScaleX,
                        this.sizeY.value() * this.scaleY.value() * Globals.scriptScaleY);
                }
            }
        }
         
        // Are we blinking?
        if (this.blinkRate > 0 && this.next_blink < now) {
            if (this.blinkChance >= 100 || Math.random() * 100 < this.blinkChance ) { // lets blink
                this.visible = !this.visible;
                this.next_blink += 1000 / this.blinkRate;
                if (this.piSprite !== null ) { // image has been loaded
                    this.piSprite.visible = this.visible;
                }
            }
        }

        // Or are we flashing?
        if (this.flashCount > 0 && this.nextFlash < now) {
            if (this.visible) {
                this.visible = false;
                this.flashCount -= 1;
            } else {
                this.visible = true;
            } 
            this.nextFlash = now + 100;
            this.piSprite.visible = this.visible;
        }

        // Or are we blurring?
        if (this.bluriness.updateValue()) {
            if (this.piSprite !== null ) { // image has been loaded
                if (this.piSprite.filters == null) {
                    this.piSprite.filters = [ this.blurFilter ];
                } // need to modity this if we need more filter types
                this.blurFilter.strength = this.bluriness.value() / 10;
            }
        }

        // or are we skewing?
        const change_skewX = this.skewX.updateValue();
        const change_skewY = this.skewY.updateValue();
        if (change_skewX || change_skewY) {
            this.piSprite.skew.x = this.skewX.value() * (Math.PI / 180);
            this.piSprite.skew.y = this.skewY.value() * (Math.PI / 180);
        }

        let changeWarp = false;
        for (let i = 0; i < this.warpCorners.length; i++) {
            changeWarp = this.warpCorners[i].updateValue() || changeWarp;
        }
        if (changeWarp) {
            this.applyWarpCorners();
        }
    }

    static getSprite(scene, name, report = true) {
        if (!name) {
            Globals.log.error("bad sprite name - ");
            return false;
        }
        let parts = name.split(":");
        if (parts.length > 1) {
            scene = parts[0];
            name = parts[1];
        }
        for ( let i = 0; i < Globals.scenes.length; i++ ) {
            if (Globals.scenes[i].name == scene) {
                for ( let j = 0; j < Globals.scenes[i].sprites.length; j++ ) {
                    // Only return sprites from scenes that are currently running
                    if (!(Globals.scenes[i].state == constants.SCENE_STOPPED) && Globals.scenes[i].sprites[j].name == name) {
                        return(Globals.scenes[i].sprites[j]);
                    }
                }
            }
        }
        if (report) {
            Globals.log.error("No sprite found- " + scene + ":" + name);
        }
        return(false);
    }

    static remove_sprite(scene, name, report = false) {
        if (!name) {
            return false;
        }
        let parts = name.split(":");
        if (parts.length > 1) {
            scene = parts[0];
            name = parts[1];
        }
        for ( let i = 0; i < Globals.scenes.length; i++ ) {
            if (Globals.scenes[i].name == scene) {
                for ( let j = 0; j < Globals.scenes[i].sprites.length; j++ ) {
                    if (Globals.scenes[i].sprites[j].name == name) {
                        Globals.scenes[i].sprites[j].piSprite.destroy();
                        Globals.scenes[i].sprites.splice(j,1);
                        return true;
                    }
                }
            }
        }
        if (report) {
            Globals.log.error("No sprite found- " + scene + ":" + name);
        }
        return false;
    }
}
