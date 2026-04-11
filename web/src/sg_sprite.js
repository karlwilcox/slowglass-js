
import { Adjustable } from "./adjustable";
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
                if (Globals.scenes[i].images[j].tag == tag) {
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
    constructor(url, tag) {
        this.pi_image = null;
        this.tag = tag;
        this.loading = true;
        this.url = url;
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
    constructor(image_tag, sprite_tag) {
        // We duplicated a lot of sprite properties so that we can manipulate independently
        // of whether the PI sprite has been created yet (e.g. waiting for the image to
        // load) and also in case we want to switch to a different rendering engine at a
        // future date.

        // Identification
        this.image_tag = image_tag;
        this.tag = sprite_tag
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
        // visibility
        this.visible = true;
        this.transparency = new Adjustable(100,0,100);
        this.location = null;
        // blinking
        this.next_blink = 0;
        this.blink_rate = 0;
        this.blink_chance = 0;
        // pulsing
        this.pulse_rate = 0;
        this.pulse_min = 0;
        this.pulse_max = 0;
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
    }

    set_pos(x, y, depth) {
        if (arguments.length < 3) {
            depth = 0;
        }
        this.loc_x.set_target_value(x)
        this.loc_y.set_target_value(y);
        this.depth = depth;
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
        if (this.blur_filter == null) {
            this.blur_filter = new PIXI.BlurFilter();
        }
        this.bluriness.set_target_value(target, duration, now, callback);
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
            this.thrown_vy = initial_velocity * Math.cos(radians);
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

    make_pulse_callback(object, action) {
        return function() {
            if (object.pulse_rate > 0) {
                if (action == "up") {
                    object.transparency.set_target_value(object.pulse_max, object.pulse_rate, Date.now(), object.make_pulse_callback(object,"down"));
                } else {
                    object.transparency.set_target_value(object.pulse_min, object.pulse_rate, Date.now(), object.make_pulse_callback(object, "up"));
                }
            }
        }
    }

    pulse(rate, pulse_min, pulse_max, now) {
        this.pulse_rate = 1 / rate;
        this.pulse_min = pulse_min;
        this.pulse_max = pulse_max;
        this.transparency.set_target_value(this.pulse_min);
        this.transparency.set_target_value(this.pulse_max, this.pulse_rate, Date.now(), this.make_pulse_callback(this, "down"));
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

    update(scene, now) {
        if (!this.enabled) {
            return;
        }
        // First, do we need to load an image (and can we?)
        if (this.pi_sprite === null || this.pi_sprite.texture == PIXI.Texture.EMPTY) { // no image loaded
            let image = get_image(scene, this.image_tag);
            if (image === null) { // doesn't exist, give up
                this.enabled = false;
                return;
            }
            if (image != "loading") { // now ready
                // Are we in a specific location?
                if (this.location != null) {
                    // Yes, but we need the image size to work out scaling
                    const img_width = image.pi_image.width;
                    const img_height = image.pi_image.height;
                    const wdw_width = Globals.app.screen.width;
                    const wdw_height = Globals.app.screen.height;
                    const scale_y = img_height / wdw_height ;
                    const scale_x = img_width / wdw_width ;
                    switch ( this.location ) {
                        case "background": // centre, and scale to window size
                            this.loc_x.set_target_value(wdw_width / 2);
                            this.loc_y.set_target_value(wdw_height / 2);
                            this.size_x.set_target_value(wdw_width);
                            this.size_y.set_target_value(wdw_height);
                            break;
                        case "left":
                            this.loc_x.set_target_value(img_width / 2);
                            this.loc_y.set_target_value(wdw_height / 2);
                            this.size_x.set_target_value(scale_y * img_width);
                            this.size_y.set_target_value(scale_y * img_height);
                            break;
                        case "right":
                            this.loc_x.set_target_value(wdw_width - (img_width / 2));
                            this.loc_y.set_target_value(wdw_height / 2);
                            this.size_x.set_target_value(scale_y * img_width);
                            this.size_y.set_target_value(scale_y * img_height);
                            break;
                        case "top":
                        case "sky":
                            this.loc_x.set_target_value(wdw_width / 2);
                            this.loc_y.set_target_value(img_height / 2);
                            this.size_x.set_target_value(scale_x * img_width);
                            this.size_y.set_target_value(scale_x * img_height);
                            break;
                        case "bottom":
                        case "ground":
                            this.loc_x.set_target_value(wdw_width / 2);
                            this.loc_y.set_target_value(wdw_height - (img_height / 2));
                            this.size_x.set_target_value(scale_x * img_width);
                            this.size_y.set_target_value(scale_x * img_height);
                            break;
                    }
                }
                this.pi_sprite = new PIXI.Sprite({
                            texture: image.pi_image,
                            anchor: 0.5,
                            position: {x: this.loc_x.value(),
                                y: this.loc_y.value() },
                            visible: this.visible,
                            }); 
                if (this.size_x.value() > 0 && this.size_y.value() > 0) {
                    this.pi_sprite.setSize(this.size_x.value(), this.size_y.value());
                }
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
        // Let's see if we have been thrown...?
        if (this.falling) {
            const falling_time = (now - this.throw_time) / 1000; // elapsed time in seconds
            const delta_x = this.loc_x.value() + (this.thrown_vx * falling_time * Globals.script_scale_x);
            // this is negative because y grows downwards on a canvas
            const delta_y = this.loc_y.value() - (((this.thrown_vy * falling_time) - (0.5 * Globals.gravity * falling_time * falling_time)) * Globals.script_scale_y);
            if (((Math.abs(delta_x) > Globals.app.screen.width * 2) || (Math.abs(delta_y) > Globals.app.screen.height * 2)) ||
                (Globals.ground_level > 0 && this.loc_y.value + delta_y > Globals.ground_level)) {
                this.falling = false; // gone off the edge of the world or hit the ground
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
        }

        // update size
        // can't test both in same expression because of short-circuiting
        change_x = this.size_x.update_value();
        change_y = this.size_y.update_value();
        if (change_x || change_y) {
            if (this.pi_sprite !== null ) { // image has been loaded
                this.pi_sprite.setSize(this.size_x.value(), this.size_y.value());
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
    }

    static get_sprite(scene, tag) {
        let parts = tag.split(":");
        if (parts.length > 1) {
            scene = parts[0];
            tag = parts[1];
        }
        for ( let i = 0; i < Globals.scenes.length; i++ ) {
            if (Globals.scenes[i].name == scene) {
                for ( let j = 0; j < Globals.scenes[i].sprites.length; j++ ) {
                    if (Globals.scenes[i].sprites[j].tag == tag) {
                        return(Globals.scenes[i].sprites[j]);
                    }
                }
            }
        }
        Globals.log.error("No sprite found- " + scene + ":" + tag);
        return(null);
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
