
import { Adjustable } from "./adjustable.js";
import defaults from "./defaults.js";
import { Globals } from "./globals.js";
import * as constants from './constants.js';

function getImage(scene, tag) {
    let parts = tag.split(":");
    if (parts.length > 1) {
        scene = parts[0];
        tag = parts[1];
    }
    for ( let i = 0; i < Globals.scenes.length; i++ ) {
        if (Globals.scenes[i].name == scene) {
            for ( let j = 0; j < Globals.scenes[i].images.length; j++ ) {
                if (Globals.scenes[i].images[j].name == tag) {
                    if (Globals.scenes[i].images[j].loading) {
                        return("loading");
                    } else {
                        return(Globals.scenes[i].images[j]);
                    }
                }
            }
        }
    }
    Globals.log.error("No image found- " + scene + ":" + tag);
    return(null);
}

/**************************************************************************************************
 #####   #####                                        
#     # #     #         # #    #   ##    ####  ###### 
#       #               # ##  ##  #  #  #    # #      
 #####  #  ####         # # ## # #    # #      #####  
      # #     #         # #    # ###### #  ### #      
#     # #     #         # #    # #    # #    # #      
 #####   #####          # #    # #    #  ####  ###### 
                #######                               
**************************************************************************************************/

export class SGImage {
    constructor(data, tag) {
        this.name = tag;
        if (typeof data === "string") {
            this.pi_image = null;
            this.loading = true;
            this.url = data;
        } else { // must be text - careful if new types added!
            this.pi_image = data;
            this.loading = false;
            this.url = null;
        }
    }

    async load_image() {
        this.pi_image = await PIXI.Assets.load(this.url);
        this.loading = false;
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
    constructor(imageName, spriteName = imageName, type = constants.SPRITE_IMAGE) {
        // We duplicated a lot of sprite properties so that we can manipulate independently
        // of whether the PI sprite has been created yet (e.g. waiting for the image to
        // load) and also in case we want to switch to a different rendering engine at a
        // future date.
        // Identification
        this.type = type;
        this.imageName = imageName;
        this.name = spriteName
        this.image_portion = null;
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
        this.scaleX = new Adjustable(0);
        this.scaleY = new Adjustable(0);
        this.flipH = false;
        this.flipV = false;
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
        // debugging
        // this.logged = false;

    }

    setPosition(x, y, depth = 0) {
        this.locX.setTargetValue(x)
        this.locY.setTargetValue(y);
        this.setDepth("to", depth);
    }

    setDepth(depth_type, value) {
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
            newX += this.locX.value();
            newY += this.locY.value();
        }
        if (in_or_at == "at") {
            // to be done...
        }
        this.locX.setTargetValue(newX, duration, now, callback);
        this.locY.setTargetValue(newY, duration, now); // only need one callback
        this.enabled = true;
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
            this.scaleX.setTargetValue(this.flipH ? 1 : -1);
            this.scaleY.setTargetValue(1);
            this.flipH = !this.flipH;
        } else if (axis == "v") {
            this.scaleX.setTargetValue(1);
            this.scaleY.setTargetValue(this.flipV ? 1 : -1);
            this.flipV = !this.flipV;
        } else if (axis == "r") { // reset
            this.scaleX.setTargetValue(this.flipH ? 1 : -1);
            this.scaleY.setTargetValue(this.flipV ? 1 : -1);
            this.flipV = false;
            this.flipH = false;
        }
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

    resetFont() {
        this.sizeX.setTargetValue(this.pi_image.orig.width);
        this.sizeY.setTargetValue(this.pi_image.orig.height);
    }


    scale(new_w, newH, duration, now, callback) {
        const old_w = this.sizeX.value();
        const oldH = this.sizeY.value();
        if (new_w < 1) {
            new_w = newH;
        }
        if (newH < 1) {
            newH = new_w;
        }
        this.sizeX.setTargetValue(old_w * new_w / 100, duration, now, callback);
        this.sizeY.setTargetValue(oldH * newH / 100);
    }
        



