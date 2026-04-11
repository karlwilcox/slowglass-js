(() => {
  // src/adjustable.js
  var Adjustable = class {
    constructor(in_value, min_value, max_value, wrap) {
      if (arguments.length < 4) {
        wrap = false;
      }
      this.current_value = in_value;
      this.target_value = in_value;
      this.delta_value = 0;
      if (arguments.length >= 3) {
        this.lower_limit = min_value;
        this.upper_limit = max_value;
      } else {
        this.lower_limit = Number.MIN_SAFE_INTEGER;
        this.upper_limit = Number.MAX_SAFE_INTEGER;
      }
      this.last_adjustment = 0;
      this.changing = false;
      this.wrap = wrap;
      this.jig_step = 0;
      this.jig_limit = 0;
      this.jig_chance = 0;
      this.callback = null;
    }
    value() {
      return this.current_value + this.jig_step;
    }
    speed() {
      return this.delta_value;
    }
    adjust(delta) {
      let new_value = this.value + delta;
      if (new_value < this.lower_limit) {
        new_value = this.wrap ? this.upper_limit : this.lower_limit;
      } else if (new_value > this.upper_limit) {
        new_value = this.wrap ? this.lower_limit : this.upper_limit;
      }
      this.value = this.new_value;
    }
    set_target_value(target, seconds, timestamp, callback) {
      if (arguments.length == 1) {
        seconds = 0;
      }
      if (arguments.length == 2) {
        timestamp = Date.now();
      }
      if (arguments.length > 3) {
        this.callback = callback;
      }
      if (target < this.lower_limit) {
        target = this.lower_limit;
      } else if (target > this.upper_limit) {
        target = this.upper_limit;
      }
      this.target_value = target;
      if (seconds == 0) {
        this.current_value = target;
        this.delta_value = 0;
        if (this.callback != null) {
          this.callback("adjustable");
        }
      } else {
        this.delta_value = (this.target_value - this.current_value) / (seconds * 1e3);
        this.last_adjustment = timestamp;
        this.changing = true;
      }
    }
    update_value() {
      let updated = false;
      if (this.jig_limit > 0 && this.jig_chance > 0) {
        if (Math.random() * 100 < this.jig_chance) {
          updated = true;
          this.jig_step += this.jig_limit / 4 - Math.random() * (this.jig_limit / 2);
          if (this.jig_step > this.jig_limit) {
            this.jig_step = this.jig_limit;
          } else if (this.jig_step < this.jig_limit * -1) {
            this.jig_step = this.jig_limit * -1;
          }
        }
      }
      if (!this.changing) {
        return updated;
      }
      if (this.delta_value < 0 && this.current_value < this.target_value || this.delta_value > 0 && this.current_value > this.target_value || Math.abs(this.current_value - this.target_value) < this.delta_value) {
        this.current_value = this.target_value;
        this.delta_value = 0;
        this.changing = false;
        if (this.callback != null) {
          this.callback("adjustable");
        }
      } else {
        let this_adjustment = Date.now();
        this.current_value += this.delta_value * (this_adjustment - this.last_adjustment);
        this.last_adjustment = this_adjustment;
      }
      return true;
    }
    jiggle_stop() {
      this.jig_step = 0;
      this.jig_limit = 0;
      this.jig_chance = 0;
    }
    jiggle_start(limit, chance) {
      this.jig_limit = limit;
      this.jig_chance = chance;
    }
  };

  // src/utils.js
  var Log = class {
    constructor(debug_on) {
      this.debug_on = debug_on;
      this.errors = [];
    }
    debug(text) {
      if (this.debug_on) {
        console.log(text);
      }
    }
    // don't report duplicate errors
    error(text) {
      for (let i = 0; i < this.errors.length; i++) {
        if (this.errors[i] == text) {
          return;
        }
      }
      console.log(text);
      this.errors.push(text);
    }
  };
  var Line = class {
    constructor(number, text) {
      this.number = number;
      this.text = text;
    }
  };
  var ActionGroup = class {
    constructor() {
      this.triggers = [];
      this.actions = [];
      this.any_trigger = true;
      this.completed_actions = 0;
    }
    complete_action(action) {
      this.completed_actions += 1;
    }
    addAction(action) {
      this.actions.push(action);
    }
    addTrigger(trigger) {
      this.triggers.push(trigger);
    }
    actionCount() {
      return this.actions.length;
    }
    all_done() {
      return this.completed_actions >= this.actionCount();
    }
    reset_count() {
      this.completed_actions = 0;
    }
  };
  function makeCompletionCallback(object) {
    return function(action) {
      object.completed_actions += 1;
    };
  }
  function evaluate(input) {
    function safeEval(expr) {
      try {
        if (!/^[0-9+\-*/%.()\s]+$/.test(expr)) {
          return "(" + expr + ")";
        }
        return Function('"use strict"; return (' + expr + ")")();
      } catch {
        return "(" + expr + ")";
      }
    }
    let str = input;
    if (!input.match(/\)/)) {
      return str;
    }
    const regex = /\(([^()]+)\)/g;
    let previous;
    do {
      previous = str;
      str = str.replace(regex, (_, expr) => {
        return safeEval(expr);
      });
    } while (str !== previous);
    return str;
  }
  var Timer = class {
    constructor(start_time, duration, callback) {
      this.endtime = start_time + 1e3 * duration;
      this.callback = callback;
    }
    expired(now) {
      if (now > this.endtime) {
        this.callback("timer");
        return true;
      }
      return false;
    }
  };
  function getHemisphere(callback) {
    const DEFAULT = "northern";
    if (!("geolocation" in navigator)) {
      callback(DEFAULT);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        if (lat < 0) {
          callback("southern");
        } else {
          callback("northern");
        }
      },
      (error) => {
        callback(DEFAULT);
      },
      {
        timeout: 5e3
        // optional safeguard
      }
    );
  }

  // src/defaults.js
  var defaults_default = {
    DISPLAY_HEIGHT: 600,
    DISPLAY_WIDTH: 800,
    HEMISPHERE: "northern",
    // to give the correct calendar season
    DEBUG: true,
    LOCALE: "en-GB",
    TRUEVALUE: "YES",
    FALSEVALUE: "NO",
    NOTFOUND: "NONE",
    TRIGGER_RATE: 500,
    // milliseconds between trigger tests
    SPRITE_RATE: 40,
    // milliseconds between sprite updates
    MAIN_NAME: "_MAIN_",
    VOLUME_MIN: 0,
    VOLUME_MAX: 100,
    // scaling types
    SCALE_FIT: "fit",
    SCALE_STRETCH: "stretch",
    SCALE_NONE: "none",
    GRAVITY_PS2: 100
    // force of gravity in pixels per second per second
  };

  // src/globals.js
  var Globals = class _Globals {
    static root = null;
    static scenes = [];
    static app = null;
    static log = new Log(defaults_default.DEBUG);
    static current_trigger = "";
    static display_width = defaults_default.DISPLAY_WIDTH;
    static display_height = defaults_default.DISPLAY_HEIGHT;
    static script_width = defaults_default.DISPLAY_WIDTH;
    static script_height = defaults_default.DISPLAY_HEIGHT;
    static script_scale_type = defaults_default.SCALE_NONE;
    static script_scale_x = 1;
    static script_scale_y = 1;
    static gravity = defaults_default.GRAVITY_PS2;
    static ground_level = defaults_default.DISPLAY_HEIGHT;
    static lastKey = null;
    static key = null;
    constructor() {
    }
    static reset() {
      _Globals.root = null;
      _Globals.scenes = [];
      _Globals.app = null;
      _Globals.log = new Log(defaults_default.DEBUG);
      _Globals.current_trigger = "";
      _Globals.display_width = defaults_default.DISPLAY_WIDTH;
      _Globals.display_height = defaults_default.DISPLAY_HEIGHT;
      _Globals.script_width = defaults_default.DISPLAY_WIDTH;
      _Globals.script_height = defaults_default.DISPLAY_HEIGHT;
      _Globals.script_scale_type = defaults_default.SCALE_NONE;
      _Globals.script_scale_x = 1;
      _Globals.script_scale_y = 1;
      _Globals.gravity = defaults_default.GRAVITY_PS2;
      _Globals.lastKey = null;
      _Globals.key = null;
    }
    static event(type, data) {
      switch (type) {
        case "onkeydown":
          _Globals.lastKey = data;
          _Globals.key = data;
          break;
        case "onkeyup":
          _Globals.key = null;
          break;
      }
    }
  };

  // src/sg_sprite.js
  function get_image(scene, tag) {
    let parts = tag.split(":");
    if (parts.length > 1) {
      scene = parts[0];
      tag = parts[1];
    }
    for (let i = 0; i < Globals.scenes.length; i++) {
      if (Globals.scenes[i].name == scene) {
        for (let j = 0; j < Globals.scenes[i].images.length; j++) {
          if (Globals.scenes[i].images[j].tag == tag) {
            if (Globals.scenes[i].images[j].loading) {
              return "loading";
            } else {
              return Globals.scenes[i].images[j];
            }
          }
        }
      }
    }
    Globals.log.error("No image found- " + scene + ":" + tag);
    return null;
  }
  var SG_image = class {
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
  };
  var SG_sprite = class {
    constructor(image_tag, sprite_tag) {
      this.image_tag = image_tag;
      this.tag = sprite_tag;
      this.pi_sprite = null;
      this.enabled = true;
      this.loc_x = new Adjustable(0);
      this.loc_y = new Adjustable(0);
      this.angle = new Adjustable(0, 0, 360);
      this.depth = 0;
      this.size_x = new Adjustable(0);
      this.size_y = new Adjustable(0);
      this.visible = true;
      this.transparency = new Adjustable(100, 0, 100);
      this.location = null;
      this.next_blink = 0;
      this.blink_rate = 0;
      this.blink_chance = 0;
      this.pulse_rate = 0;
      this.pulse_min = 0;
      this.pulse_max = 0;
      this.flash_count = 0;
      this.next_flash = 0;
      this.throw_vx = 0;
      this.throw_vy = 0;
      this.throw_time = 0;
      this.falling = false;
      this.throw_callback = null;
      this.bluriness = new Adjustable(0, 0, 100);
      this.blur_filter = null;
    }
    set_pos(x, y, depth) {
      if (arguments.length < 3) {
        depth = 0;
      }
      this.loc_x.set_target_value(x);
      this.loc_y.set_target_value(y);
      this.depth = depth;
    }
    move(new_x, new_y, to_or_by, in_or_at, duration, now, callback) {
      if (to_or_by == "by") {
        new_x += this.loc_x.value();
        new_y += this.loc_y.value();
      }
      if (in_or_at == "at") {
      }
      this.loc_x.set_target_value(new_x, duration, now, callback);
      this.loc_y.set_target_value(new_y, duration, now);
    }
    rotate(turn_type, value2, dur_type, duration, now, callback) {
      let new_value = 0;
      if (turn_type == "to") {
        new_value = value2;
      } else if (turn_type == "by") {
        new_value = this.angle.value() + value2;
      }
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
      this.next_flash = now + 100;
    }
    jiggle(x, y, rot, chance) {
      if (chance > 0) {
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
      if (rate <= 0) {
        this.visible = false;
      }
      this.next_blink = now + 1e3 / this.blink_rate;
    }
    make_pulse_callback(object, action) {
      return function() {
        if (object.pulse_rate > 0) {
          if (action == "up") {
            object.transparency.set_target_value(object.pulse_max, object.pulse_rate, Date.now(), object.make_pulse_callback(object, "down"));
          } else {
            object.transparency.set_target_value(object.pulse_min, object.pulse_rate, Date.now(), object.make_pulse_callback(object, "up"));
          }
        }
      };
    }
    pulse(rate, pulse_min, pulse_max, now) {
      this.pulse_rate = 1 / rate;
      this.pulse_min = pulse_min;
      this.pulse_max = pulse_max;
      this.transparency.set_target_value(this.pulse_min);
      this.transparency.set_target_value(this.pulse_max, this.pulse_rate, Date.now(), this.make_pulse_callback(this, "down"));
    }
    set_visibility(visible) {
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
      }
      this.size_x.set_target_value(new_w, duration, now, callback);
      this.size_y.set_target_value(new_h, duration, now);
    }
    update(scene, now) {
      if (!this.enabled) {
        return;
      }
      if (this.pi_sprite === null || this.pi_sprite.texture == PIXI.Texture.EMPTY) {
        let image = get_image(scene, this.image_tag);
        if (image === null) {
          this.enabled = false;
          return;
        }
        if (image != "loading") {
          if (this.location != null) {
            const img_width = image.pi_image.width;
            const img_height = image.pi_image.height;
            const wdw_width = Globals.app.screen.width;
            const wdw_height = Globals.app.screen.height;
            const scale_y = img_height / wdw_height;
            const scale_x = img_width / wdw_width;
            switch (this.location) {
              case "background":
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
                this.loc_x.set_target_value(wdw_width - img_width / 2);
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
                this.loc_y.set_target_value(wdw_height - img_height / 2);
                this.size_x.set_target_value(scale_x * img_width);
                this.size_y.set_target_value(scale_x * img_height);
                break;
            }
          }
          this.pi_sprite = new PIXI.Sprite({
            texture: image.pi_image,
            anchor: 0.5,
            position: {
              x: this.loc_x.value(),
              y: this.loc_y.value()
            },
            visible: this.visible
          });
          if (this.size_x.value() > 0 && this.size_y.value() > 0) {
            this.pi_sprite.setSize(this.size_x.value(), this.size_y.value());
          }
          Globals.root.addChild(this.pi_sprite);
        }
      }
      let change_x = this.loc_x.update_value();
      let change_y = this.loc_y.update_value();
      if (change_x || change_y) {
        if (this.pi_sprite !== null) {
          this.pi_sprite.position.set(this.loc_x.value(), this.loc_y.value());
        }
      }
      if (this.falling) {
        const falling_time = (now - this.throw_time) / 1e3;
        const delta_x = this.loc_x.value() + this.thrown_vx * falling_time * Globals.script_scale_x;
        const delta_y = this.loc_y.value() - (this.thrown_vy * falling_time - 0.5 * Globals.gravity * falling_time * falling_time) * Globals.script_scale_y;
        if (Math.abs(delta_x) > Globals.app.screen.width * 2 || Math.abs(delta_y) > Globals.app.screen.height * 2 || Globals.ground_level > 0 && this.loc_y.value + delta_y > Globals.ground_level) {
          this.falling = false;
          if (this.throw_callback != null) {
            this.throw_callback();
          }
        }
        if (this.pi_sprite !== null) {
          this.pi_sprite.position.set(this.loc_x.value() + delta_x, this.loc_y.value() + delta_y);
        }
      }
      if (this.angle.update_value()) {
        if (this.pi_sprite !== null) {
          this.pi_sprite.angle = this.angle.value();
        }
      }
      if (this.transparency.update_value()) {
        if (this.pi_sprite !== null) {
          this.pi_sprite.alpha = this.transparency.value() / 100;
        }
      }
      change_x = this.size_x.update_value();
      change_y = this.size_y.update_value();
      if (change_x || change_y) {
        if (this.pi_sprite !== null) {
          this.pi_sprite.setSize(this.size_x.value(), this.size_y.value());
        }
      }
      if (this.blink_rate > 0 && this.next_blink < now) {
        if (this.blink_chance >= 100 || Math.random() * 100 < this.blink_chance) {
          this.visible = !this.visible;
          this.next_blink += 1e3 / this.blink_rate;
          if (this.pi_sprite !== null) {
            this.pi_sprite.visible = this.visible;
          }
        }
      }
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
      if (this.bluriness.update_value()) {
        if (this.pi_sprite !== null) {
          if (this.pi_sprite.filters == null) {
            this.pi_sprite.filters = [this.blur_filter];
          }
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
      for (let i = 0; i < Globals.scenes.length; i++) {
        if (Globals.scenes[i].name == scene) {
          for (let j = 0; j < Globals.scenes[i].sprites.length; j++) {
            if (Globals.scenes[i].sprites[j].tag == tag) {
              return Globals.scenes[i].sprites[j];
            }
          }
        }
      }
      Globals.log.error("No sprite found- " + scene + ":" + tag);
      return null;
    }
    static remove_sprite(scene, tag) {
      let parts = tag.split(":");
      if (parts.length > 1) {
        scene = parts[0];
        tag = parts[1];
      }
      for (let i = 0; i < Globals.scenes.length; i++) {
        if (Globals.scenes[i].name == scene) {
          for (let j = 0; j < Globals.scenes[i].sprites.length; j++) {
            if (Globals.scenes[i].sprites[j].tag == tag) {
              Globals.scenes[i].sprites[j].pi_sprite.destroy();
              Globals.scenes[i].sprites.splice(j, 1);
              return;
            }
          }
        }
      }
      Globals.log.error("No sprite found- " + scene + ":" + tag);
    }
  };

  // src/parser.js
  var Parser = class _Parser {
    constructor() {
      ;
    }
    static test_word(words, word, def) {
      let retval = false;
      if (words.length > 0) {
        if (word instanceof Array) {
          for (let i = 0; i < word.length; i++) {
            if (words[0] == word[i]) {
              retval = words[0];
              words.shift();
            }
          }
        } else if (words[0] == word) {
          retval = words[0];
          words.shift();
        }
      }
      if (retval == false && arguments > 2) {
        retval = def;
      }
      return retval;
    }
    static get_int(words, def, min, max) {
      if (words.length > 0) {
        let word = words.shift();
        if (!word.match(/^[0-9-]+$/)) {
          Globals.log.error("Expected integer - " + word);
        }
        let retval = parseInt(word);
        if (arguments.length > 2 && retval < min) {
          retval = min;
        }
        if (arguments.length > 3 && retval > max) {
          retval = max;
        }
        return retval;
      }
      return def;
    }
    static get_float(words, def) {
      if (words.length > 0) {
        return parseFloat(words.shift());
      }
      return def;
    }
    static get_word(words, def) {
      if (words.length > 0) {
        return words.shift();
      }
      return def;
    }
    static get_time_units(words, def) {
      let mult = 1;
      let units = _Parser.get_word(words, def);
      if (units.startsWith("s")) {
        ;
      } else if (units.startsWith("m")) {
        mult = 60;
      } else if (units.startsWith("h")) {
        mult = 3600;
      } else {
        Globals.log.error("Unknown time unit - " + units);
      }
      return mult;
    }
    static get_duration(words, def) {
      let value2 = _Parser.get_float(words, def) * _Parser.get_time_units(words, "s");
      return Math.round(value2);
    }
    static get_rate(words, def, extra) {
      let value2 = _Parser.get_float(words, def);
      if (arguments.length > 2) {
        _Parser.test_word(words, extra);
      }
      _Parser.test_word(words, "per");
      value2 *= _Parser.get_time_units(words, "s");
      return value2;
    }
  };

  // src/triggers.js
  var Trigger = class {
    constructor(scene, timestamp, params) {
      this.scene = scene;
      this.triggered = false;
      this.expired = false;
      this.next_update = 0;
      this.trigger_time = 0;
      this.create_time = timestamp;
      this.params = params;
      this.expanded = null;
    }
    fired(timestamp) {
      return false;
    }
    expand_all(input) {
      let expanded = this.scene.varList.expand_vars(input);
      expanded = evaluate(expanded);
      return expanded.split(/[,\s]+/);
    }
  };
  var Begin = class extends Trigger {
    constructor(scene, timestamp, params) {
      super(scene, timestamp, params);
    }
    fired(timestamp) {
      if (this.expired) {
        return false;
      }
      this.triggered = true;
      this.expired = true;
      return true;
    }
  };
  var After = class extends Trigger {
    constructor(scene, timestamp, params) {
      super(scene, timestamp, params);
      this.trigger_time = null;
    }
    fired(timestamp) {
      if (this.expired) {
        return false;
      }
      if (this.expanded == null) {
        this.expanded = this.expand_all(this.params);
        this.trigger_time = this.create_time + Parser.get_duration(this.expanded, 1) * 1e3;
      }
      if (timestamp > this.trigger_time) {
        this.triggered = true;
        this.expired = true;
        return true;
      }
      return false;
    }
  };
  var Every = class extends Trigger {
    constructor(scene, timestamp, params) {
      super(scene, timestamp, params);
      this.trigger_rate = null;
      this.last_triggered = timestamp;
    }
    fired(timestamp) {
      if (this.expanded == null) {
        this.expanded = this.expand_all(this.params);
        this.trigger_rate = Parser.get_duration(this.expanded, 1) * 1e3;
      }
      if (timestamp - this.last_triggered > this.trigger_rate) {
        this.triggered = true;
        this.last_triggered = timestamp;
        return true;
      }
      this.triggered = false;
      return false;
    }
  };
  var IfWhile = class extends Trigger {
    constructor(scene, timestamp, params, keyword) {
      super(scene, timestamp, params);
      this.keyword = keyword;
    }
    fired(timestamp) {
      if (this.expired) {
        return false;
      }
      let result = false;
      let expanded = this.expand_all(this.params);
      let inverted = false;
      if (expanded[0] == "not") {
        expanded.shift();
        inverted = true;
      }
      if (expanded.length == 0) {
        result = !inverted;
      } else if (expanded.length == 1) {
        if (expanded[0].match(/^[-0-9\.\+]+$/)) {
          result = !(Math.abs(parseFloat(expanded[0])) < 1e-3);
        } else if (["false", "no", "n", "none"].includes(expanded[0].toLowerCase())) {
          result = false;
        } else {
          result = true;
        }
      } else if (expanded.length == 2) {
        result = expanded[0].toLowerCase == expanded[1].toLowerCase;
      } else if (expanded.length > 2) {
        let lvalue = expanded[0].toLowerCase();
        let rvalue = expanded[2].toLowerCase();
        let comparison = expanded[1].toLowerCase();
        switch (comparison) {
          case "is":
          case "equals":
          case "=":
          case "==":
            value = lvalue == rvalue;
            break;
          case "not":
          case "!=":
          case "!==":
            value = lvalue != rvalue;
            break;
          case ">":
            value = lvalue > rvalue;
            break;
          case "<":
            value = lvalue < rvalue;
            break;
          case ">=":
            value = lvalue >= rvalue;
            break;
          case "<=":
            value = lvalue <= rvalue;
            break;
          default:
            Globals.log.error("Unknown comparison - " + comparison);
            break;
        }
      }
      if (result) {
        this.triggered = true;
        if (this.keyword == "if") {
          this.expired = true;
        }
        return inverted ? !result : result;
      }
      this.triggered = false;
      return false;
    }
  };
  var AtClass = class extends Trigger {
    constructor(scene, timestamp, params) {
      super(scene, timestamp, params);
      this.minutes = null;
      this.hours = null;
      this.seconds = 0;
      this.next_check = 0;
      this.valid = true;
    }
    fired(timestamp) {
      if (!this.valid) {
        return false;
      }
      if (this.expanded == null) {
        this.expanded = this.expand_all(this.params);
        if (this.expanded.length > 0) {
          const timeofDay = this.expanded[0];
          if (timeofDay.match(/^[0-9]+:[0-9]+(:[0-9]+)?$/)) {
            const parts = timeofDay.split(":");
            this.hours = parseInt(parts[0]);
            this.minutes = parseInt(parts[1]);
            if (parts.length > 2) {
              this.seconds = parseInt(parts[2]);
            }
          } else {
            Globals.log.error("Incorrect time format " + timeofDay);
            this.valid = false;
          }
        } else {
          Globals.log.error("Missing time for at ");
          this.valid = false;
        }
      }
      if (this.next_check > timestamp) {
        return false;
      }
      const d = /* @__PURE__ */ new Date();
      d.setTime(timestamp);
      let matched = true;
      if (this.hours != d.getHours()) {
        matched = false;
      }
      if (this.minutes != d.getMinutes()) {
        matched = false;
      }
      if (this.seconds != d.getSeconds()) {
        matched = false;
      }
      if (matched) {
        this.next_check = timestamp + 60 * 60 * 1e3;
      }
      return matched;
    }
  };
  var ThenClass = class extends Trigger {
    constructor(scene, timestamp, params, linked_action_group) {
      super(scene, timestamp, params);
      this.linked_action_group = linked_action_group;
    }
    fired(timestamp) {
      if (this.expired) {
        return false;
      }
      if (this.linked_action_group.all_done()) {
        this.expired = true;
        return true;
      }
      return false;
    }
  };
  var Each = class extends Trigger {
    constructor(scene, timestamp, params) {
      super(scene, timestamp, params);
      this.minutes = null;
      this.hours = null;
      this.seconds = 0;
    }
    fired(timestamp) {
      if (this.expanded == null) {
        this.expanded = this.expand_all(this.params);
        if (this.expanded.length > 0) {
          const timeofDay = this.expanded[0];
          if (timeofDay.match(/^([0-9]+|\*):([0-9]+|\*)(:([0-9]+|\*))?$/)) {
            const parts = timeofDay.split(":");
            this.hours = parts[0] == "*" ? "*" : parseInt(parts[0]);
            this.minutes = parts[1] == "*" ? "*" : parseInt(parts[1]);
            if (parts.length > 2) {
              this.seconds = parts[2] == "*" ? "*" : parseInt(parts[2]);
            }
          } else {
            Globals.log.error("Incorrect time format " + timeofDay);
          }
        } else {
          Globals.log.error("Missing time for at ");
        }
      }
      const d = /* @__PURE__ */ new Date();
      d.setTime(timestamp);
      let matched = true;
      if (this.hours != "*" && this.hours != d.getHours()) {
        matched = false;
      }
      if (this.minutes != "*" && this.minutes != d.getMinutes()) {
        matched = false;
      }
      if (this.seconds != "*" && this.seconds != d.getSeconds()) {
        matched = false;
      }
      return matched;
    }
  };

  // src/vars.js
  var Variable = class {
    constructor(name, value2) {
      this.name = name;
      this.value = value2;
    }
    getValue() {
      return this.value;
    }
    setValue(value2) {
      this.value = value2;
      return true;
    }
  };
  var VarList = class _VarList {
    static key = null;
    static lastKey = null;
    constructor() {
      this.variables = [];
      this.trigger = null;
      this.hemisphere = null;
      getHemisphere(this.makeHemisphereCallback(this));
    }
    makeHemisphereCallback(object) {
      return function(hemisphere) {
        object.hemisphere = hemisphere;
      };
    }
    create(name, value2) {
      if (_VarList.built_in(name)) {
        Globals.log.error("Cannot create built-in variable " + name);
      } else {
        this.variables.push(new Variable(name, value2));
      }
    }
    /**************************************************************************************************
    
       ########  ##     ## #### ##       ########         #### ##    ##  ######  
       ##     ## ##     ##  ##  ##          ##             ##  ###   ## ##    ## 
       ##     ## ##     ##  ##  ##          ##             ##  ####  ## ##       
       ########  ##     ##  ##  ##          ##    #######  ##  ## ## ##  ######  
       ##     ## ##     ##  ##  ##          ##             ##  ##  ####       ## 
       ##     ## ##     ##  ##  ##          ##             ##  ##   ### ##    ## 
       ########   #######  #### ########    ##            #### ##    ##  ######  
    
    **************************************************************************************************/
    static built_in(name) {
      const date = /* @__PURE__ */ new Date();
      const month = date.getMonth() + 1;
      switch (name) {
        case "SECONDS":
        case "SECOND":
          return new Intl.DateTimeFormat(defaults_default.LOCALE, { second: "numeric" }).format(date);
        case "MINUTES":
        case "MINUTE":
          return new Intl.DateTimeFormat(defaults_default.LOCALE, { minute: "numeric" }).format(date);
        case "HOUR":
        case "HOURS":
          return new Intl.DateTimeFormat(defaults_default.LOCALE, { hour: "numeric" }).format(date);
        case "DAYOFWEEK":
          return date.getDay() + 1;
        // Sunday = 1
        case "DAYNAME":
          return new Intl.DateTimeFormat(defaults_default.LOCALE, { weekday: "long" }).format(date);
        case "MONTH":
          return month;
        case "MONTHNAME":
          return new Intl.DateTimeFormat(defaults_default.LOCALE, { month: "long" }).format(date);
        case "YEAR":
          return date.getFullYear();
        case "HEMISPHERE":
          return this.hemisphere;
        case "SEASON":
          switch (month) {
            case 12:
            case 1:
            case 2:
              return this.hemisphere == "northern" ? "winter" : "summer";
            case 3:
            case 4:
            case 5:
              return this.hemisphere == "northern" ? "spring" : "autumn";
            case 6:
            case 7:
            case 8:
              return this.hemisphere == "northern" ? "summer" : "winter";
            case 9:
            case 10:
            case 11:
              return this.hemisphere == "northern" ? "autumn" : "spring";
          }
          break;
        case "WINTER":
          return this.hemisphere == "northern" && (month >= 12 || month <= 2) || this.hemisphere == "southern" && (month >= 6 && month <= 8) ? defaults_default.TRUEVALUE : defaults_default.FALSEVALUE;
        case "SPRING":
          return this.hemisphere == "northern" && (month >= 3 && month <= 5) || this.hemisphere == "southern" && (month >= 9 && month <= 11) ? defaults_default.TRUEVALUE : defaults_default.FALSEVALUE;
        case "SUMMER":
          return this.hemisphere == "northern" && (month >= 6 && month <= 8) || this.hemisphere == "southern" && (month >= 12 || month <= 2) ? defaults_default.TRUEVALUE : defaults_default.FALSEVALUE;
        case "AUTUMN":
          return this.hemisphere == "northern" && (month >= 9 && month <= 11) || this.hemisphere == "southern" && (month >= 3 && month <= 5) ? defaults_default.TRUEVALUE : defaults_default.FALSEVALUE;
        case "WIDTH":
          return Globals.app.screen.width;
        case "HEIGHT":
          return Globals.app.screen.height;
        case "CENTREX":
        case "CENTERX":
          return Math.floor(Globals.app.screen.width / 2);
        case "CENTREY":
        case "CENTERY":
          return Math.floor(Globals.app.screen.height / 2);
        case "RANDOMX":
          return Math.floor(Math.random() * Globals.app.screen.width);
        case "RANDOMY":
          return Math.floor(Math.random() * Globals.app.screen.height);
        case "CHANCE":
          return Math.random();
        case "PERCENT":
        case "PERCENTAGE":
          return Math.floor(Math.random() * 101);
        case "TRIGGER":
          return this.trigger;
        case "WEEKDAY":
          return date.getDay() > 0 && date.getDay() < 6 ? defaults_default.TRUEVALUE : defaults_default.FALSEVALUE;
        case "WEEKEND":
          return date.getDay() == 0 || date.getDay() == 6 ? defaults_default.TRUEVALUE : defaults_default.FALSEVALUE;
        case "MORNING":
          return date.getHour() > 6 && date.getHour() < 13 ? defaults_default.TRUEVALUE : defaults_default.FALSEVALUE;
        case "AFTERNOON":
          return date.getHour() > 11 && date.getHour() < 18 ? defaults_default.TRUEVALUE : defaults_default.FALSEVALUE;
        case "EVENING":
          return date.getHour() > 18 && date.getHour() < 22 ? defaults_default.TRUEVALUE : defaults_default.FALSEVALUE;
        case "NIGHT":
          return date.getHour() > 22 || date.getHour() < 6 ? defaults_default.TRUEVALUE : defaults_default.FALSEVALUE;
        case "KEY":
          return Globals.key == null ? defaults_default.NOTFOUND : Globals.key;
        case "LASTKEY":
          return Globals.lastKey == null ? defaults_default.NOTFOUND : Globals.lastKey;
        case "SCALEX":
          return Globals.script_scale_x;
        case "SCALEY":
          return Globals.script_scale_y;
        default:
          return false;
      }
    }
    static scene_var(varName) {
      let value2 = "NONE";
      const parts = varName.split(/:/);
      const scene = Scene.find(parts[0]);
      if (scene !== false) {
        value2 = scene.varList.get_value(parts[1]);
      }
      return value2;
    }
    find(name) {
      for (let i = 0; i < this.variables.length; i++) {
        let variable = this.variables[i];
        if (variable.name == name) {
          return i;
        }
      }
      return false;
    }
    get_value(name) {
      let value2 = _VarList.built_in(name);
      if (value2 === false) {
        let index = this.find(name);
        if (index !== false) {
          value2 = this.variables[index].getValue();
        } else {
          Globals.log.error("Variable not found " + name);
          value2 = defaults_default.NOTFOUND;
        }
      }
      return value2;
    }
    update(name, value2) {
      if (_VarList.built_in(name)) {
        Globals.log.error("Cannot update built-in variable " + name);
        return false;
      }
      let index = this.find(name);
      if (index === false) {
        Globals.log.error("Variable not found " + name);
        return defaults_default.NOTFOUND;
      }
      return this.variables[index].setValue(value2);
    }
    delete(name) {
      let index = this.find(name);
      if (index === false) {
        Globals.log.error("Variable not found " + name);
        return false;
      }
      if (!this.variables[index].setValue(0)) {
        Globals.log.error("Cannot delete readonly variable " + name);
        return false;
      }
      this.variables.splice(index, 1);
      return true;
    }
    expand_vars(input) {
      let output = "";
      let i = 0;
      while (i < input.length) {
        if (input[i] === "\\" && input[i + 1] === "$") {
          output += "$";
          i += 2;
          continue;
        }
        if (input[i] === "$") {
          let j = i + 1;
          let varName = "";
          if (input[j] === "{") {
            j++;
            const start = j;
            while (j < input.length && input[j] !== "}") {
              j++;
            }
            if (j < input.length && input[j] === "}") {
              varName = input.slice(start, j);
              j++;
            } else {
              output += "$";
              i++;
              continue;
            }
          } else {
            const start = j;
            while (j < input.length && /[a-zA-Z0-9_:]/.test(input[j])) {
              j++;
            }
            varName = input.slice(start, j);
          }
          let replacement = "";
          if (varName.match(/:/)) {
            replacement = _VarList.scene_var(varName);
          } else {
            replacement = this.get_value(varName);
          }
          output += replacement;
          i = j;
          continue;
        }
        output += input[i];
        i++;
      }
      return output;
    }
  };

  // src/audio.js
  var AudioManager = /* @__PURE__ */ (function() {
    const streams = {};
    let container = null;
    function getContainer() {
      if (!container) {
        container = document.getElementById("audio");
        if (!container) {
          throw new Error('Audio container div with id "audio" not found');
        }
      }
      return container;
    }
    function clampVolume(vol) {
      return Math.max(0, Math.min(100, vol));
    }
    function clearFade(tag) {
      const s = streams[tag];
      if (s && s.fadeInterval) {
        clearInterval(s.fadeInterval);
        s.fadeInterval = null;
      }
    }
    function fade(tag, targetVolume, durationMs) {
      const s = streams[tag];
      if (!s) return;
      clearFade(tag);
      const audio = s.audio;
      const startVolume = audio.volume;
      const endVolume = clampVolume(targetVolume) / 100;
      if (durationMs <= 0) {
        audio.volume = endVolume;
        return;
      }
      const steps = 30;
      const stepTime = durationMs / steps;
      const delta = (endVolume - startVolume) / steps;
      let currentStep = 0;
      s.fadeInterval = setInterval(() => {
        currentStep++;
        audio.volume = Math.max(0, Math.min(1, audio.volume + delta));
        if (currentStep >= steps) {
          audio.volume = endVolume;
          clearFade(tag);
        }
      }, stepTime);
    }
    return {
      // Create a new audio stream
      create(tag, url, options = {}) {
        if (streams[tag]) {
          throw new Error(`Stream with tag "${tag}" already exists`);
        }
        const audio = document.createElement("audio");
        audio.src = url;
        audio.preload = "auto";
        audio.controls = false;
        if (typeof options.onEnded === "function") {
          audio.addEventListener("ended", () => {
            options.onEnded(tag);
          });
        }
        getContainer().appendChild(audio);
        streams[tag] = {
          audio,
          fadeInterval: null
        };
      },
      play(tag, { fadeInMs = 0, targetVolume = 100, callback = null } = {}) {
        const s = streams[tag];
        if (!s) return;
        if (typeof callback === "function") {
          audio.addEventListener("ended", () => {
            callback(tag);
          });
        }
        const audio = s.audio;
        if (fadeInMs > 0) {
          audio.volume = 0;
          audio.play();
          fade(tag, targetVolume, fadeInMs);
        } else {
          audio.volume = clampVolume(targetVolume) / 100;
          audio.play();
        }
      },
      pause(tag) {
        const s = streams[tag];
        if (!s) return;
        clearFade(tag);
        s.audio.pause();
      },
      stop(tag, { fadeOutMs = 0 } = {}) {
        const s = streams[tag];
        if (!s) return;
        if (fadeOutMs > 0) {
          fade(tag, 0, fadeOutMs);
          setTimeout(() => {
            s.audio.pause();
            s.audio.currentTime = 0;
          }, fadeOutMs);
        } else {
          clearFade(tag);
          s.audio.pause();
          s.audio.currentTime = 0;
        }
      },
      delete(tag, { fadeOutMs = 0 } = {}) {
        const s = streams[tag];
        if (!s) return;
        if (fadeOutMs > 0) {
          fade(tag, 0, fadeOutMs);
          setTimeout(() => {
            s.audio.pause();
            s.audio.remove();
            delete streams[tag];
          }, fadeOutMs);
        } else {
          clearFade(tag);
          s.audio.pause();
          s.audio.remove();
          delete streams[tag];
        }
      },
      setVolume(tag, volume, { fadeMs = 0 } = {}) {
        const s = streams[tag];
        if (!s) return;
        if (fadeMs > 0) {
          fade(tag, volume, fadeMs);
        } else {
          clearFade(tag);
          s.audio.volume = clampVolume(volume) / 100;
        }
      },
      exists(tag) {
        return !!streams[tag];
      },
      stopAll({ fadeOutMs = 0 } = {}) {
        Object.keys(streams).forEach((tag) => {
          this.stop(tag, { fadeOutMs });
        });
      },
      deleteAll({ fadeOutMs = 0 } = {}) {
        Object.keys(streams).forEach((tag) => {
          this.delete(tag, { fadeOutMs });
        });
      }
    };
  })();

  // src/scene.js
  var Scene2 = class _Scene {
    constructor(sceneName) {
      this.name = sceneName;
      this.content = [];
      this.enabled = sceneName == defaults_default.MAIN_NAME;
      this.actionGroups = [];
      this.images = [];
      this.sprites = [];
      this.folder = "";
      this.varList = new VarList();
      this.timers = [];
      this.completion_callback = null;
    }
    static find(scene_name) {
      for (let i = 0; i < Globals.scenes.length; i++) {
        if (scene_name == Globals.scenes[i].name) {
          return Globals.scenes[i];
        }
      }
      Globals.log.error("Cannot find scene " + scene_name);
      return false;
    }
    /**************************************************************************************************
    
       ########  ########    ###    ########  ######## ######## ##     ## ######## 
       ##     ## ##         ## ##   ##     ##    ##    ##        ##   ##     ##    
       ##     ## ##        ##   ##  ##     ##    ##    ##         ## ##      ##    
       ########  ######   ##     ## ##     ##    ##    ######      ###       ##    
       ##   ##   ##       ######### ##     ##    ##    ##         ## ##      ##    
       ##    ##  ##       ##     ## ##     ##    ##    ##        ##   ##     ##    
       ##     ## ######## ##     ## ########     ##    ######## ##     ##    ##    
    
    **************************************************************************************************/
    static readFromText(text) {
      const script = text.split(/\r?\n/);
      const count = script.length;
      const top = new _Scene(defaults_default.MAIN_NAME);
      let holding = null;
      let in_comment = false;
      for (let i = 0; i < script.length; i++) {
        let lineCount = i + 1;
        let currentLine = script[i].trim();
        currentLine = currentLine.replace(/\/\*[\s\S]*?\*\//g, "");
        if (in_comment) {
          if (currentLine.match(/\*\//)) {
            let end_pos = currentLine.search(/\*\//);
            currentLine = currentLine.substr(end_pos + 1);
            in_comment = false;
          } else {
            continue;
          }
        }
        if (currentLine.match(/\/\*/)) {
          let start_pos = currentLine.search(/\/\*/);
          currentLine = currentLine.substr(0, start_pos);
          in_comment = true;
        }
        currentLine.replace(/\/\/.*$/, "");
        if (currentLine.length < 2 || currentLine.startsWith("#")) {
          continue;
        }
        if (!currentLine.match(/\w+/)) {
          continue;
        }
        let words = currentLine.toLowerCase().split(/[\s,]+/);
        if (words[0] == "and") {
          words.shift();
        }
        let command = words[0];
        let argument = "";
        let argument2 = "";
        if (words.length > 1) {
          argument = words[1];
        }
        if (words.length > 2) {
          argument2 = words[2];
        }
        if (command == "scene") {
          if (argument == null) {
            Globals.log.error(`expected scene name on line ${lineCount}`);
          } else {
            if (holding != null) {
              Globals.scenes.push(holding);
            }
            holding = new _Scene(argument);
          }
        } else if (command == "end") {
          if (argument == "file") {
            break;
          } else if (argument == "scene") {
            if (holding != null) {
              Globals.scenes.push(holding);
              holding = null;
            } else {
              Globals.log.error(`no current scene at line ${lineCount}`);
            }
          } else {
            Globals.log.error("end must be followed by file or scene");
          }
        } else if (command == "display") {
          if (argument == "width") {
            let display_width = parseInt(argument2);
            if (display_width < 50 || display_width > 5e3) {
              Globals.log.error("silly display width");
              display_width = defaults_default.DISPLAY_WIDTH;
            }
            Globals.display_width = display_width;
          } else if (argument == "height") {
            let display_height = parseInt(argument2);
            if (display_height < 50 || display_height > 5e3) {
              Globals.log.error("silly display height");
              display_height = defaults_default.DISPLAY_HEIGHT;
            }
            Globals.display_height = display_height;
          }
        } else if (command == "include") {
          Globals.log.error("Include not supported yet");
        } else if (command == "script") {
          if (argument == "width") {
            let script_width = parseInt(argument2);
            if (script_width < 50 || script_width > 5e3) {
              Globals.log.error("silly script width");
              script_width = defaults_default.DISPLAY_WIDTH;
            }
            Globals.script_width = script_width;
          } else if (argument == "height") {
            let script_height = parseInt(argument2);
            if (script_height < 50 || script_height > 5e3) {
              Globals.log.error("silly script height");
              script_height = defaults_default.DISPLAY_HEIGHT;
            }
            Globals.script_height = script_height;
          } else if (argument == "scale") {
            Globals.script_scale_type = argument2;
          }
        } else if (command == "gravity") {
          let gravity = Parrser.parseFloat(argument);
          if (gravity <= 0) {
            Globals.log.error("silly gravity setting");
            gravity = defaults_default.GRAVITY_PS2;
          }
          Globals.gravity_ps2 = gravity;
        } else if (command == "ground") {
          if (argument == "level") {
            argument = argument2;
          }
          Globals.ground_level = parseInt(argument);
        } else {
          const line = new Line(lineCount, currentLine);
          if (holding == null) {
            top.content.push(line);
          } else {
            holding.content.push(line);
          }
        }
      }
      if (holding != null) {
        Globals.scenes.push(holding);
      }
      if (top.content.length < 1) {
        Globals.log.error("No top level actions, nothing will happen!");
      } else {
        switch (Globals.script_scale_type) {
          case defaults_default.SCALE_STRETCH:
            Globals.script_scale_x = Globals.display_width / Globals.script_width;
            Globals.script_scale_y = Globals.display_height / Globals.script_height;
            break;
          case defaults_default.SCALE_FIT:
          // todo
          case defaults_default.SCALE_NONE:
          default:
            break;
        }
        top.start();
        const dummyActionGroup = new ActionGroup();
        top.actionGroups.push(dummyActionGroup);
        Globals.scenes.push(top);
      }
    }
    stop() {
      this.enabled = false;
      this.actionGroups = [];
      for (let i = 0; i < this.sprites; i++) {
        const sprite = this.sprites[i];
        if (sprite.enabled) {
          sprite.pi_sprite.destroy();
        }
      }
      this.varList = null;
      this.sprites = [];
      this.images = [];
      this.completion_callback();
      this.completion_callback = null;
    }
    pause() {
      this.enabled = true;
    }
    resume() {
      this.enabled = false;
    }
    /**************************************************************************************************
    
        ######  ########    ###    ########  ########   ### ###   
       ##    ##    ##      ## ##   ##     ##    ##     ##     ##  
       ##          ##     ##   ##  ##     ##    ##    ##       ## 
        ######     ##    ##     ## ########     ##    ##       ## 
             ##    ##    ######### ##   ##      ##    ##       ## 
       ##    ##    ##    ##     ## ##    ##     ##     ##     ##  
        ######     ##    ##     ## ##     ##    ##      ### ###   
    
    **************************************************************************************************/
    start() {
      this.actionGroups = [];
      let action_group = new ActionGroup();
      let state = "T";
      let timestamp = Date.now();
      for (let i = 0; i < this.content.length; i++) {
        let trigger = null;
        let words = this.content[i].text.split(/\s+/);
        let line_no = this.content[i].number;
        let keyword = words.shift();
        words = words.join(" ");
        switch (keyword.toLowerCase()) {
          case "when":
            if (words.toLowerCase().startsWith("all")) {
              action_group.any_trigger = false;
            } else if (!words.toLowerCase().startsWith("any")) {
              Globals.log.error("Unknown when condition - " + words);
            }
            continue;
          // go to the next line
          case "do":
            continue;
          case "begin":
            trigger = new Begin(this, timestamp, "");
            break;
          case "end":
            trigger = new Trigger("ATEND", "");
            break;
          case "if":
          case "while":
            trigger = new IfWhile(this, timestamp, words, keyword);
            break;
          case "after":
            trigger = new After(this, timestamp, words);
            break;
          case "on":
            let on_word = words.shift();
            switch (on_word) {
              case "key":
                if (words[0] == "press") {
                  words.shift();
                }
                trigger = new Trigger("ONKEY", words);
                break;
              case "keypress":
                trigger = new Trigger("ONKEY", words);
                break;
              case "mouse":
                if (words[0] == "click") {
                  words.shift();
                }
                trigger = new Trigger("MOUSECLICK", words);
                break;
              default:
                Globals.log.error("Unknown trigger type on " + on_word + " at line " + line_no);
                break;
            }
            break;
          case "at":
            if (words[0] == "time") {
              words.shift();
            }
            trigger = new AtClass(this, timestamp, words);
            break;
          case "each":
            if (words[0] == "time") {
              words.shift();
            }
            trigger = new Each(this, timestamp, words);
            break;
          case "then":
            if (state == "T") {
              Globals.log.error("Then must be the only trigger in that group");
            } else {
              trigger = new ThenClass(this, timestamp, words, action_group);
            }
            break;
          case "every":
            trigger = new Every(this, timestamp, words);
            break;
          default:
            break;
        }
        if (trigger !== null) {
          if (state == "T") {
            action_group.addTrigger(trigger);
          } else {
            this.actionGroups.push(action_group);
            action_group = new ActionGroup();
            action_group.addTrigger(trigger);
            state = "T";
          }
          continue;
        }
        state = "A";
        if (action_group.triggers.length < 1) {
          Globals.log.error("No trigger for action in scene " + this.name + " at line " + line_no);
        }
        action_group.addAction(this.content[i]);
      }
      this.actionGroups.push(action_group);
      this.enabled = true;
    }
    /**************************************************************************************************
    
       ########  ##     ## ##    ##  ######   ########   #######  ##     ## ########  
       ##     ## ##     ## ###   ## ##    ##  ##     ## ##     ## ##     ## ##     ## 
       ##     ## ##     ## ####  ## ##        ##     ## ##     ## ##     ## ##     ## 
       ########  ##     ## ## ## ## ##   #### ########  ##     ## ##     ## ########  
       ##   ##   ##     ## ##  #### ##    ##  ##   ##   ##     ## ##     ## ##        
       ##    ##  ##     ## ##   ### ##    ##  ##    ##  ##     ## ##     ## ##        
       ##     ##  #######  ##    ##  ######   ##     ##  #######   #######  ##        
    
    **************************************************************************************************/
    runGroup(index, now) {
      let action_group = this.actionGroups[index];
      action_group.reset_count();
      let actions = action_group.actions;
      for (let i = 0; i < actions.length; i++) {
        let action = actions[i];
        this.runAction(action, action_group, now);
      }
    }
    /**************************************************************************************************
    
       ########  ##     ## ##    ##    ###     ######  ######## ####  #######  ##    ## 
       ##     ## ##     ## ###   ##   ## ##   ##    ##    ##     ##  ##     ## ###   ## 
       ##     ## ##     ## ####  ##  ##   ##  ##          ##     ##  ##     ## ####  ## 
       ########  ##     ## ## ## ## ##     ## ##          ##     ##  ##     ## ## ## ## 
       ##   ##   ##     ## ##  #### ######### ##          ##     ##  ##     ## ##  #### 
       ##    ##  ##     ## ##   ### ##     ## ##    ##    ##     ##  ##     ## ##   ### 
       ##     ##  #######  ##    ## ##     ##  ######     ##    ####  #######  ##    ## 
    
    **************************************************************************************************/
    runAction(action, action_group, now) {
      let words = this.varList.expand_vars(action.text);
      words = evaluate(words).split(/[\s,]+/);
      ;
      let line_no = action.number;
      if (words[0].match(/^and$/i)) {
        words.shift();
      }
      let command = words.shift().toLowerCase();
      if (command == "set" && words.length > 1) {
        switch (words[0]) {
          case "trans":
          case "transparency":
          case "fade":
            words.shift();
            Parser.test_word(words, "of");
            command = "fade";
            break;
          case "position":
          case "pos":
            words.shift();
            Parser.test_word(words, "of");
            command = "move";
            break;
          case "volume":
            words.shift();
            Parser.test_word(words, "to");
            command = "volume";
            break;
          case "blur":
          case "fuzz":
            words.shift();
            Parser.test_word(words, "of");
            command = "blur";
            break;
          default:
            command = "make";
            break;
        }
      }
      switch (command) {
        /**************************************************************************************************
        
        ########  ######  ##     ##  #######  
        ##       ##    ## ##     ## ##     ## 
        ##       ##       ##     ## ##     ## 
        ######   ##       ######### ##     ## 
        ##       ##       ##     ## ##     ## 
        ##       ##    ## ##     ## ##     ## 
        ########  ######  ##     ##  #######  
        
        **************************************************************************************************/
        case "echo":
        case "log":
          Globals.log.error(words.join(" "));
          action_group.complete_action("echo");
          break;
        /**************************************************************************************************
        
        ##        #######     ###    ########  
        ##       ##     ##   ## ##   ##     ## 
        ##       ##     ##  ##   ##  ##     ## 
        ##       ##     ## ##     ## ##     ## 
        ##       ##     ## ######### ##     ## 
        ##       ##     ## ##     ## ##     ## 
        ########  #######  ##     ## ########  
        
        **************************************************************************************************/
        case "load":
        case "upload":
          let tag = null;
          if (words.count < 1) {
            Globals.log.error("Missing filename at line " + line_no);
            break;
          }
          let filename = words.shift();
          Parser.test_word(words, ["named", "as"]);
          if (words.length > 0) {
            tag = words.shift();
          } else {
            let slash = filename.lastIndexOf("/");
            let dot = filename.lastIndexOf(".");
            tag = filename.slice(slash, dot);
          }
          action_group.complete_action("load");
          for (let j = 0; j < this.images.length; j++) {
            if (this.images[j].tag == tag) {
              continue;
            }
          }
          if (filename.endsWith(".jpg") || filename.endsWith(".jpeg") || filename.endsWith(".png")) {
            const sg_image = new SG_image(this.folder + filename, tag);
            this.images.push(sg_image);
            sg_image.load_image();
          } else if (filename.endsWith(".wav") || filename.endsWith(".mp3")) {
            AudioManager.create(tag, this.folder + filename);
          }
          action_group.complete_action("load");
          break;
        /**************************************************************************************************
        
        ######## ########   #######  ##     ## 
        ##       ##     ## ##     ## ###   ### 
        ##       ##     ## ##     ## #### #### 
        ######   ########  ##     ## ## ### ## 
        ##       ##   ##   ##     ## ##     ## 
        ##       ##    ##  ##     ## ##     ## 
        ##       ##     ##  #######  ##     ## 
        
        **************************************************************************************************/
        case "from":
        case "using":
        case "with":
          if (words.length > 0) {
            this.folder = words[0] + "/";
          } else {
            Globals.log.error("Expected folder name at " + line_no);
          }
          action_group.complete_action("from");
          break;
        /**************************************************************************************************
        
        ########  ##          ###     ######  ######## 
        ##     ## ##         ## ##   ##    ## ##       
        ##     ## ##        ##   ##  ##       ##       
        ########  ##       ##     ## ##       ######   
        ##        ##       ######### ##       ##       
        ##        ##       ##     ## ##    ## ##       
        ##        ######## ##     ##  ######  ######## 
        
        **************************************************************************************************/
        case "place":
          if (words.length > 0) {
            let image_tag = words.shift();
            let sprite_tag = image_tag;
            if (Parser.test_word(words, ["named", "as"])) {
              sprite_tag = Parser.get_word(words, image_tag);
            }
            let sg_sprite = new SG_sprite(image_tag, sprite_tag);
            let hidden = Parser.test_word(words, "hidden");
            if (hidden) {
              sg_sprite.set_visibility(false);
            }
            Parser.test_word(words, "at");
            sg_sprite.loc_x.set_target_value(Parser.get_int(words, 0) * Globals.script_scale_x);
            sg_sprite.loc_y.set_target_value(Parser.get_int(words, 0) * Globals.script_scale_y);
            Parser.test_word(words, "depth");
            sg_sprite.depth = Parser.get_int(words, 0);
            Parser.test_word(words, ["size", "scale"]);
            sg_sprite.size_x.set_target_value(Parser.get_int(words, 0) * Globals.script_scale_x);
            sg_sprite.size_y.set_target_value(Parser.get_int(words, 0) * Globals.script_scale_y);
            this.sprites.push(sg_sprite);
          } else {
            Globals.log.error("Missing place data at line " + line_no);
          }
          action_group.complete_action("place");
          break;
        /**************************************************************************************************
        
        ########  ######## ########  ##          ###     ######  ######## 
        ##     ## ##       ##     ## ##         ## ##   ##    ## ##       
        ##     ## ##       ##     ## ##        ##   ##  ##       ##       
        ########  ######   ########  ##       ##     ## ##       ######   
        ##   ##   ##       ##        ##       ######### ##       ##       
        ##    ##  ##       ##        ##       ##     ## ##    ## ##       
        ##     ## ######## ##        ######## ##     ##  ######  ######## 
        
        **************************************************************************************************/
        case "replace":
          if (words.length > 0) {
            let sprite_tag = words.shift();
            Parser.test_word(words, "with");
            let image_tag = words.shift();
            let hidden = Parser.test_word(words, "hidden");
            let sg_sprite = SG_sprite.get_sprite(sprite_tag);
            if (hidden) {
              sg_sprite.set_visibility(false);
            }
            sg_sprite.image_tag = image_tag;
            sg_sprite.pi_sprite.texture = PIXI.Texture.EMPTY;
          } else {
            Globals.log.error("Missing replace data at line " + line_no);
          }
          action_group.complete_action("replace");
          break;
        /**************************************************************************************************
        
        ########  ##     ## ######## 
        ##     ## ##     ##    ##    
        ##     ## ##     ##    ##    
        ########  ##     ##    ##    
        ##        ##     ##    ##    
        ##        ##     ##    ##    
        ##         #######     ##    
        
        **************************************************************************************************/
        case "put":
          if (words.length > 0) {
            let image_tag = words.shift();
            let sprite_tag = null;
            if (Parser.test_word(words, "named")) {
              sprite_tag = Parser.get_word(words, image_tag);
            }
            let sg_sprite = new SG_sprite(image_tag, sprite_tag);
            Parser.test_word(words, ["as", "at"]);
            const location = Parser.test_word(words, ["background", "top", "bottom", "left", "right", "ground", "sky"]);
            if (location == false) {
              Globals.log.error("Unknown location at line " + line_no);
              break;
            }
            if (sprite_tag == null) {
              sprite_tag = location;
            }
            Parser.test_word(words, "depth");
            sg_sprite.depth = Parser.get_int(words, 0);
            sg_sprite.location = location;
            this.sprites.push(sg_sprite);
          } else {
            Globals.log.error("Missing put data at line " + line_no);
          }
          action_group.complete_action("put");
          break;
        /**************************************************************************************************
        
        ########  ##          ###    ##    ## 
        ##     ## ##         ## ##    ##  ##  
        ##     ## ##        ##   ##    ####   
        ########  ##       ##     ##    ##    
        ##        ##       #########    ##    
        ##        ##       ##     ##    ##    
        ##        ######## ##     ##    ##    
        
        **************************************************************************************************/
        case "play":
          if (words.length > 0) {
            const tag2 = words.shift();
            Parser.test_word(words, "fade");
            Parser.test_word(words, "in");
            const fadein = Parser.get_duration(words, 0);
            Parser.test_word(words, "at");
            Parser.test_word(words, "volume");
            const volume = Parser.get_int(words, 50, defaults_default.VOLUME_MIN, defaults_default.VOLUME_MAX);
            AudioManager.play(tag2, { fadeInMs: fadein * 1e3, targetVolume: volume });
          } else {
            Globals.log.error("Nothing to play at line " + line_no);
          }
          action_group.complete_action("play");
          break;
        /**************************************************************************************************
        
        ##     ##  #######  ##       ##     ## ##     ## ######## 
        ##     ## ##     ## ##       ##     ## ###   ### ##       
        ##     ## ##     ## ##       ##     ## #### #### ##       
        ##     ## ##     ## ##       ##     ## ## ### ## ######   
        ##   ##  ##     ## ##       ##     ## ##     ## ##       
            ## ##   ##     ## ##       ##     ## ##     ## ##       
            ###     #######  ########  #######  ##     ## ######## 
        
        **************************************************************************************************/
        case "volume":
          if (words.length > 0) {
            Parser.test_word(words, "of");
            const tag2 = words.shift();
            Parser.test_word(words, "to");
            const volume = Parser.get_int(words, 0, defaults_default.VOLUME_MIN, defaults_default.VOLUME_MAX);
            Parser.test_word(words, "in");
            const fadein = Parser.get_duration(words, 0);
            AudioManager.setVolume(tag2, volume, { fadeMs: fadein * 1e3 });
          } else {
            Globals.log.error("No volume change at line " + line_no);
          }
          action_group.complete_action("volume");
          break;
        /**************************************************************************************************
        
        ##     ##  #######  ##     ## ######## 
        ###   ### ##     ## ##     ## ##       
        #### #### ##     ## ##     ## ##       
        ## ### ## ##     ## ##     ## ######   
        ##     ## ##     ##  ##   ##  ##       
        ##     ## ##     ##   ## ##   ##       
        ##     ##  #######     ###    ######## 
        
        **************************************************************************************************/
        case "move":
          if (words.length > 0) {
            let by_or_to = "to";
            let sprite_tag = words.shift();
            by_or_to = Parser.get_word(words, ["by", "to"]);
            if (by_or_to === false) {
              Globals.log.error("Expected by or to on line " + line_no);
              break;
            }
            let x = Parser.get_int(words, 0) * Globals.script_scale_x;
            let y = Parser.get_int(words, 0) * Globals.script_scale_y;
            let in_or_at = Parser.test_word(words, ["in", "at"]);
            if (in_or_at === false) {
              Globals.log.error("Expected in or at on line " + line_no);
              break;
            }
            let duration2 = Parser.get_duration(words, 0);
            let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
            sprite.move(x, y, by_or_to, in_or_at, duration2, now, makeCompletionCallback(action_group));
          } else {
            Globals.log.error("Missing move data at line " + line_no);
            action_group.complete_action("moveX");
          }
          break;
        /**************************************************************************************************
        
        ########  ########  ######  #### ######## ######## 
        ##     ## ##       ##    ##  ##       ##  ##       
        ##     ## ##       ##        ##      ##   ##       
        ########  ######    ######   ##     ##    ######   
        ##   ##   ##             ##  ##    ##     ##       
        ##    ##  ##       ##    ##  ##   ##      ##       
        ##     ## ########  ######  #### ######## ######## 
        
        **************************************************************************************************/
        case "resize":
          if (words.length > 0) {
            let sprite_tag = words.shift();
            let to_or_by = Parser.get_word(words, ["to", "by"]);
            if (to_or_by === false) {
              Globals.log.error("Expected to or by on line " + line_no);
              break;
            }
            let w = Parser.get_int(words, 0) * Globals.script_scale_x;
            let h = Parser.get_int(words, 0) * Globals.script_scale_y;
            let in_or_at = Parser.test_word(words, ["in", "at"]);
            if (in_or_at === false) {
              Globals.log.error("Expected in or at on line " + line_no);
              break;
            }
            let duration2 = Parser.get_duration(words, 0);
            let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
            sprite.resize(
              w,
              h,
              to_or_by,
              in_or_at,
              duration2,
              now,
              makeCompletionCallback(action_group)
            );
          } else {
            Globals.log.error("Missing resize data at line " + line_no);
          }
          break;
        /**************************************************************************************************
        
        ########  ######## ##     ##  #######  ##     ## ######## 
        ##     ## ##       ###   ### ##     ## ##     ## ##       
        ##     ## ##       #### #### ##     ## ##     ## ##       
        ########  ######   ## ### ## ##     ## ##     ## ######   
        ##   ##   ##       ##     ## ##     ##  ##   ##  ##       
        ##    ##  ##       ##     ## ##     ##   ## ##   ##       
        ##     ## ######## ##     ##  #######     ###    ######## 
        
        **************************************************************************************************/
        case "remove":
        case "erase":
        case "delete":
          while (words.length) {
            const item = words.shift();
            if (AudioManager.exists(item)) {
              AudioManager.delete(item);
            } else {
              SG_sprite.remove_sprite(this.name, item);
            }
          }
          action_group.complete_action("remove");
          break;
        /**************************************************************************************************
        
        ########   #######  ########    ###    ######## ######## 
        ##     ## ##     ##    ##      ## ##      ##    ##       
        ##     ## ##     ##    ##     ##   ##     ##    ##       
        ########  ##     ##    ##    ##     ##    ##    ######   
        ##   ##   ##     ##    ##    #########    ##    ##       
        ##    ##  ##     ##    ##    ##     ##    ##    ##       
        ##     ##  #######     ##    ##     ##    ##    ######## 
        
        **************************************************************************************************/
        case "rotate":
        case "turn":
          if (words.length > 0) {
            let sprite_tag = words.shift();
            let turn_type = Parser.test_word(words, ["to", "by", "at"], "to");
            let value2 = Parser.get_int(words, 0);
            let dur_type = Parser.test_word(words, ["in", "per"], "in");
            let duration2 = Parser.get_duration(words, 0);
            let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
            sprite.rotate(turn_type, value2, dur_type, duration2, now, makeCompletionCallback(action_group));
          } else {
            Globals.log.error("Missing rotate data at line " + line_no);
            action_group.complete_action("rotateX");
          }
          break;
        /**************************************************************************************************
        
        ######## ##     ## ########   #######  ##      ## 
            ##    ##     ## ##     ## ##     ## ##  ##  ## 
            ##    ##     ## ##     ## ##     ## ##  ##  ## 
            ##    ######### ########  ##     ## ##  ##  ## 
            ##    ##     ## ##   ##   ##     ## ##  ##  ## 
            ##    ##     ## ##    ##  ##     ## ##  ##  ## 
            ##    ##     ## ##     ##  #######   ###  ###  
        
        **************************************************************************************************/
        case "throw":
        case "launch":
          if (words.length > 0) {
            let sprite_tag = words.shift();
            const stop_or_at = Parser.test_word(words, ["at", "stop"], "at");
            let angle = Parser.get_int(words, 0);
            Parser.test_word(words, ["deg", "degs", "degrees"]);
            Parser.test_word(words, "with");
            Parser.test_word(words, ["force", "velocity", "speed"]);
            let initial_velocity = Parser.get_int(words, 10);
            let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
            if (stop_or_at == "stop") {
              sprite.throw("stop");
            } else {
              sprite.throw(angle, initial_velocity, now, makeCompletionCallback(action_group));
            }
          } else {
            Globals.log.error("Missing throw data at line " + line_no);
          }
          break;
        /**************************************************************************************************
        
        ########  ########   #######  ########  
        ##     ## ##     ## ##     ## ##     ## 
        ##     ## ##     ## ##     ## ##     ## 
        ##     ## ########  ##     ## ########  
        ##     ## ##   ##   ##     ## ##        
        ##     ## ##    ##  ##     ## ##        
        ########  ##     ##  #######  ##        
        
        **************************************************************************************************/
        case "drop":
          if (words.length > 0) {
            let sprite_tag = words.shift();
            let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
            if (Parser.test_word(words, "stop")) {
              sprite.throw("stop");
            } else {
              sprite.throw(180, 0, now, makeCompletionCallback(action_group));
            }
          } else {
            Globals.log.error("Missing drop data at line " + line_no);
          }
          break;
        /**************************************************************************************************
        
        ######  ##     ##  #######  ##      ##       ## ##     ## #### ########  ######## 
        ##    ## ##     ## ##     ## ##  ##  ##      ##  ##     ##  ##  ##     ## ##       
        ##       ##     ## ##     ## ##  ##  ##     ##   ##     ##  ##  ##     ## ##       
        ######  ######### ##     ## ##  ##  ##    ##    #########  ##  ##     ## ######   
                ## ##     ## ##     ## ##  ##  ##   ##     ##     ##  ##  ##     ## ##       
        ##    ## ##     ## ##     ## ##  ##  ##  ##      ##     ##  ##  ##     ## ##       
        ######  ##     ##  #######   ###  ###  ##       ##     ## #### ########  ######## 
        
        **************************************************************************************************/
        case "show":
        case "hide":
        case "toggle":
          if (words.length > 0) {
            let sprite_tag = words.shift();
            let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
            if (command == "show") {
              sprite.set_visibility(true);
            } else if (command == "hide") {
              sprite.set_visibility(false);
            } else if (command == "toggle") {
              sprite.set_visibility("toggle");
            }
          } else {
            Globals.log.error("Missing sprite tag at line " + line_no);
          }
          action_group.complete_action();
          break;
        /**************************************************************************************************
        
        ######  ########    ###    ########  ########       ##  ######  ########  #######  ########  
        ##    ##    ##      ## ##   ##     ##    ##         ##  ##    ##    ##    ##     ## ##     ## 
        ##          ##     ##   ##  ##     ##    ##        ##   ##          ##    ##     ## ##     ## 
        ######     ##    ##     ## ########     ##       ##     ######     ##    ##     ## ########  
                ##    ##    ######### ##   ##      ##      ##           ##    ##    ##     ## ##        
        ##    ##    ##    ##     ## ##    ##     ##     ##      ##    ##    ##    ##     ## ##        
        ######     ##    ##     ## ##     ##    ##    ##        ######     ##     #######  ##        
        
        **************************************************************************************************/
        case "start":
          if (words.length > 0) {
            for (let i = 0; i < words.length; i++) {
              const scene = _Scene.find(words[i]);
              if (scene !== false) {
                this.completion_callback = makeCompletionCallback(action_group);
                scene.start();
              }
            }
          } else {
            Globals.log.error("Missing scene name at line " + line_no);
          }
          action_group.complete_action("start");
          break;
        /**************************************************************************************************
        
        ######  ########  #######  ########  
        ##    ##    ##    ##     ## ##     ## 
        ##          ##    ##     ## ##     ## 
        ######     ##    ##     ## ########  
                ##    ##    ##     ## ##        
        ##    ##    ##    ##     ## ##        
        ######     ##     #######  ##        
        
        **************************************************************************************************/
        case "stop":
          this.completion_callback = makeCompletionCallback(action_group);
          if (words.length > 0) {
            for (let i = 0; i < words.length; i++) {
              if (AudioManager.exists(words[i])) {
                AudioManager.delete(words[i]);
              } else {
                const scene = _Scene.find(words[i]);
                if (scene !== false) {
                  scene.stop();
                }
              }
            }
          } else {
            this.stop();
          }
          action_group.complete_action("stop");
          break;
        /**************************************************************************************************
        
        ##       ######## ########       ## ##     ##    ###    ##    ## ######## 
        ##       ##          ##         ##  ###   ###   ## ##   ##   ##  ##       
        ##       ##          ##        ##   #### ####  ##   ##  ##  ##   ##       
        ##       ######      ##       ##    ## ### ## ##     ## #####    ######   
        ##       ##          ##      ##     ##     ## ######### ##  ##   ##       
        ##       ##          ##     ##      ##     ## ##     ## ##   ##  ##       
        ######## ########    ##    ##       ##     ## ##     ## ##    ## ######## 
        
        **************************************************************************************************/
        case "let":
        case "make":
          if (words.length > 0) {
            let varName = words.shift();
            Parser.test_word(words, ["be", "to"]);
            this.varList.create(varName, words.join(" "));
          } else {
            Globals.log.error("Missing variable name at line " + line_no);
          }
          action_group.complete_action("let");
          break;
        /**************************************************************************************************
        
        ######## ##       ####  ######  ##    ## ######## ########  
        ##       ##        ##  ##    ## ##   ##  ##       ##     ## 
        ##       ##        ##  ##       ##  ##   ##       ##     ## 
        ######   ##        ##  ##       #####    ######   ########  
        ##       ##        ##  ##       ##  ##   ##       ##   ##   
        ##       ##        ##  ##    ## ##   ##  ##       ##    ##  
        ##       ######## ####  ######  ##    ## ######## ##     ## 
        
        **************************************************************************************************/
        case "flicker":
          if (words.length > 0) {
            let sprite_tag = words.shift();
            let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
            let on_off = Parser.test_word(words, ["by", "stop"]);
            if (on_off == "stop") {
              sprite.flicker(0, 0);
            } else {
              let flicker_size = Parser.get_int(words, 0, 0, 50) * Globals.script_scale_x;
              Parser.test_word(words, "with");
              Parser.test_word(words, "chance");
              let flicker_chance = Parser.get_int(words, 50);
              sprite.flicker(flicker_size, flicker_chance);
            }
          } else {
            Globals.log.error("Missing values at line " + line_no);
          }
          action_group.complete_action("flicker");
          break;
        /**************************************************************************************************
        
                ## ####  ######    ######   ##       ######## 
                ##  ##  ##    ##  ##    ##  ##       ##       
                ##  ##  ##        ##        ##       ##       
                ##  ##  ##   #### ##   #### ##       ######   
        ##    ##  ##  ##    ##  ##    ##  ##       ##       
        ##    ##  ##  ##    ##  ##    ##  ##       ##       
        ######  ####  ######    ######   ######## ######## 
        
        **************************************************************************************************/
        case "jiggle":
        case "jitter":
          if (words.length > 0) {
            let sprite_tag = words.shift();
            let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
            let on_off = Parser.test_word(words, ["by", "stop"]);
            if (on_off == "stop") {
              sprite.jiggle(0, 0, 0);
            } else {
              let jiggle_x = Parser.get_int(words, 0) * Globals.script_scale_x;
              let jiggle_y = Parser.get_int(words, 0) * Globals.script_scale_y;
              let jiggle_r = Parser.get_int(words, 0);
              Parser.test_word(words, "with");
              Parser.test_word(words, "chance");
              let jiggle_chance = Parser.get_int(words, 50);
              sprite.jiggle(jiggle_x, jiggle_y, jiggle_r, jiggle_chance);
            }
          } else {
            Globals.log.error("Missing values at line " + line_no);
          }
          action_group.complete_action("jiggle");
          break;
        /**************************************************************************************************
        
        ######## ##          ###     ######  ##     ## 
        ##       ##         ## ##   ##    ## ##     ## 
        ##       ##        ##   ##  ##       ##     ## 
        ######   ##       ##     ##  ######  ######### 
        ##       ##       #########       ## ##     ## 
        ##       ##       ##     ## ##    ## ##     ## 
        ##       ######## ##     ##  ######  ##     ## 
        
        **************************************************************************************************/
        case "flash":
          if (words.length > 0) {
            let sprite_tag = words.shift();
            let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
            let flash_count = Parser.get_int(words, 0, 1, 10);
            sprite.flash(flash_count, now);
          } else {
            Globals.log.error("Missing values at line " + line_no);
          }
          action_group.complete_action("flash");
          break;
        /**************************************************************************************************
        
        ########  ##       #### ##    ## ##    ## 
        ##     ## ##        ##  ###   ## ##   ##  
        ##     ## ##        ##  ####  ## ##  ##   
        ########  ##        ##  ## ## ## #####    
        ##     ## ##        ##  ##  #### ##  ##   
        ##     ## ##        ##  ##   ### ##   ##  
        ########  ######## #### ##    ## ##    ## 
        
        **************************************************************************************************/
        case "blink":
          if (words.length > 0) {
            let sprite_tag = words.shift();
            let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
            let on_off = Parser.test_word(words, ["at", "stop"]);
            if (on_off == "stop") {
              sprite.blink(0, 0, now);
            } else {
              let blink_rate = Parser.get_int(words, 0, 1, 10);
              Parser.test_word(words, "per");
              Parser.test_word(words, "second");
              Parser.test_word(words, "with");
              Parser.test_word(words, "chance");
              let blink_chance = Parser.get_int(words, 100, 0, 100);
              sprite.blink(blink_rate, blink_chance, now);
            }
          } else {
            Globals.log.error("Missing values at line " + line_no);
          }
          action_group.complete_action("blink");
          break;
        /**************************************************************************************************
        
        ########  ##     ## ##        ######  ######## 
        ##     ## ##     ## ##       ##    ## ##       
        ##     ## ##     ## ##       ##       ##       
        ########  ##     ## ##        ######  ######   
        ##        ##     ## ##             ## ##       
        ##        ##     ## ##       ##    ## ##       
        ##         #######  ########  ######  ######## 
        
        **************************************************************************************************/
        case "pulse":
        case "pulsate":
          if (words.length > 0) {
            let sprite_tag = words.shift();
            let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
            let on_off = Parser.test_word(words, "stop");
            if (on_off == "stop") {
              sprite.pulse(0, 0, 100, now);
            } else {
              Parser.test_word(words, "at");
              let pulse_rate = Parser.get_int(words, 0, 1, 10);
              Parser.test_word(words, "per");
              Parser.test_word(words, "second");
              Parser.test_word(words, "from");
              let pulse_min = Parser.get_int(words, 0, 0, 100);
              Parser.test_word(words, "to");
              let pulse_max = Parser.get_int(words, 0, 100, 100);
              sprite.pulse(pulse_rate, pulse_min, pulse_max, now);
            }
          } else {
            Globals.log.error("Missing values at line " + line_no);
          }
          action_group.complete_action("pulse");
          break;
        /**************************************************************************************************
        
        ########    ###    ########  ######## 
        ##         ## ##   ##     ## ##       
        ##        ##   ##  ##     ## ##       
        ######   ##     ## ##     ## ######   
        ##       ######### ##     ## ##       
        ##       ##     ## ##     ## ##       
        ##       ##     ## ########  ######## 
        
        **************************************************************************************************/
        case "fade":
        case "trans":
          if (words.length > 0) {
            let sprite_tag = words.shift();
            let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
            let fade_type = Parser.test_word(words, ["to", "by", "up", "down"], "to");
            let value2 = Parser.get_int(words, 100);
            Parser.test_word(words, "in");
            let duration2 = Parser.get_duration(words, 0);
            if (sprite != null) {
              sprite.set_trans(value2, duration2, fade_type, now, makeCompletionCallback(action_group));
            }
          } else {
            Globals.log.error("Missing fade parameters");
          }
          break;
        /**************************************************************************************************
        
        ########  ##       ##     ## ########  
        ##     ## ##       ##     ## ##     ## 
        ##     ## ##       ##     ## ##     ## 
        ########  ##       ##     ## ########  
        ##     ## ##       ##     ## ##   ##   
        ##     ## ##       ##     ## ##    ##  
        ########  ########  #######  ##     ## 
        
        **************************************************************************************************/
        case "blur":
        case "fuzz":
          if (words.length > 0) {
            let sprite_tag = words.shift();
            let sprite = SG_sprite.get_sprite(this.name, sprite_tag);
            let blur_type = Parser.test_word(words, ["to", "by", "up", "down"], "to");
            let value2 = Parser.get_int(words, 100);
            Parser.test_word(words, "in");
            let duration2 = Parser.get_duration(words, 0);
            if (sprite != null) {
              sprite.set_blur(value2, duration2, blur_type, now, makeCompletionCallback(action_group));
            }
          } else {
            Globals.log.error("Missing fade parameters");
          }
          break;
        /**************************************************************************************************
        
        ##      ##    ###    #### ######## 
        ##  ##  ##   ## ##    ##     ##    
        ##  ##  ##  ##   ##   ##     ##    
        ##  ##  ## ##     ##  ##     ##    
        ##  ##  ## #########  ##     ##    
        ##  ##  ## ##     ##  ##     ##    
        ###  ###  ##     ## ####    ##    
        
        **************************************************************************************************/
        case "wait":
          let duration = Parser.get_duration(words, 5);
          this.timers.push(new Timer(now, duration, makeCompletionCallback(action_group)));
          break;
        /**************************************************************************************************
        
        ######## #### ##    ## ####  ######  ##     ## 
        ##        ##  ###   ##  ##  ##    ## ##     ## 
        ##        ##  ####  ##  ##  ##       ##     ## 
        ######    ##  ## ## ##  ##   ######  ######### 
        ##        ##  ##  ####  ##        ## ##     ## 
        ##        ##  ##   ###  ##  ##    ## ##     ## 
        ##       #### ##    ## ####  ######  ##     ## 
        
        **************************************************************************************************/
        case "finish":
          Globals.app.stop();
          break;
        default:
          Globals.log.error("Unknown command: " + command);
          break;
      }
    }
  };

  // src/main.js
  var SlowGlass = class _SlowGlass {
    static next_action_run = 0;
    static next_sprite_update = 0;
    static sg_id = "body";
    constructor() {
    }
    async run() {
      await Globals.app.init({
        // resizeTo: window,
        background: "#dfdfdf",
        width: Globals.display_width,
        height: Globals.display_height
      });
      document.onkeydown = function(e) {
        Globals.event("onkeydown", e.key);
      };
      document.onkeyup = function(e) {
        Globals.event("onkeyup", e.key);
      };
      const pixi = document.getElementById(_SlowGlass.sg_id);
      pixi.appendChild(Globals.app.canvas);
      Globals.root = new PIXI.Container();
      Globals.app.stage.addChild(Globals.root);
      Globals.app.ticker.add(this.update);
    }
    update(ticker) {
      let current_millis = Date.now();
      if (_SlowGlass.next_action_run < current_millis) {
        if (Globals.app.screen.width != Globals.display_width) {
          Globals.app.screen.width = Globals.display_width;
        }
        if (Globals.app.screen.height != Globals.display_height) {
          Globals.app.screen.height = Globals.display_height;
        }
        for (let i = 0; i < Globals.scenes.length; i++) {
          let current = Globals.scenes[i];
          if (!current.enabled) {
            continue;
          }
          for (let j = 0; j < current.timers.length; j++) {
            if (current.timers[j].expired(current_millis)) {
              current.timers.splice(j, 1);
            }
          }
          for (let j = 0; j < current.actionGroups.length; j++) {
            let do_run = false;
            let triggers = current.actionGroups[j].triggers;
            for (let k = 0; k < triggers.length; k++) {
              if (triggers[k].fired(current_millis)) {
                current.varList.trigger = triggers[k].constructor.name;
                do_run = true;
                if (current.actionGroups[j].any_trigger) {
                  break;
                }
              } else {
                do_run = false;
                if (!current.actionGroups[j].any_trigger) {
                  break;
                }
              }
            }
            if (do_run) {
              current.runGroup(j, current_millis);
            }
          }
        }
        _SlowGlass.next_action_run = current_millis + defaults_default.TRIGGER_RATE;
      }
      if (_SlowGlass.next_sprite_update < current_millis) {
        for (let i = 0; i < Globals.scenes.length; i++) {
          let current = Globals.scenes[i];
          if (!current.enabled) {
            continue;
          }
          for (let j = 0; j < current.sprites.length; j++) {
            current.sprites[j].update(current.name, current_millis);
          }
        }
        _SlowGlass.next_sprite_update = current_millis + defaults_default.SPRITE_RATE;
      }
    }
    async scriptFromURL(url) {
      Globals.log.debug("Starting Slow Glass from " + window.sg_filename);
      this.cleanUp();
      const response = await fetch(url);
      if (!response.ok) {
        Globals.log.error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      const text = await response.text();
      Scene2.readFromText(text);
      run();
    }
    interactiveAction(text) {
      const dummyLine = new Line(1, text);
      const topScene = Scene2.find(defaults_default.MAIN_NAME);
      const dummyActionGroupIndex = topScene.actionGroups.length - 1;
      topScene.runAction(dummyLine, topScene.actionGroups[dummyActionGroupIndex], Date.now());
    }
    setDrawingParent(elementID) {
      _SlowGlass.sg_id = elementID;
    }
    cleanUp() {
      AudioManager.deleteAll();
      if (Globals.app != null) {
        Globals.app.destroy(
          { removeView: true },
          // removes the canvas element from the DOM
          {
            children: true,
            // destroy all children in the stage
            texture: true,
            // destroy textures used by children
            textureSource: true
            // destroy the underlying GPU texture sources
          }
        );
      }
      Globals.reset();
      Globals.app = new PIXI.Application();
    }
    scriptFromText(text) {
      Globals.log.debug("Starting Slow Glass from textarea");
      this.cleanUp();
      Scene2.readFromText(text);
      this.run();
    }
  };
  window.slowGlass = new SlowGlass();
})();
//# sourceMappingURL=slow-glass.js.map
