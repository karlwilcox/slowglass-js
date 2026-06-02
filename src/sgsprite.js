
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
    constructor(data, name, callback, cols = 0, rows = 0) {
        this.name = name;
        this.width = 0;
        this.height = 0;
        this.origWidth = 0;
        this.origHeight = 0;
        this.callback = callback;
        // check for silly cell sizes
        if (cols < 0) {
            cols = 0;
        } else if (rows < 1) {
            rows = 1;
        }
        this.cols = cols; // animation frames
        this.rows = rows;
        this.tags = new TagList();
        if (data !== null) { // this is an image
            this.piImage = null;
            if (callback) {
                callback(1);
            }
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
        if (this.callback) {
            // Globals.log.report(`Image ${this.name} loaded`);
            this.callback(-1);
        }
        this.width = this.piImage.width;
        this.height = this.piImage.height;
        this.origWidth = this.width;
        this.origHeight = this.height;
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

    constrainFrame(frameNo) {
        const numFrames = this.cols * this.rows;
        if (frameNo > numFrames) {
            frameNo = 1;
        } else if (frameNo < 1) {
            frameNo = numFrames - 1;
        }
        return frameNo;
    }

    makeCellRect(frameNo) {
        const numFrames = this.cols * this.rows;
        // const column = Math.floor(number / (this.columns + 1));
        const column = ((frameNo - 1) % this.cols);
        const row = Math.floor((frameNo -1) / this.cols)
        const frameWidth = this.width / this.cols;
        const frameHeight = this.height / this.rows;
        const frameX = column * frameWidth;
        const frameY = row * frameHeight;
        return new PIXI.Rectangle(frameX, frameY, frameWidth, frameHeight);
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
        this.loaded = false;
        this.placed = false;
        this.imageName = imageName;
        this.image = null;
        this.name = spriteName
        this.tags = new TagList();
        this.tags.addTag(tags); // default tags
        this.sgParent = null;
        this.children = [];
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
        this.origX = 0; // set on creation
        this.origY = 0;
        // requested size on placement (deferred sizing)
        this.dimensionType = false;
        this.dimension1 = 0;
        this.dimension2 = 0;
        this.deferredDuration = 0;
        this.deferredNow = 0;
        this.deferredCallback = null;
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
        // Frame based animation
        this.currentFrame = 0;
        this.lastFrame = 0;
        this.animationRate = 0;
        this.lastFrameChange = 0;
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

    requestSize(type, x, y = 0, duration = 0, now = 0, callback = false) {
        this.dimensionType = type;
        this.dimension1 = x;
        this.dimension2 = y;
        this.deferredDuration = duration;
        this.deferredNow = now;
        this.deferredCallback = callback;
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
            this.depth = Globals.nextZ();
        }
        if (this.enabled && this.piSprite != null) {
            this.piSprite.zIndex = this.depth;
        }
    }

    setSkew(newX, newY, toOrBy, duration, now, callback = false) {
         if (toOrBy == "by") {
            newX += this.skewX.value();
            newY += this.skewY.value();
        }       
        // we set in motion up to two changes
        if (callback) {
            callback(2)
        }
        this.skewX.setTargetValue(newX, duration, now, callback);
        this.skewY.setTargetValue(newY, duration, now, callback);
    }

    move(newX, newY, toOrBy, inOrAt, duration, now, callback = false) {
        if (toOrBy == "by") {
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
        if (inOrAt == "at") { // duration is really rate here
            const xDuration = Math.abs(this.locX.value() - newX) / duration; 
            const yDuration = Math.abs(this.locY.value() - newY) / duration; 
            const newDuration = Math.max(xDuration, yDuration);
            this.locX.setTargetValue(newX, newDuration, now, callback);
            this.locY.setTargetValue(newY, newDuration, now, callback);
        } else {
            this.locX.setTargetValue(newX, duration, now, callback);
            this.locY.setTargetValue(newY, duration, now, callback);
            // we set in motion up to two changes
        }
        if (callback) {
            callback(2)
        }
        this.enabled = true;
    }

    setView(x, y, w, h, dur_type, duration, now, callback = false) {
        if (dur_type == "stop") {
            this.windowed = false;
            this.viewX.forceValue(this.viewX.value());
            this.viewY.forceValue(this.viewY.value());
            this.viewWidth.forceValue(this.viewWidth.value());
            this.viewHeight.forceValue(this.viewHeight.value());
        } else {
            this.windowed = true;
        // we set in motion up to two changes
        if (callback) {
            callback(4)
        }
            this.viewX.setTargetValue(x, duration, now, callback);
            this.viewY.setTargetValue(y, duration, now, callback);
            this.viewWidth.setTargetValue(w, duration, now, callback);
            this.viewHeight.setTargetValue(h, duration, now, callback);
        }
    }

    setScroll(dx, dy) {
        this.scrollX = dx;
        this.scrollY = dy;
    }

    rotate(turn_type, value, dur_type, duration, now, callback = false) {
        let newValue = 0;
        if (turn_type == "to") {
            newValue = value;
        } else if (turn_type == "by") {
            newValue = this.angle.value() + value;
        } // add "at"
        if (callback) {
            callback(1)
        }
        if (dur_type == "in") {
            this.angle.setTargetValue(newValue, duration, now, callback);
        } else {
            this.angle.setTargetValue(newValue, 0);
        }
    }

    pivotPoint(pivotX, pivotY, duration, now, callback = false) {
        if (callback) {
            callback(2)
        }
        this.pivotX.setTargetValue(pivotX, duration, now, callback);
        this.pivotY.setTargetValue(pivotY, duration, now, callback); 
    }

    setTransparency(target, duration, fade_type, now, callback = false) {
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
        if (callback) {
            callback(1)
        }
        this.transparency.setTargetValue(target, duration, now, callback);
    }

    setBlur(target, duration, blur_type, now, callback = false) {
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
        if (callback) {
            callback(1)
        }
        this.bluriness.setTargetValue(target, duration, now, callback);
    }

    setTint(target, duration, now, callback = false) {
        if (arguments.length == 1) {
        if (callback) {
            callback(1)
        }
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

    throw(angle, initialVelocity, now, callback = false) {
        if (callback) {
            callback(1)
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

    resize(newX, newY, toOrBy, inOrAt, duration, now, callback = false) {
        if (newX == 0) {
            newX = this.origX * newY / this.origY;
        }
        if (newY == 0) {
            newY = this.origY * newX / this.origX;
        }
        if (toOrBy == "by") {
            newX += this.sizeX.value();
            newY += this.sizeY.value();
        }
        if (inOrAt == "at") {
            // (future: rate-based resizing)
        }
        // we set in motion up to two changes
        if (callback) {
            callback(2)
        }
        this.sizeX.setTargetValue(newX, duration, now, callback);
        this.sizeY.setTargetValue(newY, duration, now, callback);
    }

    resetSize() {
        this.sizeX.setTargetValue(this.origX);
        this.sizeY.setTargetValue(this.origY);
    }

    setScale(scaleX, scaleY, command, toOrBy, duration, now, callback = false) {
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
        // we set in motion up to two changes
        if (callback) {
            callback(2)
        }
        this.scaleX.setTargetValue(scaleX / 100, duration, now, callback);
        this.scaleY.setTargetValue(scaleY / 100, duration, now, callback);
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

    setWarp(points, toOrBy, duration, now, callback = false) {
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
        if (callback) {
            callback(2);
        }
        this.locX.setTargetValue(centerX, duration, now, callback);
        this.locY.setTargetValue(centerY, duration, now, callback);
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

    applySize(dimensionType, dimension1, dimension2, 
                toOrBy = null, inOrAt = null, duration = 0, now = 0, callback = false) {
        let width = 0;
        let height = 0;
        // we set in motion up to two changes
        if (callback) {
            callback(2)
        }
        switch (dimensionType) {
            case "size":
                width = dimension1;
                height = dimension2;
                if (toOrBy == "by") {
                    width += this.sizeX.value();
                    height += this.sizeY.value();
                }
                break;
            case "width":
                width = dimension1;
                height = (this.origX / this.origY) * width;
                break;
            case "height":
                height = dimension1;
                width = (this.origX / this.origY) * height;
                break;
            case "image":
                width = dimension1;
                height = dimension2;
            default: 
                break;
        }
        if (inOrAt == "at") {
            // (future: rate-based resizing)
        }
        this.sizeX.setTargetValue(width, duration, now, callback);
        this.sizeY.setTargetValue(height, duration, now, callback);
    }

    origFromBounds(message = "") {
        if (this.type != constants.SPRITE_GROUP) {
            return;
        }
        // Get the new group size
        const bounds = this.piSprite.getLocalBounds();
        // Globals.log.report(`${message} local bounds ${bounds.width}  ${bounds.height}`);
        // const size = this.piSprite.getSize();
        // Globals.log.report(`${message} size ${size.width}  ${size.height}`);
        // this.sizeX.forceValue(bounds.width);
        // this.sizeY.forceValue(bounds.height);
        this.origX = bounds.width / this.scaleX.value();
        this.origY = bounds.height / this.scaleY.value();
    }

/**************************************************************************************************

   ##     ## ########  ########     ###    ######## ######## 
   ##     ## ##     ## ##     ##   ## ##      ##    ##       
   ##     ## ##     ## ##     ##  ##   ##     ##    ##       
   ##     ## ########  ##     ## ##     ##    ##    ######   
   ##     ## ##        ##     ## #########    ##    ##       
   ##     ## ##        ##     ## ##     ##    ##    ##       
    #######  ##        ########  ##     ##    ##    ######## 

**************************************************************************************************/
        
    update(scene, now, loadOnly = false) {
        if (!this.enabled) {
            return;
        }
        // First, do we need to load an image (and can we?)
        if (this.type == constants.SPRITE_IMAGE && this.placed &&
                (this.piSprite === null || this.piSprite.texture == PIXI.Texture.EMPTY)) { // no image loaded
            let image = SGImage.getImage(scene, this.imageName);
            if (image === null) { // doesn't exist, give up
                this.enabled = false;
                return;
            }
            if (image != "loading") { // now ready
                const imgWidth = image.piImage.width;
                const imgHeight = image.piImage.height;
                // Are we in a specific location?
                if (this.role != null) {
                    // Yes, but we need the image size to work out scaling
                    const wdw_width = Globals.app.screen.width;
                    const wdwHeight = Globals.app.screen.height;
                    const aspectY = imgHeight / wdwHeight ;
                    const aspectX = imgWidth / wdw_width ;
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
                            this.locX.setTargetValue(imgWidth / 2);
                            this.locY.setTargetValue(wdwHeight / 2);
                            this.sizeX.setTargetValue(aspectY * imgWidth);
                            this.sizeY.setTargetValue(aspectY * imgHeight);
                            depth = defaults.DEPTH_LEFT;
                            break;
                        case "right":
                            this.locX.setTargetValue(wdw_width - (imgWidth / 2));
                            this.locY.setTargetValue(wdwHeight / 2);
                            this.sizeX.setTargetValue(aspectY * imgWidth);
                            this.sizeY.setTargetValue(aspectY * imgHeight);
                            depth = defaults.DEPTH_RIGHT;
                            break;
                        case "top":
                        case "sky":
                            this.locX.setTargetValue(wdw_width / 2);
                            this.locY.setTargetValue(imgHeight / 2);
                            this.sizeX.setTargetValue(aspectX * imgWidth);
                            this.sizeY.setTargetValue(aspectX * imgHeight);
                            depth = defaults.DEPTH_SKY;
                            break;
                        case "bottom":
                        case "ground":
                        case "foreground":
                            this.locX.setTargetValue(wdw_width / 2);
                            this.locY.setTargetValue(wdwHeight - (imgHeight / 2));
                            this.sizeX.setTargetValue(aspectX * imgWidth);
                            this.sizeY.setTargetValue(aspectX * imgHeight);
                            depth = this.role == "ground" ? defaults.DEPTH_GROUND : defaults.DEPTH_FOREGROUND;
                            break;
                    }
                    if (this.depth == null ) {
                        this.depth = depth;
                    }
                } else if (this.dimensionType == "image") { // set size from the image
                    this.sizeX.setTargetValue(imgWidth);
                    this.sizeY.setTargetValue(imgHeight);
                } else { // set size as per request
                    this.applySize(this.dimensionType, this.dimension1, this.dimension2,
                                "to", null, this.deferredDuration, this.deferredNow, this.deferredCallback);
                }
                const fullTexture = new PIXI.Texture(image.piImage);
                let texture = fullTexture;
                if (image.cols > 0) {
                    const viewRectangle = image.makeCellRect(1);
                    texture = new PIXI.Texture({
                        source: fullTexture.source,
                        frame: viewRectangle,
                        dynamic: true,
                        });
                    texture.source.wrapMode = "repeat";
                    this.sizeX.setTargetValue(imgWidth / image.cols);
                    this.sizeY.setTargetValue(imgHeight / image.rows);
                    this.currentFrame = 1;
                } else if (this.windowed) {
                    const viewRectangle =  new PIXI.Rectangle(this.viewX.value(), this.viewY.value(),
                                    this.viewWidth.value(), this.viewHeight.value());
                    texture = new PIXI.Texture({
                        source: fullTexture.source,
                        frame: viewRectangle,
                        dynamic: true,
                        });
                    texture.source.wrapMode = "mirror-repeat";
                    this.sizeX.setTargetValue(this.viewWidth.value());
                    this.sizeY.setTargetValue(this.viewHeight.value());
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
                    this.piSprite.texture = texture;
                    this.piSprite.position.x = this.locX.value();
                    this.piSprite.position.y = this.locY.value();
                    this.piSprite.visible = this.visible;
                }
                // set depth to next highest, unless it is already set
                this.depth = Globals.nextZ(this.depth);
                this.piSprite.zIndex = this.depth;
                this.piSprite.tint = this.currentTint();
                // Set size for reset
                this.origX = this.sizeX.value();
                this.origY = this.sizeY.value();
                if (this.warped) {
                    this.applyWarpCorners();
                } else {
                    if (this.sizeX.value() <= 0) {
                        this.sizeX.forceValue(this.origX);
                    }
                    if (this.sizeY.value() <= 0) {
                        this.sizeY.forceValue(this.origY);
                    }
                    const newX = this.sizeX.value() * this.scaleX.value() * Globals.scriptScaleX;
                    const newY = this.sizeY.value() * this.scaleY.value() * Globals.scriptScaleY;
                    if (newX <= 0 || newY <= 0) {
                        Globals.log.error("trying to set zero size on load");
                    } else {
                        this.piSprite.setSize(newX, newY);
                    }
                }
                this.image = image;
                this.loaded = true;
                // End image loading updates
            } // else, still loading, try again later
        }
        if (loadOnly) {
            return;
        }
        // Flag later changes that they need to update as well
        let forceUpdate = false;
        let newBounds = false;
        // Do we need to flip?
        if (this.piSprite !== null && this.flipChange) {
            this.piSprite.scale.set(this.flipH ? -1 : 1, this.flipV ? -1 : 1);
            this.flipChange = false;
        }
        // Are we animated?
        if (this.animationRate > 0) {
            if ((now - this.lastFrameChange) > 1000 / this.animationRate) {
                this.currentFrame += 1;
                this.lastFrameChange = now;
            }
        }
        // Do we need to update the frame?
        if (this.image != null && this.currentFrame != this.lastFrame) {
            if (this.image.cols < 1) {
                Globals.log.error("Image has no frames in sprite " + this.name);
            } else {
                this.currentFrame = this.image.constrainFrame(this.currentFrame);
                const viewRectangle = this.image.makeCellRect(this.currentFrame);
                if (this.piSprite !== null) {
                    this.piSprite.texture.frame = viewRectangle;
                    this.piSprite.texture.update();
                    forceUpdate = true;
                }
            }
            this.lastFrame = this.currentFrame;
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
                    this.piSprite.texture.update();
                    this.sizeX.setTargetValue(this.viewWidth.value());
                    this.sizeY.setTargetValue(this.viewHeight.value());
                    forceUpdate = true;
                }
            }
        }

        // Now update position
        // can't test both in same expression because of short-circuiting
        {
            const changeX = this.locX.updateValue();
            const changeY = this.locY.updateValue();
            if (changeX || changeY) {
                if (this.piSprite !== null ) { // image has been loaded
                    this.piSprite.position.set(this.locX.value(), this.locY.value());
                }
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
            const deltaY = ((this.thrownVy * fallingTime) - (0.5 * scene.gravity * -1 * fallingTime * fallingTime)) * Globals.scriptScaleY;
            if (((Math.abs(deltaX) > Globals.app.screen.width * 2) || (Math.abs(deltaY) > Globals.app.screen.height * 2)) ||
                (scene.groundLevel && this.locY.value + deltaY > scene.groundLevel)) {
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
        {
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
                    // Do we need to set newBounds here...?
                    // put it back to the centre for scaling etc. afterwards
                    // this.piSprite.origin.set(this.sizeX / 2, this.sizeY / 2);
                }
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
        
        // update size
        // can't test both in same expression because of short-circuiting
        // And we can't do anything if the image isn't loaded as we don't
        // know its size yet
        if (this.placed) {
        // {
            const changeSX = this.scaleX.updateValue();
            const changeSY = this.scaleY.updateValue();
            // update size
            const changeX = this.sizeX.updateValue();
            const changeY = this.sizeY.updateValue();
            if (this.piSprite != null && (forceUpdate || changeSX || changeSY || changeX || changeY)) {
                if (this.warped) {
                    this.applyWarpCorners();
                } else {
                    if (this.sizeX.value() <= 0) {
                        this.sizeX.forceValue(this.origX);
                    }
                    if (this.sizeY.value() <= 0) {
                        this.sizeY.forceValue(this.origY);
                    }
                    const newX = this.sizeX.value() * this.scaleX.value() * Globals.scriptScaleX;
                    const newY = this.sizeY.value() * this.scaleY.value() * Globals.scriptScaleY;
                    if (newX <= 0 || newY <= 0) {
                        Globals.log.error("trying to set zero size");
                    } else {
                        this.piSprite.setSize(newX, newY);
                    }
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
        {
            const change_skewX = this.skewX.updateValue();
            const change_skewY = this.skewY.updateValue();
            if (change_skewX || change_skewY) {
                this.piSprite.skew.x = this.skewX.value() * (Math.PI / 180);
                this.piSprite.skew.y = this.skewY.value() * (Math.PI / 180);
                    // Globals.log.report("Change of skew " + this.imageName);
                newBounds = true;
            }
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
                    if (!(Globals.scenes[i].state == constants.SCENE_PAUSED) && Globals.scenes[i].sprites[j].name == name) {
                        const foundSprite = Globals.scenes[i].sprites[j];
                        if (foundSprite.type == constants.SPRITE_GROUP && !foundSprite.placed) {
                            // update size from group itself
                            const groupSize = foundSprite.piSprite.getLocalBounds();
                            foundSprite.sizeX.forceValue(groupSize.width);
                            foundSprite.sizeY.forceValue(groupSize.height);
                        }
                        return foundSprite;
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