    update(scene, now) {
        if (!this.enabled) {
            return;
        }
        // First, do we need to load an image (and can we?)
        if (this.type == constants.SPRITE_IMAGE && 
                (this.piSprite === null || this.piSprite.texture == PIXI.Texture.EMPTY)) { // no image loaded
            let image = getImage(scene, this.imageName);
            if (image === null) { // doesn't exist, give up
                this.enabled = false;
                return;
            }
            if (image != "loading") { // now ready
                const img_width = image.pi_image.width;
                const imgHeight = image.pi_image.height;
                // Are we in a specific location?
                if (this.role != null) {
                    // Yes, but we need the image size to work out scaling
                    const wdw_width = Globals.app.screen.width;
                    const wdwHeight = Globals.app.screen.height;
                    const scaleY = imgHeight / wdwHeight ;
                    const scaleX = img_width / wdw_width ;
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
                            this.sizeX.setTargetValue(scaleY * img_width);
                            this.sizeY.setTargetValue(scaleY * imgHeight);
                            depth = defaults.DEPTH_LEFT;
                            break;
                        case "right":
                            this.locX.setTargetValue(wdw_width - (img_width / 2));
                            this.locY.setTargetValue(wdwHeight / 2);
                            this.sizeX.setTargetValue(scaleY * img_width);
                            this.sizeY.setTargetValue(scaleY * imgHeight);
                            depth = defaults.DEPTH_RIGHT;
                            break;
                        case "top":
                        case "sky":
                            this.locX.setTargetValue(wdw_width / 2);
                            this.locY.setTargetValue(imgHeight / 2);
                            this.sizeX.setTargetValue(scaleX * img_width);
                            this.sizeY.setTargetValue(scaleX * imgHeight);
                            depth = defaults.DEPTH_SKY;
                            break;
                        case "bottom":
                        case "ground":
                        case "foreground":
                            this.locX.setTargetValue(wdw_width / 2);
                            this.locY.setTargetValue(wdwHeight - (imgHeight / 2));
                            this.sizeX.setTargetValue(scaleX * img_width);
                            this.sizeY.setTargetValue(scaleX * imgHeight);
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
                const fullTexture = new PIXI.Texture(image.pi_image);
                let texture = null;
                if (this.image_portion) {
                    texture = new PIXI.Texture({
                        source: fullTexture.source,
                        frame: this.image_portion,
                    });
                } else {
                    texture = fullTexture;
                }
                this.piSprite = new PIXI.Sprite({
                            texture: texture,
                            anchor: 0.5,
                            position: {x: this.locX.value(),
                                y: this.locY.value() },
                            visible: this.visible,
                            }); 
                // set depth to next highest, unless it is already set
                this.depth = Globals.nextZ(this.depth);
                this.piSprite.zIndex = this.depth;
                this.piSprite.tint = this.currentTint();
                this.piSprite.setSize(this.sizeX.value(), this.sizeY.value());
                if (this.sgParent) {
                    const parentGroup = SGSprite.getSprite(this.name, this.sgParent);
                    parentGroup.piSprite.addChild(this.piSprite);
                } else {
                    Globals.root.addChild(this.piSprite);
                }
            } // else, still loading, try again later
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
            // if (!this.logged) {
            //     Globals.log.report(`Initial deltas ${deltaX} ${deltaY}`);
            //     this.logged = true;
            // }
            if (((Math.abs(deltaX) > Globals.app.screen.width * 2) || (Math.abs(deltaY) > Globals.app.screen.height * 2)) ||
                (Globals.ground_level > 0 && this.locY.value + deltaY > Globals.ground_level)) {
                this.falling = false; // gone off the edge of the world or hit the ground
                this.visible = false; 
                this.enabled = false;
                if (this.throwCallback != null) {
                    this.throwCallback();
                }
            }
            if (this.piSprite !== null ) { // image has been loaded
                this.piSprite.position.set(this.locX.value() + deltaX, this.locY.value() + deltaY);
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

        // update size
        // can't test both in same expression because of short-circuiting
        changeX = this.sizeX.updateValue();
        changeY = this.sizeY.updateValue();
        if (changeX || changeY) {
            if (this.piSprite !== null ) { // image has been loaded
                this.piSprite.setSize(this.sizeX.value(), this.sizeY.value());
                // this may have changed the scaling, so update it
                // this.scaleX.forceValue(this.piSprite.scale.x);
                // this.scaleY.forceValue(this.piSprite.scale.y);
            }
        }
        
        // update scale
        // can't test both in same expression because of short-circuiting
        changeX = this.scaleX.updateValue();
        changeY = this.scaleY.updateValue();
        if (changeX || changeY) {
            if (this.piSprite !== null ) { // image has been loaded
                this.piSprite.scale.set(this.scaleX.value(), this.scaleY.value());
                // Force the size back to what we want
                this.piSprite.setSize(this.sizeX.value(), this.sizeY.value());
                // this may have changed the size, so update it
                // this.sizeX.forceValue(this.piSprite.size.x);
                // this.sizeY.forceValue(this.piSprite.size.y);
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
    }

    static getSprite(scene, tag, report = true) {
        if (!tag) {
            Globals.log.error("bad sprite name - ");
            return false;
        }
        let parts = tag.split(":");
        if (parts.length > 1) {
            scene = parts[0];
            tag = parts[1];
        }
        for ( let i = 0; i < Globals.scenes.length; i++ ) {
            if (Globals.scenes[i].name == scene) {
                for ( let j = 0; j < Globals.scenes[i].sprites.length; j++ ) {
                    // Only return sprites from scenes that are currently running
                    if (!(Globals.scenes[i].state == constants.SCENE_STOPPED) && Globals.scenes[i].sprites[j].name == tag) {
                        return(Globals.scenes[i].sprites[j]);
                    }
                }
            }
        }
        if (report) {
            Globals.log.error("No sprite found- " + scene + ":" + tag);
        }
        return(false);
    }

    static remove_sprite(scene, tag, report = false) {
        if (!tag) {
            return false;
        }
        let parts = tag.split(":");
        if (parts.length > 1) {
            scene = parts[0];
            tag = parts[1];
        }
        for ( let i = 0; i < Globals.scenes.length; i++ ) {
            if (Globals.scenes[i].name == scene) {
                for ( let j = 0; j < Globals.scenes[i].sprites.length; j++ ) {
                    if (Globals.scenes[i].sprites[j].tag == tag) {
                        Globals.scenes[i].sprites[j].piSprite.destroy();
                        Globals.scenes[i].sprites.splice(j,1);
                        return true;
                    }
                }
            }
        }
        if (report) {
            Globals.log.error("No sprite found- " + scene + ":" + tag);
        }
        return false;
    }
}
