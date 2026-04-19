
import { Adjustable } from "./adjustable";
import defaults from "./defaults.js";
import { Globals } from "./globals.js";

function get_image(scene, tag) {
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

export class SG_image {
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

export class SG_sprite {
    constructor(image_tag, sprite_tag = image_tag, type = defaults.SPRITE_IMAGE) {
        // We duplicated a lot of sprite properties so that we can manipulate independently
        // of whether the PI sprite has been created yet (e.g. waiting for the image to
        // load) and also in case we want to switch to a different rendering engine at a
        // future date.
        // Identification
        this.type = type;
        this.image_tag = image_tag;
        this.name = sprite_tag
        this.image_portion = null;
        // created yet?
        this.pi_sprite = null;
        this.enabled = true;
        // location
        this.loc_x = new Adjustable(0);
        this.loc_y = new Adjustable(0);
        // rotation
        this.angle = new Adjustable(0,0,360);
        // depth
        this.depth = 0;
        // size
        this.size_x = new Adjustable(0);
        this.size_y = new Adjustable(0);
        // scale
        this.scale_x = new Adjustable(0);
        this.scale_y = new Adjustable(0);
        this.flip_h = false;
        this.flip_v = false;
        // visibility
        this.visible = true;
        this.transparency = new Adjustable(100,0,100);
        this.tint_value = new Adjustable(0,0,100);
        this.tint_colour = null;
        this.new_tint = false;
        // usage
        this.role = null;
        // blinking
        this.next_blink = 0;
        this.blink_rate = 0;
        this.blink_chance = 0;
        // pulsing
        this.pulse_rate = 0;
        this.pulse_min = 0;
        this.pulse_max = 0;
        this.pulse_up = true;
        // flashing
        this.flash_count = 0;
        this.next_flash = 0;
        // thrown
        this.throw_vx = 0;
        this.throw_vy = 0; 
        this.throw_time = 0;
        this.falling = false;
        this.throw_callback = null;
        // bluriness
        this.bluriness = new Adjustable(0,0,100);
        this.blur_filter = null;
        // Text features
        this.text_font = 'arial';
        this.text_size = 24;
        this.text_align = "center";
        this.fill_colour = "black";
        this.stroke_colour = "black";
        // skewiness
        this.skew_x = new Adjustable(0);
        this.skew_y = new Adjustable(0);
        // debugging
        // this.logged = false;

    }

    set_pos(x, y, depth = 0) {
        this.loc_x.set_target_value(x)
        this.loc_y.set_target_value(y);
        this.set_depth("to", depth);
    }

    set_depth(depth_type, value) {
        if (depth_type == "by") {
            this.depth += value;
        } else {
            this.depth = value;
        }
        // We don't use depth values below 0
        if (this.depth < 1) {
            this.depth = 1;
        }
        if (this.enabled && this.pi_sprite != null) {
            this.pi_sprite.zIndex = this.depth;
        }
    }

    set_skew(new_x, new_y, to_or_by, duration, now, callback) {
         if (to_or_by == "by") {
            new_x += this.skew_x.value();
            new_y += this.skew_y.value();
        }       
        this.skew_x.set_target_value(new_x, duration, now, callback);
        this.skew_y.set_target_value(new_y, duration, now);
    }

    set_style() {
        if (this.image_tag == defaults.TEXT_NAME) {
            this.pi_sprite.style = {
                fontFamily: this.text_font,
                fontSize: this.text_size,
                fill: this.fill_colour,
                stroke: this.stroke_colour,
                align: this.text_align
            };
        }
    }

    move(new_x, new_y, to_or_by, in_or_at, duration, now, callback) {
        if (to_or_by == "by") {
            new_x += this.loc_x.value();
            new_y += this.loc_y.value();
        }
        if (in_or_at == "at") {
            // to be done...
        }
        this.loc_x.set_target_value(new_x, duration, now, callback);
        this.loc_y.set_target_value(new_y, duration, now); // only need one callback
        this.enabled = true;
    }

    rotate(turn_type, value, dur_type, duration, now, callback) {
        let new_value = 0;
        if (turn_type == "to") {
            new_value = value;
        } else if (turn_type == "by") {
            new_value = this.angle.value() + value;
        } // add "at"
        if (dur_type == "in") {
            this.angle.set_target_value(new_value, duration, now, callback);
        }
    }

    set_trans(target, duration, fade_type, now, callback) {
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
        this.transparency.set_target_value(target, duration, now, callback);
    }

    set_blur(target, duration, blur_type, now, callback) {
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
            if (this.blur_filter == null) {
                this.blur_filter = new PIXI.BlurFilter();
            }
        } else {
            this.blur_filter = null;
        }
        this.bluriness.set_target_value(target, duration, now, callback);
    }

    set_tint(target, duration, now, callback) {
        if (arguments.length == 1) {
            if (target == "stop") {
                this.tint_colour = null;
                this.tint_value.set_target_value(100, 0, now, callback);
            } else {
                this.tint_colour = target;
            }
            this.new_tint = true;
        } else {
            this.tint_value.set_target_value(target, duration, now, callback);
        }
    }

    flip(axis) {
        if (axis == "h") {
            this.scale_x.set_target_value(this.flip_h ? 1 : -1);
            this.scale_y.set_target_value(1);
            this.flip_h = !this.flip_h;
        } else if (axis == "v") {
            this.scale_x.set_target_value(1);
            this.scale_y.set_target_value(this.flip_v ? 1 : -1);
            this.flip_v = !this.flip_v;
        } else if (axis == "r") { // reset
            this.scale_x.set_target_value(this.flip_h ? 1 : -1);
            this.scale_y.set_target_value(this.flip_v ? 1 : -1);
            this.flip_v = false;
            this.flip_h = false;
        }
    }

    current_tint() {
        const shade = Math.round(255 * (100 - this.tint_value.value()) / 100);
        return (shade << 16) | (shade << 8) | shade;
    }

    flash(flash_count, now) {
        this.flash_count = flash_count;
        this.next_flash = now + 100; // 1/10th of second
    }

    jiggle(x, y, rot, chance) {
        if (chance > 0 ) {
            this.loc_x.jiggle_start(x, chance);
            this.loc_y.jiggle_start(y, chance);
            this.angle.jiggle_start(rot, chance);
        } else {
            this.loc_x.jiggle_stop();
            this.loc_y.jiggle_stop();
            this.angle.jiggle_stop();
        }
    }

    wave(max, rate, chance) {
        if (chance < 1 || max < 1) {
            this.skew_y.sway_stop();
        } else {
            this.skew_y.sway_start(max, chance);
        }
    }

    sway(max, rate, chance) {
        if (chance < 1 || max < 1) {
            this.skew_x.sway_stop();
        } else {
            this.skew_x.sway_start(max, rate, chance);
        }
    }

    flicker(d, chance) {
        if (chance > 0) {
            this.transparency.jiggle_start(d, chance);
        } else {
            this.transparency.jiggle_stop();
        }
    }

    throw(angle, initial_velocity, now, callback) {
        if (arguments.length > 3) {
            this.throw_callback = callback;
        }
        if (angle == "stop") {
            this.falling = false;
            if (this.throw_callback != null) {
                this.throw_callback();
            }
        } else {
            this.falling = true;
            const radians = angle * Math.PI / 180;
            this.thrown_vx = initial_velocity * Math.sin(radians);
            this.thrown_vy = initial_velocity * Math.cos(radians) * -1; // y grows downwards
            this.throw_time = now;
        }
    }

    blink(rate, chance, now) {
        this.blink_rate = rate;
        this.blink_chance = chance;
        if ( rate <= 0 ) { // disappear when turning off
            this.visible = false;
        }
        this.next_blink = now + (1000 / this.blink_rate);
    }

    pulse(rate, pulse_min, pulse_max, now) {
        if (rate == 0) {
            this.pulse_rate = 0;
            this.transparency.set_target_value(100);
        } else {
            this.pulse_rate = 1 / rate;
            this.pulse_min = pulse_min;
            this.pulse_max = pulse_max;
            this.transparency.set_target_value(this.pulse_min);
            this.transparency.set_target_value(this.pulse_max, this.pulse_rate, now);
        }
    }

    set_visibility( visible ) {
        if (visible === true) {
            this.visible = true;
        } else if (visible === false) {
            this.visible = false;
        } else if (visible == "toggle") {
            this.visible = !this.visible;
        }
        if (this.enabled && this.pi_sprite != null) {
            this.pi_sprite.visible = this.visible;
        }
    }

    resize(new_w, new_h, to_or_by, in_or_at, duration, now, callback) {
        if (to_or_by == "by") {
            new_w += this.size_x.value();
            new_h += this.size_y.value();
        }
        if (in_or_at == "at") {
            // (future: rate-based resizing)
        }
        this.size_x.set_target_value(new_w, duration, now, callback);
        this.size_y.set_target_value(new_h, duration, now);
    }

    reset_size() {
        this.size_x.set_target_value(this.pi_image.orig.width);
        this.size_y.set_target_value(this.pi_image.orig.height);
    }


    scale(new_w, new_h, duration, now, callback) {
        const old_w = this.size_x.value();
        const old_h = this.size_y.value();
        if (new_w < 1) {
            new_w = new_h;
        }
        if (new_h < 1) {
            new_h = new_w;
        }
        this.size_x.set_target_value(old_w * new_w / 100, duration, now, callback);
        this.size_y.set_target_value(old_h * new_h / 100);
    }
        



    update(scene, now) {
        if (!this.enabled) {
            return;
        }
        // First, do we need to load an image (and can we?)
        if (this.type == defaults.SPRITE_IMAGE && 
                (this.pi_sprite === null || this.pi_sprite.texture == PIXI.Texture.EMPTY)) { // no image loaded
            let image = get_image(scene, this.image_tag);
            if (image === null) { // doesn't exist, give up
                this.enabled = false;
                return;
            }
            if (image != "loading") { // now ready
                const img_width = image.pi_image.width;
                const img_height = image.pi_image.height;
                // Are we in a specific location?
                if (this.role != null) {
                    // Yes, but we need the image size to work out scaling
                    const wdw_width = Globals.app.screen.width;
                    const wdw_height = Globals.app.screen.height;
                    const scale_y = img_height / wdw_height ;
                    const scale_x = img_width / wdw_width ;
                    let depth = null;
                    switch ( this.role ) {
                        case "background": // centre, and scale to window size
                        case "backdrop": // centre, and scale to window size
                            this.loc_x.set_target_value(wdw_width / 2);
                            this.loc_y.set_target_value(wdw_height / 2);
                            this.size_x.set_target_value(wdw_width);
                            this.size_y.set_target_value(wdw_height);
                            depth = defaults.DEPTH_BACKGROUND;
                            break;
                        case "left":
                            this.loc_x.set_target_value(img_width / 2);
                            this.loc_y.set_target_value(wdw_height / 2);
                            this.size_x.set_target_value(scale_y * img_width);
                            this.size_y.set_target_value(scale_y * img_height);
                            depth = defaults.DEPTH_LEFT;
                            break;
                        case "right":
                            this.loc_x.set_target_value(wdw_width - (img_width / 2));
                            this.loc_y.set_target_value(wdw_height / 2);
                            this.size_x.set_target_value(scale_y * img_width);
                            this.size_y.set_target_value(scale_y * img_height);
                            depth = defaults.DEPTH_RIGHT;
                            break;
                        case "top":
                        case "sky":
                            this.loc_x.set_target_value(wdw_width / 2);
                            this.loc_y.set_target_value(img_height / 2);
                            this.size_x.set_target_value(scale_x * img_width);
                            this.size_y.set_target_value(scale_x * img_height);
                            depth = defaults.DEPTH_SKY;
                            break;
                        case "bottom":
                        case "ground":
                        case "foreground":
                            this.loc_x.set_target_value(wdw_width / 2);
                            this.loc_y.set_target_value(wdw_height - (img_height / 2));
                            this.size_x.set_target_value(scale_x * img_width);
                            this.size_y.set_target_value(scale_x * img_height);
                            depth = this.role == "ground" ? defaults.DEPTH_GROUND : defaults.DEPTH_FOREGROUND;
                            break;
                    }
                    if (this.depth == null ) {
                        this.depth = depth;
                    }
                } else { // set size from the image, if not already set
                    if (this.size_x.value() == 0) {
                        this.size_x.set_target_value(img_width);
                    }
                    if (this.size_y.value() == 0) {
                        this.size_y.set_target_value(img_height);
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
                this.pi_sprite = new PIXI.Sprite({
                            texture: texture,
                            anchor: 0.5,
                            position: {x: this.loc_x.value(),
                                y: this.loc_y.value() },
                            visible: this.visible,
                            }); 
                // set depth to next highest, unless it is already set
                this.depth = Globals.nextZ(this.depth);
                this.pi_sprite.zIndex = this.depth;
                this.pi_sprite.tint = this.current_tint();
                this.pi_sprite.setSize(this.size_x.value(), this.size_y.value());
                Globals.root.addChild(this.pi_sprite);
            } // else, still loading, try again later
        }
        // Now update position
        // can't test both in same expression because of short-circuiting
        let change_x = this.loc_x.update_value();
        let change_y = this.loc_y.update_value();
        if (change_x || change_y) {
            if (this.pi_sprite !== null ) { // image has been loaded
                this.pi_sprite.position.set(this.loc_x.value(), this.loc_y.value());
            }
        }
        // Bounds checking
        if ((Math.abs(this.loc_x.value()) > (Globals.width * defaults.BOUNDS_X))
              || (Math.abs(this.loc_y.value()) > (Globals.width * defaults.BOUNDS_Y)) ) {
            this.enabled = false;
            return;
        }    
        // Let's see if we have been thrown...?
        if (this.falling) {
            const falling_time = (now - this.throw_time) / 1000; // elapsed time in seconds
            const delta_x = this.thrown_vx * falling_time * Globals.script_scale_x;
            // gravity is negative because y grows downwards on a canvas
            const delta_y = ((this.thrown_vy * falling_time) - (0.5 * Globals.gravity * -1 * falling_time * falling_time)) * Globals.script_scale_y;
            // if (!this.logged) {
            //     Globals.log.report(`Initial deltas ${delta_x} ${delta_y}`);
            //     this.logged = true;
            // }
            if (((Math.abs(delta_x) > Globals.app.screen.width * 2) || (Math.abs(delta_y) > Globals.app.screen.height * 2)) ||
                (Globals.ground_level > 0 && this.loc_y.value + delta_y > Globals.ground_level)) {
                this.falling = false; // gone off the edge of the world or hit the ground
                this.visible = false; 
                this.enabled = false;
                if (this.throw_callback != null) {
                    this.throw_callback();
                }
            }
            if (this.pi_sprite !== null ) { // image has been loaded
                this.pi_sprite.position.set(this.loc_x.value() + delta_x, this.loc_y.value() + delta_y);
            }
        }
        // Update rotation angle
        if (this.angle.update_value()) {
            if (this.pi_sprite !== null ) { // image has been loaded
                this.pi_sprite.angle = this.angle.value();
            }
        }

        // Update transparency
        if (this.transparency.update_value()) {
            if (this.pi_sprite !== null ) { // image has been loaded
                this.pi_sprite.alpha = this.transparency.value() / 100;
            }
        } else { // if pulsing, switch directions
            if (this.pulse_rate > 0) {
                if (this.pulse_up) {
                    this.transparency.set_target_value(this.pulse_min, this.pulse_rate, now);
                    this.pulse_up = false;
                } else {
                    this.transparency.set_target_value(this.pulse_max, this.pulse_rate, now);
                    this.pulse_up = true;
                }
            }
        }

        // colour tint
        if (this.new_tint) {
            if (this.pi_sprite !== null ) { // image has been loaded
                this.pi_sprite.tint = this.tint_colour;
                this.new_tint = false;
            }
        }

        // darken / lighten
        if (this.tint_value.update_value()) {
            if (this.pi_sprite !== null ) { // image has been loaded
                this.pi_sprite.tint = this.current_tint();
            }
        }

        // update size
        // can't test both in same expression because of short-circuiting
        change_x = this.size_x.update_value();
        change_y = this.size_y.update_value();
        if (change_x || change_y) {
            if (this.pi_sprite !== null ) { // image has been loaded
                this.pi_sprite.setSize(this.size_x.value(), this.size_y.value());
                // this may have changed the scaling, so update it
                // this.scale_x.force_value(this.pi_sprite.scale.x);
                // this.scale_y.force_value(this.pi_sprite.scale.y);
            }
        }
        
        // update scale
        // can't test both in same expression because of short-circuiting
        change_x = this.scale_x.update_value();
        change_y = this.scale_y.update_value();
        if (change_x || change_y) {
            if (this.pi_sprite !== null ) { // image has been loaded
                this.pi_sprite.scale.set(this.scale_x.value(), this.scale_y.value());
                // Force the size back to what we want
                this.pi_sprite.setSize(this.size_x.value(), this.size_y.value());
                // this may have changed the size, so update it
                // this.size_x.force_value(this.pi_sprite.size.x);
                // this.size_y.force_value(this.pi_sprite.size.y);
            }
        }
         
        // Are we blinking?
        if (this.blink_rate > 0 && this.next_blink < now) {
            if (this.blink_chance >= 100 || Math.random() * 100 < this.blink_chance ) { // lets blink
                this.visible = !this.visible;
                this.next_blink += 1000 / this.blink_rate;
                if (this.pi_sprite !== null ) { // image has been loaded
                    this.pi_sprite.visible = this.visible;
                }
            }
        }

        // Or are we flashing?
        if (this.flash_count > 0 && this.next_flash < now) {
            if (this.visible) {
                this.visible = false;
                this.flash_count -= 1;
            } else {
                this.visible = true;
            } 
            this.next_flash = now + 100;
            this.pi_sprite.visible = this.visible;
        }

        // Or are we blurring?
        if (this.bluriness.update_value()) {
            if (this.pi_sprite !== null ) { // image has been loaded
                if (this.pi_sprite.filters == null) {
                    this.pi_sprite.filters = [ this.blur_filter ];
                } // need to modity this if we need more filter types
                this.blur_filter.strength = this.bluriness.value() / 10;
            }
        }

        // or are we skewing?
        const change_skew_x = this.skew_x.update_value();
        const change_skew_y = this.skew_y.update_value();
        if (change_skew_x || change_skew_y) {
            this.pi_sprite.skew.x = this.skew_x.value() * (Math.PI / 180);
            this.pi_sprite.skew.y = this.skew_y.value() * (Math.PI / 180);
        }
    }

    static get_sprite(scene, tag, report = true) {
        let parts = tag.split(":");
        if (parts.length > 1) {
            scene = parts[0];
            tag = parts[1];
        }
        for ( let i = 0; i < Globals.scenes.length; i++ ) {
            if (Globals.scenes[i].name == scene) {
                for ( let j = 0; j < Globals.scenes[i].sprites.length; j++ ) {
                    // Only return sprites from scenes that are currently running
                    if (!(Globals.scenes[i].state == defaults.SCENE_STOPPED) && Globals.scenes[i].sprites[j].name == tag) {
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

    static remove_sprite(scene, tag) {
        let parts = tag.split(":");
        if (parts.length > 1) {
            scene = parts[0];
            tag = parts[1];
        }
        for ( let i = 0; i < Globals.scenes.length; i++ ) {
            if (Globals.scenes[i].name == scene) {
                for ( let j = 0; j < Globals.scenes[i].sprites.length; j++ ) {
                    if (Globals.scenes[i].sprites[j].tag == tag) {
                        Globals.scenes[i].sprites[j].pi_sprite.destroy();
                        Globals.scenes[i].sprites.splice(j,1);
                        return;
                    }
                }
            }
        }
        Globals.log.error("No sprite found- " + scene + ":" + tag);
    }
}
