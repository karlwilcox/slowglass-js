
import { Adjustable2 } from "./adjustable.js";
import * as Modifiers from "./modifiers.js";
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

    async loadImage() {
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

    static getImage(sceneName, name) {
        let parts = name.split(":");
        if (parts.length > 1) {
            sceneName = parts[0];
            name = parts[1];
        }
        for ( let i = 0; i < Globals.scenes.length; i++ ) {
            if (Globals.scenes[i].name == sceneName) {
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
        Globals.log.error("No image found- " + sceneName + ":" + name);
        return(null);
    }

    constrainFrame(frameNo) {
        const numFrames = this.cols * this.rows;
        if (frameNo > numFrames) {
            frameNo = 1;
        } else if (frameNo < 1) {
            frameNo = numFrames;
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
    constructor(scene, imageName, spriteName = imageName, type = constants.SPRITE_IMAGE, tags = []) {
        // We duplicated a lot of sprite properties so that we can manipulate independently
        // of whether the PI sprite has been created yet (e.g. waiting for the image to
        // load) and also in case we want to switch to a different rendering engine at a
        // future date.
        // Identification
        this.scene = scene;
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
        // click events
        this.event = false; // For the onclick event
        this.clickX = 0;
        this.clickY = 0;
        // created yet?
        this.piSprite = null;
        // location
        this.locX = new Adjustable2(0);
        this.locY = new Adjustable2(0);
        this.falling = false;
        this.landed = false;
        // rotation
        this.angle = new Adjustable2(0);
        // depth
        this.depth = 0;
        // Current size
        this.sizeX = new Adjustable2(0);
        this.sizeY = new Adjustable2(0);
        // Original size
        this.origX = 0; // set on creation
        this.origY = 0;
        // requested size
        this.sizeType = false;
        this.dimension1 = 0;
        this.dimension2 = 0;
        this.sizeDuration = 0;
        this.sizeStart = 0;
        this.sizeCallback = false;
        this.sizeRelative = false;
        this.sizeRate = 0;
        // scale
        this.scaleX = new Adjustable2(1);
        this.scaleY = new Adjustable2(1);
        // flipping
        this.flipH = false;
        this.flipV = false;
        this.flipChange = false;
        // View window
        this.windowed = false;
        this.viewX = new Adjustable2(0);
        this.viewY = new Adjustable2(0);
        this.viewWidth = new Adjustable2(0);
        this.viewHeight = new Adjustable2(0);
        // Frame based animation
        this.currentFrame = 1;
        this.lastFrame = 0;
        this.animationRate = 0;
        this.lastFrameChange = 0;
        // rotation point
        this.pivotX = new Adjustable2(50,0,100);
        this.pivotY = new Adjustable2(50,0,100);
        // visibility
        this.visible = new Adjustable2(1,0,1); // like a boolean
        this.transparency = new Adjustable2(100,0,100);
        this.tintValue = new Adjustable2(0,0,100);
        this.tintColour = null;
        this.newTint = false;
        // usage
        this.role = null;
        // bluriness
        this.bluriness = new Adjustable2(0,0,100);
        this.blurFilter = null;
        // skewiness
        this.skewX = new Adjustable2(0);
        this.skewY = new Adjustable2(0);
        // perspective warp corners, stored relative to the sprite position
        this.warped = false;
        this.warpCorners = [
            new Adjustable2(0), new Adjustable2(0),
            new Adjustable2(0), new Adjustable2(0),
            new Adjustable2(0), new Adjustable2(0),
            new Adjustable2(0), new Adjustable2(0)
        ];
        // debugging
        // this.logged = false;
    }

    /*
     * The request type can be any of:
     * image - image default size
     * width - width, heigth maintains aspect ratio
     * height - height, width maintains aspect ratio
     * size - specific size
     * reset - restore original width and height
     * false - dummy value meaning change has been actioned
    */
    requestSize(type, x, y = 0, relative = false, rate = 0, duration = 0, now = 0, callback = false) {
        this.sizeType = type;
        this.dimension1 = x;
        this.dimension2 = y;
        this.sizeRelative = relative;
        this.sizeRate = rate;
        this.sizeDuration = duration;
        this.sizeStart = now;
        this.sizeCallback = callback;
        // we set in motion up to two changes
        if (duration > 0 && callback) {
            callback(2);
        }
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
        if (this.piSprite != null) {
            this.piSprite.zIndex = this.depth;
        }
    }

    setSkew(newX, newY, toOrBy, duration, now, callback = false) {
         if (toOrBy == "by") {
            newX += this.skewX.value();
            newY += this.skewY.value();
        }       
        if (duration == 0) {
            this.skewX.setValue(newX);
            this.skewY.setValue(newY);
        } else {
            // we set in motion up to two changes
            if (callback) { callback(2) }
            const rateX = (newX - this.skewX.value()) / duration;
            const rateY = (newY - this.skewY.value()) / duration;
            this.skewX.addReferenceModifier(new Modifiers.LinearRate(now, rateX, duration, callback));
            this.skewY.addReferenceModifier(new Modifiers.LinearRate(now, rateY, duration, callback));
        }
    }

    stop() {
        this.locX.stop();
        this.locY.stop();
    }

    shimmy(deltaX, deltaY, limit, duration, now) {
	if (deltaX == "stop") {
             this.stop();
             return;
        } // else
        if (deltaX) {
            this.locX.addReferenceModifier(new Modifiers.LinearRate(now, deltaX));
            this.locY.addOffsetModifier(new Modifiers.SineWave(now, limit, duration));
        }
        if (deltaY) {
            this.locY.addReferenceModifier(new Modifiers.LinearRate(now, deltaY));
            this.locX.addOffsetModifier(new Modifiers.SineWave(now, limit, duration));
        }
    }

    speed(deltaX, deltaY, duration, now, callback = false) {
	if (deltaX == "stop") {
             this.stop();
             return;
        } // else
        if (deltaX) {
            if (callback) { callback(1); }
            this.locX.addReferenceModifier(new Modifiers.LinearRate(now, deltaX, duration, callback));
        }
        if (deltaY) {
            if (callback) { callback(1); }
            this.locY.addReferenceModifier(new Modifiers.LinearRate(now, deltaY, duration, callback));
        }
    }

    move(newX, newY, relative, speed, duration, now, callback = false) {
        if (duration == 0) {
            duration = false;
        }
        // ensure correct coordinates
        if (relative) {
            if (newX !== false) { newX += this.locX.value() };
            if (newY !== false) { newY += this.locY.value() };
        }
        if (speed === false && duration === false) { // just a plain move
            if (newX !== false) { this.locX.setValue(newX) };
            if (newY !== false) { this.locY.setValue(newY) };
        } else if (duration) { // calculate the required rates
            if (newX !== false) { 
                const rateX = (newX - this.locX.value()) / duration;
                if (callback) { callback(1); }
                this.locX.addReferenceModifier(new Modifiers.LinearRate(now, rateX, duration, callback));
            }
            if (newY !== false) { 
                if (callback) { callback(1); }
                const rateY = (newY - this.locY.value()) / duration;
                this.locY.addReferenceModifier(new Modifiers.LinearRate(now, rateY, duration, callback));
            }
        } else { // speed !== false, calculate the required duration and component speeds
            let duration = 0;
            if (newX === false) {
                duration = Math.abs((this.locY.value() - newY) / speed);
                if (callback) { callback(1); }
                this.locX.addReferenceModifier(new Modifiers.LinearRate(now, speed, duration, callback));
            } else if (newY === false) {
                duration = Math.abs((this.locX.value() - newX) / speed);
                if (callback) { callback(1); }
                this.locY.addReferenceModifier(new Modifiers.LinearRate(now, speed, duration, callback));
            } else { // need to split the speed into x and y components
                // first calculate the duration, based on the distance and speed
                const moveDistance = Math.sqrt((newX - this.locX.value())**2 + (newY - this.locY.value())**2);
                duration = Math.abs(moveDistance / speed);
                // now calculate the x and y components based on this duration
                const xSpeed = (newX - this.locX.value()) / duration;
                const ySpeed = (newY - this.locY.value()) / duration;
                if (callback) { callback(2); }
                this.locX.addReferenceModifier(new Modifiers.LinearRate(now, xSpeed, duration, callback));
                this.locY.addReferenceModifier(new Modifiers.LinearRate(now, ySpeed, duration, callback));
            }
        }
    }

    accelerate(accelX, accelY, targetX = false, targetY = false, duration = 0, now = 0, callback = false) {
        if (accelX == "stop") {
            this.locX.removeModifier(this.accelXModifier);
            this.locY.removeModifier(this.accelYModifier);
            // We set these to null so the garbage collecter can remove the objects
            this.accelXModifier = null;
            this.accelYModifier = null;
            return; 
        }
        if (accelX) {
            if (callback) { callback(1); }
            this.accelXModifier = new Modifiers.Acceleration(now, accelX, targetX, duration, callback);
            this.locX.addReferenceModifier(this.accelXModifier);
        }
        if (accelY) {
            if (callback) { callback(1); }
            this.accelYModifier = new Modifiers.Acceleration(now, accelY, targetY, duration, callback);
            this.locY.addReferenceModifier(this.accelYModifier);
        }
    }

    setView(x, y, w, h, dur_type, duration, now, callback = false) {
        if (dur_type == "stop") {
            this.windowed = false;
// TBD Why are we doing this ForceValue...? Does removeModifier change values?
            this.viewX.removeModifier(this.viewXModifier);
            this.viewX.forceValue(this.viewX.value());
            this.viewY.removeModifier(this.viewYModifier);
            this.viewY.forceValue(this.viewY.value());
            this.viewWidth.forceValue(this.viewWidth.value());
            this.viewWidth.removeModifier(this.viewWidthModifier);
            this.viewHeight.forceValue(this.viewHeight.value());
            this.viewHeight.removeModifier(this.viewHeightModifier);
            this.viewXModifier = null;
            this.viewYModifier = null;
            this.viewWidthModifier = null;
            this.viewHeightModifier = null;
        } else {
            this.windowed = true;
            // we set in motion up to 4 changes
            if (callback) { callback(4) }
            this.viewXModifier = new Modifiers.LinearTarget(now, x, duration, callback);
            this.viewX.addReferenceModifier(this.viewXModifier);
            this.viewYModifier = new Modifiers.LinearTarget(now, y, duration, callback);
            this.viewX.addReferenceModifier(this.viewXModifier);
            this.viewWidthModifier = new Modifiers.LinearTarget(now, w, duration, callback);
            this.viewWidth.addReferenceModifier(this.viewWidthModifier);
            this.viewHeightModifier = new Modifiers.LinearTarget(now, h, duration, callback);
            this.viewHeight.addReferenceModifier(this.viewHeightModifier);
        }
        this.origX = w;
        this.origY = h;
    }

    setScroll(dx, dy, now) {
        if (dx == 0) {
            this.viewX.removeModifier(this.scrollXModifier);
            this.scrollXModifier = null;
        } else {
            // we need to move dx pixels per second until we get to
            // twice the size of the image (as we mirror it)
            // then reset to 0. This is a sawtooth wave
            const period = (this.origX * 2) / dx;
            this.scrollXModifier = new Modifiers.Sawtooth(now, this.origX * 2, period);
            this.viewX.addOffsetModifier(this.scrollXmodifier);
        }
        if (dy == 0) {
            this.viewY.removeModifier(this.scrollYModifier);
            this.scrollYModifier = null;
        } else {
            const period = (this.origY * 2) / dx;
            this.scrollYModifier = new Modifiers.Sawtooth(now, this.origY * 2, period);
            this.viewY.addOffsetModifier(this.scrollYmodifier);
        }
    }

    rotate(turn_type, value, dur_type, duration, now, callback = false) {
        if  (turn_type == "stop") {
            this.angle.removeModifier(this.angleModifier);
            this.angleModifier = null;
            return;
        } // else
        let newValue = 0;
        if (turn_type == "to") {
            newValue = value;
        } else if (turn_type == "by") {
            newValue = this.angle.value() + value;
        } // add "at"
        if (duration) {
            if (callback) { callback(1) }
            this.angleModifier =  new Modifiers.LinearTarget(now, newValue, duration, callback); 
            this.angle.addReferenceModifier(this.angleModifier);
        } else {
            this.angle.setValue(newValue);
        }
    }

    pivotPoint(pivotX, pivotY, duration, now, callback = false) {
        if (callback) { callback(2) }
        this.pivotX.stop();
        this.pivotY.stop();
        this.pivotX.addReferenceModifier(new Modifiers.LinearTarget( now, pivotX, duration, callback));
        this.pivotY.addReferenceModifier(new Modifiers.LinearTarget( now, pivotY, duration, callback)); 
    }

    setTransparency(target, duration, fade_type, now, callback = false) {
        switch (fade_type) {
            case "stop":
                this.transparency.removeModifier(this.fadeModifier);
                this.fadeModifier = null;
                return;
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
        if (duration) {
            if (callback) { callback(1) }
            this.fadeModifier = new Modifiers.LinearTarget(now, target, duration, callback);
            this.transparency.addReferenceModifier(this.fadeModifier);
        } else {
            this.transparency.setValue(target);
        }
    }

    setBlur(target, duration, blur_type, now, callback = false) {
        switch (blur_type) {
            case "reset":
                this.bluriness.removeModifier(this.blurinessModifier);
                this.blurinessModifier = null;
                this.blurFilter = null;
                this.bluriness.setValue(0);
                return;
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
        if (this.blurFilter == null) {
            this.blurFilter = new PIXI.BlurFilter();
        }
        if (duration) {
            if (callback) { callback(1) }
            this.blurinessModifier = new Modifiers.LinearTarget(now, target, duration, callback);
            this.bluriness.addReferenceModifier(this.blurinessModifier);
        } else {
            this.bluriness.setValue(target);
        }
    }

    setTintColour(value) {
        if (value == "stop") {
            this.tintColour = null;
        } else {
            this.tintColour = value;
        }
        this.newTint = true;
    }

    setTintLevel(target, duration, now, callback = false) {
        if (target == "stop") {
            this.tintColour = null;
            this.tintValue.setValue(0);
            this.tint.removeModifier(this.tintModifier);
            this.tintModifier = null;
        } else {
            if (duration > 0) {
                if (callback) {
                    callback(1)
                }
                this.tintModifier = new Modifiers.LinearTarget(now, target, duration, callback);
                this.tintValue.addReferenceModifier(this.tintModifier);
            } else {
                this.tintValue.setValue(target);
            }
        }
        this.newTint = true;
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
        this.blinkModifier = new Modifiers.SquareWave(now, 0.1, 0.1, 1, flashCount);
        this.visible.setValue(0);
        this.visible.addOffsetModifier(this.blinkModifier);
    }

    jiggle(now, x, y, step, chance) {
        if (now == "stop") {
            this.locX.removeModifier(this.jiggleXmodifier);
            this.locY.removeModifier(this.jiggleYmodifier);
            this.jiggleXModifier = null;
            this.jiggleYModifier = null;
            return;
        }
        if (x > 0) {
            this.jiggleXmodifier = new Modifiers.RandomWalk(now, x, step, defaults.SPRITE_RATE, chance);
            this.locX.addOffsetModifier(this.jiggleXmodifier);
        } 
        if (y > 0) {
            this.jiggleYmodifier = new Modifiers.RandomWalk(now, y, step, defaults.SPRITE_RATE, chance);
            this.locY.addOffsetModifier(this.jiggleYmodifier);
        } 
    }

    wave (max, rate, chance, now) {
        if (max == "stop") {
            this.skewY.removeModifier(this.waveModifier);
            this.waveModifier = null;
            return;
        } // else 
        this.swayModifier = new Modifiers.RandomWalk(now, max, max / 4, defaults.SPRITE_RATE, chance);
        this.skewY.addOffsetModifier(this.waveModifier);
    }

    sway(max, rate, chance, now) {
        if (max == "stop") {
            this.skewX.removeModifier(this.swayModifier);
            this.swayModifier = null;
            return;
        } // else 
        this.swayModifier = new Modifiers.RandomWalk(now, max, max / 4, defaults.SPRITE_RATE, chance);
        this.skewX.addOffsetModifier(this.swayModifier);
    }

    flicker(d, chance, now) {
        if (d == "stop" || d == 0) {
            this.transparency.removeModifier(this.flickerModifier);
            this.flickerModifier = null;
            return;
        } // else
        this.flickerModifier = new Modifiers.RandomWalk(now, d, d/4, 10, defaults.SPRITE_RATE, chance);
        this.transparency.addOffsetModifier(this.flickerModifier);
    }

    throw(angle, initialVelocity, now = 0, callback = false) {
        if (angle == "stop") {
            this.falling = false;
            this.removeModifier(this.throwModifier);
            this.throwModifier = null;
            this.stop();
            return;
        } // else
        const radians = angle * Math.PI / 180;
        const componentX = initialVelocity * Math.sin(radians);
        const componentY = initialVelocity * Math.cos(radians) * -1; // grows downwards
        this.speed(componentX, componentY, false, now, callback);
        this.throwModifier = new Modifiers.Acceleration(now, this.scene.gravity, false, false, callback);
        this.falling = true;
        this.landed = false;
    }

    blink(now, rate, chance) {
        if (now == "stop") {
            this.visible.removeModifier(this.blinkModifier);
            this.blinkModifier = null;
            this.visible.setValue(1);
            return;
        }
        this.blinkModifier = new Modifiers.SquareWave(now, 1/rate, 1/rate, 1);
        this.visible.setValue(0);
        this.visible.addOffsetModifier(this.blinkModifier);
    }

    pulse(now, rate, pulseMin, pulseMax) {
        if (now == "stop") {
            this.transparency.removeModifier(this.pulseModifier);
            this.pulseModifier = null;
            this.transparency.setValue(100);
            return;
        }
        // this.constantModifier = new Modifiers.Constant(now, pulseMin + ((pulseMax - pulseMin) / 2));
        const limit = (pulseMax - pulseMin) / 2;
        this.transparency.setValue(pulseMin + limit);
        // this.transparency.addOffsetModifier(this.constantModifier);
        this.pulseModifier = new Modifiers.TriangleWave(now, limit, 1 / rate);
        this.transparency.addOffsetModifier(this.pulseModifier);
    }

    setVisibility( visible ) {
        if (visible === true) {
            this.visible.setValue(1);
        } else if (visible === false) {
            this.visible.setValue(0);
        } else if (visible == "toggle") {
            if (this.visible.value() == 0) {
                this.visible.setValue(1);
            } else {
                this.visible.setValue(0);
            }
        }
        if (this.piSprite != null) {
            this.piSprite.visible = this.visible.value();
        }
    }

    setCircle(radius, period, direction, now) {
        if (radius == "stop") {
            this.locX.removeModifier(this.locXCircleModifier);
            this.locY.removeModifier(this.locYCircleModifier);
            return;
        } // else
            // TBD How to do the rotation counterclockwise?
        this.locXCircleModifier = new Modifiers.CosineWave(now, radius, period);
        this.locX.addOffsetModifier(this.locXCircleModifier);
        this.locYCircleModifier = new Modifiers.SineWave(now, radius, period);
        this.locY.addOffsetModifier(this.locYCircleModifier);
    }
        

    setSpin(spinRate, now) {
        if (spinRate == "stop") {
            this.angle.removeModifier(this.spinModifier);
            this.spinModifier = null;
            return;
        } // else
        this.spinModifier = new Modifiers.Sawtooth(now, 360, spinRate);
        this.angle.addOffsetModifier(this.spinModifier);
    }

    resetSize() {
        this.sizeX.setValue(this.origX);
        this.sizeY.setValue(this.origY);
    }

    setScale(scaleX, scaleY, command, toOrBy, duration, now, callback = false) {
        if (scaleX == "reset") {
            this.scaleX.removeModifier(this.scaleXModifier);
            this.scaleY.removeModifier(this.scaleYModifier);
            this.scaleXModifier = null;
            this.scaleYModifier = null;
            this.scaleX.setValue(1);
            this.scaleY.setValue(1);
            return;
        } // else
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
        if (duration) {
		if (callback) { callback(2) }
		this.scaleXModifier = new Modifiers.LinearTarget(now, scaleX / 100, duration, callback);
		this.scaleYModifier = new Modifiers.LinearTarget(now, scaleY / 100, duration, callback);
		this.scaleX.addReferenceModifier(this.scaleXModifier);
		this.scaleY.addReferenceModifier(this.scaleYModifier);
        } else {
                this.scaleX.setValue(scaleX / 100);
                this.scaleY.setValue(scaleY / 100);
        }
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
        if (callback) { callback(2); }
        this.warpXModifier = new Modifiers.LinearTarget(now, centerX, duration, callback);
        this.locX.addOffsetModifier(this.warpXModifier);
        this.warpYModifier = new Modifiers.LinearTarget(now, centerY, duration, callback);
        this.locY.addOffsetModifier(this.warpYModifier);
        for (let i = 0; i < targetPoints.length; i += 2) {
            this.warpCorners[i].addReferenceModifier(new Modifiers.LinearTarget(now, targetPoints[i] - centerX, duration));
            this.warpCorners[i + 1].addReferenceModifier(new Modifiers.LinearTarget(now, targetPoints[i + 1] - centerY, duration));
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
        this.warpCorners = [
            new Adjustable2(0), new Adjustable2(0),
            new Adjustable2(0), new Adjustable2(0),
            new Adjustable2(0), new Adjustable2(0),
            new Adjustable2(0), new Adjustable2(0)
        ];
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

    applySize() {
        let width = 0;
        let height = 0;
        switch (this.sizeType) {
            case "stop":
                this.sizeX.removeModifier(this.sizeXModifier);
                this.sizeY.removeModifier(this.sizeYModifier);
                this.sizeXModifier = null;
                this.sizeYModifier = null;
                return;
            case "size":
                width = this.dimension1;
                height = this.dimension2;
                if (this.sizeRelative) {
                    width += this.sizeX.value();
                    height += this.sizeY.value();
                }
                break;
            case "width":
                width = this.dimension1;
                height = (width / this.origX) * this.origY;
                break;
            case "height":
                height = this.dimension1;
                width = (height / this.origY) * this.origX;
                break;
            case "scale":
                width = (this.dimension1 / 100) * this.origX;
                height = (this.dimension2 / 100) * this.origY;
                break;
            case "image":
                width = this.dimension1;
                height = this.dimension2;
                break;
            case "reset":
                width = this.origX;
                height = this.origY;
                break;
            default: 
                break;
        }
        if (this.sizeRate) {
            // (future: rate-based resizing)
        }
        if (this.sizeDuration) {
		this.sizeXModifier = new Modifiers.LinearTarget(this.sizeStart, width, this.sizeDuration, this.sizeCallback);
                this.sizeX.addReferenceModifier(this.sizeXModifier);
		this.sizeYModifier = new Modifiers.LinearTarget(this.sizeStart, height, this.sizeDuration, this.sizeCallback);
                this.sizeY.addReferenceModifier(this.sizeYModifier);
        } else {
                this.sizeX.setValue(width);
                this.sizeY.setValue(height);
        }
        this.sizeType = false; // mark as actioned
    }

    setFromBounds(what) {
        if (this.type != constants.SPRITE_GROUP) {
            return;
        }
        // Get the new group size
        const bounds = this.piSprite.getLocalBounds();
        switch(what) {
            case "orig":
                this.origX = bounds.width / this.scaleX.value();
                this.origY = bounds.height / this.scaleY.value();
                break;
            case "size":
                this.sizeX.forceValue(bounds.width);
                this.sizeY.forceValue(bounds.height);
                break;
            case "all":
                this.sizeX.forceValue(bounds.width);
                this.sizeY.forceValue(bounds.height);
                this.origX = bounds.width / this.scaleX.value();
                this.origY = bounds.height / this.scaleY.value();
                break;
        }
        // Globals.log.report(`${message} local bounds ${bounds.width}  ${bounds.height}`);
        // const size = this.piSprite.getSize();
        // Globals.log.report(`${message} size ${size.width}  ${size.height}`);
        // // this.sizeX.forceValue(bounds.width);
        // this.sizeY.forceValue(bounds.height);
    }

    callback() {
        return (event) => {
            this.clickX = Math.round(event.global.x);
            this.clickY = Math.round(event.global.y);
            this.event = true;
        };
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
        
    update(sceneName, now, loadOnly = false) {
        // First, do we need to load an image (and can we?)
        if (this.type == constants.SPRITE_IMAGE && this.placed && !this.loaded) { // no image loaded yet
            let image = SGImage.getImage(sceneName, this.imageName);
            if (image === null) { // no image found, piSprite will remain null
                return;
            } else if (image != "loading") { // now ready
                const imgWidth = image.piImage.width;
                const imgHeight = image.piImage.height;
                this.sizeX.setValue(imgWidth); // might get overwritten later
                this.sizeY.setValue(imgHeight);
                this.origX = imgWidth;
                this.origY = imgHeight;
                // Are we in a specific location?
                if (this.role != null) {
                    // Yes, but we need the image size to work out scaling
                    const targetWidth = Globals.scriptWidth;
                    const targetHeight = Globals.scriptHeight;
                    const aspectX = targetWidth / imgWidth;
                    const aspectY = targetHeight / imgHeight;
                    let depth = null;
                    switch ( this.role ) {
                        case "background": // centre, and scale to window size
                        case "backdrop": // centre, and scale to window size
                            this.locX.setValue(targetWidth / 2);
                            this.locY.setValue(targetHeight / 2);
                            this.sizeX.setValue(targetWidth);
                            this.sizeY.setValue(targetHeight);
                            depth = defaults.DEPTH_BACKGROUND;
                            break;
                        case "left":
                            this.locX.setValue(imgWidth / 2);
                            this.locY.setValue(targetHeight / 2);
                            this.sizeX.setValue(aspectY * imgWidth);
                            this.sizeY.setValue(aspectY * imgHeight);
                            depth = defaults.DEPTH_LEFT;
                            break;
                        case "right":
                            this.locX.setValue(targetWidth - (imgWidth / 2));
                            this.locY.setValue(targetHeight / 2);
                            this.sizeX.setValue(aspectY * imgWidth);
                            this.sizeY.setValue(aspectY * imgHeight);
                            depth = defaults.DEPTH_RIGHT;
                            break;
                        case "top":
                        case "sky":
                            this.locX.setValue(targetWidth / 2);
                            this.locY.setValue(imgHeight / 2);
                            this.sizeX.setValue(aspectX * imgWidth);
                            this.sizeY.setValue(aspectX * imgHeight);
                            depth = defaults.DEPTH_SKY;
                            break;
                        case "bottom":
                        case "ground":
                        case "foreground":
                            this.locX.setValue(targetWidth / 2);
                            this.locY.setValue(targetHeight - (imgHeight / 2));
                            this.sizeX.setValue(aspectX * imgWidth);
                            this.sizeY.setValue(aspectX * imgHeight);
                            depth = this.role == "ground" ? defaults.DEPTH_GROUND : defaults.DEPTH_FOREGROUND;
                            break;
                    }
                    if (this.depth == null ) {
                        this.depth = depth;
                    }
                } else { // set size as per request
                    if (this.sizeType == "image") {
                        this.dimension1 = imgWidth;
                        this.dimension2 = imgHeight;
                    }
                    this.applySize();
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
                    this.sizeX.setValue(imgWidth / image.cols);
                    this.sizeY.setValue(imgHeight / image.rows);
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
                    this.origX = this.viewWidth.value();
                    this.origY = this.viewHeight.value();
                    if (this.sizeType && this.sizeType != "image") { // been given a different size
                        this.applySize(this.dimensionType, this.dimension1, this.dimension2,
                                    "to", null, this.deferredDuration, this.deferredNow, this.deferredCallback);
                    } else { // use window size
                        this.sizeX.setValue(this.viewWidth.value());
                        this.sizeY.setValue(this.viewHeight.value());
                    }
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
                // this.origX = this.sizeX.value();
                // this.origY = this.sizeY.value();
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
                        Globals.log.error("trying to set zero size on load of " + this.name);
                    } else {
                        this.piSprite.setSize(newX, newY);
                    }
                }
                this.image = image;
                this.loaded = true;
                // End image loading updates
            } // else, still loading, try again later
        } else if (this.type == constants.SPRITE_GROUP && this.placed && !this.loaded) {
                // A group has been placed but we haven't calculated the size yet
                this.setFromBounds("all");
                this.applySize(this.dimensionType, this.dimension1, this.dimension2,
                            "to", null, this.deferredDuration, this.deferredNow, this.deferredCallback);
                this.loaded = true;
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
        if (this.image != null && this.image.cols > 0) {
            // Are we animated?
            if (this.animationRate > 0) {
                if ((now - this.lastFrameChange) > 1000 / this.animationRate) {
                    this.currentFrame += 1;
                    this.lastFrameChange = now;
                }
            }
            // Do we need to update the frame?
            if (this.currentFrame != this.lastFrame) {
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
        }
        // Is our window moving?
        if (this.windowed) {
            const updateViewX = this.viewX.updateValue();
            const updateViewY = this.viewY.updateValue();
            const updateViewWidth = this.viewWidth.updateValue();
            const updateViewHeight = this.viewHeight.updateValue();
            if (updateViewHeight || updateViewWidth || updateViewX || updateViewY) {
                if (this.piSprite !== null) {
                    this.piSprite.texture.frame = new PIXI.Rectangle(this.viewX.value(), this.viewY.value(),
                                    this.viewWidth.value(), this.viewHeight.value());
                    this.piSprite.texture.update();
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
                    this.piSprite.position.set(this.locX.value() * Globals.scriptScaleX, this.locY.value() * Globals.scriptScaleY);
                }
            }
        }
        // Bounds checking
        if (Math.abs(this.locX.value() * Globals.scriptScaleX) > (Globals.displayWidth * defaults.BOUNDS_X)
              || Math.abs(this.locY.value() *Globals.scriptScaleY) > (Globals.displayHeight * defaults.BOUNDS_Y))  {
            this.falling = false; 
            this.landed = true;
            this.locX.stop();
            this.locY.stop();
            return;
        }    
        // thrown and hit the ground
        if (this.falling && this.locY.value() > this.scene.groundLevel) {
            this.falling = false; 
            this.landed = true;
            this.locX.stop();
            this.locY.stop();
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
            // Have we had a size change requested?
            if (this.sizeType) {
                this.applySize();
                forceUpdate = true;
            }
            const changeSX = this.scaleX.updateValue();
            const changeSY = this.scaleY.updateValue();
            // update size
            const changeX = this.sizeX.updateValue();
            const changeY = this.sizeY.updateValue();
            if ((forceUpdate || changeSX || changeSY || changeX || changeY)) {
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
         
        // Has our visibilty changed?
        if (this.visible.updateValue()) {
            if (this.piSprite !== null ) { // image has been loaded
                this.piSprite.visible = this.visible.value();
            }
        }

        // Or are we blurring?
        if (this.bluriness.updateValue()) {
            if (this.piSprite !== null ) { // image has been loaded
                if (this.piSprite.filters == null) {
                    this.piSprite.filters = [ this.blurFilter ];
                } // need to modity this if we need more filter types
                if (this.piSprite.blurFilter != null) {
                    this.blurFilter.strength = this.bluriness.value() / 10;
                }
            }
        }

        // or are we skewing?
        {
            const changeSkewX = this.skewX.updateValue();
            const changeSkewY = this.skewY.updateValue();
            if (changeSkewX || changeSkewY) {
                this.piSprite.skew.x = this.skewX.value() * (Math.PI / 180);
                this.piSprite.skew.y = this.skewY.value() * (Math.PI / 180);
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

    static getSprite(sceneName, name, report = true) {
        if (!name) {
            Globals.log.error("bad sprite name - ");
            return false;
        }
        let parts = name.split(":");
        if (parts.length > 1) {
            sceneName = parts[0];
            name = parts[1];
        }
        for ( let i = 0; i < Globals.scenes.length; i++ ) {
            if (Globals.scenes[i].name == sceneName) {
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
            Globals.log.error("No sprite found- " + sceneName + ":" + name);
        }
        return(false);
    }

    static deleteSprite(sceneName, name, report = false) {
        if (!name) {
            return false;
        }
        let parts = name.split(":");
        if (parts.length > 1) {
            sceneName = parts[0];
            name = parts[1];
        }
        for ( let i = 0; i < Globals.scenes.length; i++ ) {
            if (Globals.scenes[i].name == sceneName) {
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
            Globals.log.error("No sprite found- " + sceneName + ":" + name);
        }
        return false;
    }
}
