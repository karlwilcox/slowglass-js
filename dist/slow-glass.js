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
      this.acceleration_rate = 0;
      this.acceleration_time = 0;
      this.position_callback = null;
      this.accelerate_callback = null;
      this.sway_limit = 0;
      this.sway_step = 0;
      this.sway_rate = 0;
      this.sway_up = false;
      this.sway_chance = 0;
      this.last_sway = 0;
    }
    value() {
      return this.current_value + this.jig_step + this.sway_step;
    }
    speed() {
      return this.delta_value;
    }
    sway_stop() {
      this.sway_limit = 0;
      this.sway_step = 0;
      this.sway_rate = 0;
      this.sway_chance = 0;
    }
    sway_start(limit, rate, chance) {
      this.sway_limit = limit;
      this.sway_rate = rate * 1e3;
      this.sway_chance = chance;
      this.sway_step = 0;
      this.sway_up = true;
      this.last_sway = Date.now();
    }
    stop() {
      if (typeof this.position_callback === "function") {
        this.position_callback("stop");
      }
      if (typeof this.acceleration_callback === "function") {
        this.acceleration_callback("stop");
      }
      this.delta_value = 0;
      this.changing = false;
    }
    set_speed(delta) {
      if (Math.abs(delta) > 0) {
        this.delta_value = delta;
        this.changing = true;
      }
    }
    accelerate(rate, seconds, timestamp, callback) {
      if (arguments.length == 1) {
        seconds = 0;
      }
      if (arguments.length == 2) {
        timestamp = Date.now();
      }
      if (arguments.length > 3) {
        this.acceleration_callback = callback;
      }
      this.acceleration_rate = rate;
    }
    // adjust(delta) {
    //     let new_value = this.value + delta;
    //     // but check limits
    //     if ( new_value < this.lower_limit ) {
    //         new_value = this.wrap ? this.upper_limit : this.lower_limit;
    //     } else if ( new_value > this.upper_limit ) {
    //         new_value = this.wrap ? this.lower_limit : this.upper_limit;
    //     }
    //     this.value = this.new_value;
    // }
    // Some things need to be kept in step (e.g. size and scale) without triggering
    // an update, so do it here.
    force_value(value2) {
      this.value = value2;
      this.delta_value = 0;
      this.changing = false;
    }
    set_target_value(target, seconds, timestamp, callback) {
      if (arguments.length == 1) {
        seconds = 0;
      }
      if (arguments.length == 2) {
        timestamp = Date.now();
      }
      if (arguments.length > 3) {
        this.position_callback = callback;
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
          this.position_callback("adjustable");
        }
      } else {
        this.delta_value = (this.target_value - this.current_value) / (seconds * 1e3);
        this.last_adjustment = timestamp;
      }
      this.changing = true;
    }
    update_value() {
      let updated = false;
      let this_adjustment = Date.now();
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
      if (this.sway_limit > 0) {
        if (Math.random() * 100 < this.sway_chance) {
          let step = this.sway_limit / this.sway_rate * (this_adjustment - this.last_sway);
          if (this.sway_up) {
            this.sway_step += step;
            if (this.sway_step > this.sway_limit) {
              this.sway_step = this.sway_limit;
              this.sway_up = false;
            }
          } else {
            this.sway_step -= step;
            if (this.sway_step < this.sway_limit * -1) {
              this.sway_step = this.sway_limit * -1;
              this.sway_up = true;
            }
          }
          this.last_sway = this_adjustment;
          updated = true;
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
          this.position_callback("adjustable");
        }
      } else {
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
    GRAVITY_PS2: 100,
    // force of gravity in pixels per second per second
    BOUNDS_X: 2,
    // Multiplier for display width for bounds checking
    BOUNDS_Y: 2,
    // Multiplier for display height for bounds checking
    DEPTH_BACKGROUND: 1,
    DEPTH_SKY: 100,
    DEPTH_GROUND: 200,
    DEPTH_LEFT: 300,
    DEPTH_RIGHT: 301,
    DEPTH_FOREGROUND: 400,
    DEPTH_FRAME: 1e3,
    SPRITE_IMAGE: "_IMAGE_",
    SPRITE_TEXT: "_TEXT_",
    SPRITE_GRAPHIC: "_GRAPHIC_",
    SCENE_STOPPED: "_STOPPED_",
    SCENE_RUNNING: "_RUNNING_",
    SCENE_PAUSED: "_PAUSED_"
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
    static hemisphere = null;
    constructor(sceneName) {
      this.variables = [];
      this.trigger = null;
      this.sceneName = sceneName;
      getHemisphere();
    }
    set_value(name, value2) {
      if (_VarList.built_in(name)) {
        Globals.log.error("Cannot create built-in variable " + name);
      } else if (name.match(/[\.:]/)) {
        Globals.log.error("Cannot create variable with dot or colon in name " + name);
      } else {
        const index = this.find(name);
        if (index !== false) {
          this.variables[index].setValue(value2);
        } else {
          this.variables.push(new Variable(name, value2));
        }
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
          return date.getHours() > 6 && date.getHour() < 13 ? defaults_default.TRUEVALUE : defaults_default.FALSEVALUE;
        case "AFTERNOON":
          return date.getHours() > 11 && date.getHour() < 18 ? defaults_default.TRUEVALUE : defaults_default.FALSEVALUE;
        case "EVENING":
          return date.getHours() > 18 && date.getHour() < 22 ? defaults_default.TRUEVALUE : defaults_default.FALSEVALUE;
        case "NIGHT":
          return t_or_f(date.getHours() > 22 || date.getHour() < 6);
        case "KEY":
          return Globals.key == null ? defaults_default.NOTFOUND : Globals.key;
        case "LASTKEY":
          return Globals.lastKey == null ? defaults_default.NOTFOUND : Globals.lastKey;
        case "SCALEX":
          return Globals.script_scale_x;
        case "SCALEY":
          return Globals.script_scale_y;
        case "SCENE":
          return this.sceneName;
        case "PARAMS":
        case "PARAMETERS":
          const scene = Scene2.find(this.sceneName);
          return scene.parameters;
        case "ELAPSED":
          return Math.floor((Date.now() - Globals.start_time) / 1e3);
        case "MILLIS":
        case "MS":
          return (Date.now() - Globals.start_time) / 1e3;
        default:
          return false;
      }
    }
    static scene_var(varName) {
      let value2 = "NONE";
      const parts = varName.split(/:/);
      const scene = Scene2.find(parts[0]);
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
    get_value(varName) {
      let value2 = false;
      let sceneName = this.sceneName;
      if (varName.match(/:/)) {
        const colonParts = varName.split(/:/);
        varName = colonParts[1];
        sceneName = colonParts[0];
      }
      if (["SPRITES", "IMAGES", "IMGS"].includes(varName)) {
        const scene = Scene2.find(sceneName);
        if (scene) {
          switch (varName.charAt(0)) {
            case "S":
              value2 = scene.list_sprites(false);
              break;
            case "I":
              value2 = scene.list_images(false);
              break;
            default:
              break;
          }
        } else {
          value2 = defaults_default.NOTFOUND;
        }
      }
      if (value2 === false && varName.match(/\./)) {
        const parts = varName.split(/\./, 2);
        const sprite = SG_sprite.get_sprite(sceneName, parts[0], false);
        if (sprite != null) {
          switch (parts[1]) {
            case "x":
            case "loc.x":
            case "location.x":
            case "pos.x":
            case "position.x":
              value2 = sprite.loc_x.value();
              break;
            case "y":
            case "loc.y":
            case "location.y":
            case "pos.y":
            case "position.y":
              value2 = sprite.loc_y.value();
              break;
            case "z":
            case "depth":
              value2 = sprite.depth;
              break;
            case "sx":
            case "size.x":
              value2 = sprite.size_x.value();
              break;
            case "sy":
            case "size.y":
              value2 = sprite.size_y.value();
              break;
            case "angle":
            case "rotation":
              value2 = sprite.angle.value();
              break;
            case "visible":
              value2 = t_or_f(sprite.visible);
              break;
            case "role":
              if (sprite.role == null) {
                value2 = defaults_default.NOTFOUND;
              } else {
                value2 = sprite.role;
              }
              break;
            // More still to do
            default:
          }
        }
      }
      if (value2 === false) {
        value2 = _VarList.built_in(varName);
      }
      if (value2 === false) {
        if (sceneName != this.sceneName) {
          const otherScene = Scene2.find(sceneName);
          if (otherScene !== false) {
            value2 = otherScene.varList.get_value(varName);
          }
        } else {
          let index = this.find(varName);
          if (index !== false) {
            value2 = this.variables[index].getValue();
          }
        }
      }
      if (value2 === false) {
        Globals.log.error("Variable not found " + varName);
        value2 = defaults_default.NOTFOUND;
      }
      return value2;
    }
    delete(name, report = false) {
      let index = this.find(name);
      if (index === false && report) {
        Globals.log.error("Variable not found " + name);
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
          let replacement = this.get_value(varName);
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

  // src/utils.js
  var Log = class {
    constructor(debug_on) {
      this.debug_on = debug_on;
      this.errors = [];
      this.messageElement = null;
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
      if (this.messageElement != null) {
        this.report(text);
      } else {
        console.log(text);
      }
      this.errors.push(text);
    }
    log(text) {
      console.log(text);
    }
    report(text) {
      if (this.messageElement != null) {
        this.messageElement.value += text + "\n";
      }
    }
    messageParent(elementID) {
      this.messageElement = document.getElementById(elementID);
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
    list() {
      let text = this.any_trigger ? "Any trigger\n" : "All triggers\n";
      for (let i = 0; i < this.triggers.length; i++) {
        text += this.triggers[i].constructor.name + " ";
        text += this.triggers[i].params + "\n";
      }
      for (let i = 0; i < this.actions.length; i++) {
        text += this.actions[i].text + "\n";
      }
      return text;
    }
  };
  function makeCompletionCallback(object) {
    return function(action) {
      object.completed_actions += 1;
    };
  }
  function evaluate(input) {
    let str = "";
    let i = 0;
    let expr = "";
    let brackets = 0;
    let escaped = false;
    do {
      const char = input.charAt(i);
      if (escaped) {
        str += char;
        escaped = false;
        continue;
      }
      if (char == "\\") {
        escaped = true;
        continue;
      }
      if (brackets > 0) {
        if (char == ")") {
          if (--brackets == 0) {
            str += Globals.evaluator.eval(expr);
            expr = "";
          } else {
            expr += char;
          }
          continue;
        }
        if (char == "(") {
          brackets++;
        }
        expr += char;
        continue;
      }
      if (char == "(") {
        brackets = 1;
        continue;
      }
      str += char;
    } while (++i < input.length);
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
          VarList.hemisphere = "southern";
        } else {
          VarList.hemisphere = "northern";
        }
      },
      (error) => {
        VarList.hemisphere = DEFAULT;
      },
      {
        timeout: 5e3
        // optional safeguard
      }
    );
  }
  function t_or_f(value2) {
    return value2 ? defaults_default.TRUEVALUE : defaults_default.FALSEVALUE;
  }
  var Reporter = class {
    constructor() {
    }
    dumpScene(scene) {
      if (typeof scene === "string") {
        scene = Scene.find(scene);
      }
      Globals.log.report(scene.dump());
    }
  };

  // src/globals.js
  var Globals = class _Globals {
    static start_time = Date.now();
    static root = null;
    static scenes = [];
    static app = null;
    static log = new Log(defaults_default.DEBUG);
    static reporter = new Reporter();
    static evaluator = new Mexp();
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
    static highestZ = 0;
    constructor() {
    }
    static nextZ(depth) {
      if (depth > 0) {
        if (depth > _Globals.highestZ) {
          _Globals.highestZ = depth;
        }
        return depth;
      }
      return ++_Globals.highestZ;
    }
    static list() {
      let text = "";
      for (const propt in this) {
        text += `${propt} = ${this[propt]}
`;
      }
      return text;
    }
    static reset() {
      _Globals.root = null;
      _Globals.scenes = [];
      _Globals.app = null;
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
          if (Globals.scenes[i].images[j].name == tag) {
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
    constructor(data, tag) {
      this.name = tag;
      if (typeof data === "string") {
        this.pi_image = null;
        this.loading = true;
        this.url = data;
      } else {
        this.pi_image = data;
        this.loading = false;
        this.url = null;
      }
    }
    async load_image() {
      this.pi_image = await PIXI.Assets.load(this.url);
      this.loading = false;
    }
  };
  var SG_sprite = class {
    constructor(image_tag, sprite_tag = image_tag, type = defaults_default.SPRITE_IMAGE) {
      this.type = type;
      this.image_tag = image_tag;
      this.name = sprite_tag;
      this.image_portion = null;
      this.pi_sprite = null;
      this.enabled = true;
      this.loc_x = new Adjustable(0);
      this.loc_y = new Adjustable(0);
      this.angle = new Adjustable(0, 0, 360);
      this.depth = 0;
      this.size_x = new Adjustable(0);
      this.size_y = new Adjustable(0);
      this.scale_x = new Adjustable(0);
      this.scale_y = new Adjustable(0);
      this.flip_h = false;
      this.flip_v = false;
      this.visible = true;
      this.transparency = new Adjustable(100, 0, 100);
      this.tint_value = new Adjustable(0, 0, 100);
      this.tint_colour = null;
      this.new_tint = false;
      this.role = null;
      this.next_blink = 0;
      this.blink_rate = 0;
      this.blink_chance = 0;
      this.pulse_rate = 0;
      this.pulse_min = 0;
      this.pulse_max = 0;
      this.pulse_up = true;
      this.flash_count = 0;
      this.next_flash = 0;
      this.throw_vx = 0;
      this.throw_vy = 0;
      this.throw_time = 0;
      this.falling = false;
      this.throw_callback = null;
      this.bluriness = new Adjustable(0, 0, 100);
      this.blur_filter = null;
      this.text_font = "arial";
      this.text_size = 24;
      this.text_align = "center";
      this.fill_colour = "black";
      this.stroke_colour = "black";
      this.skew_x = new Adjustable(0);
      this.skew_y = new Adjustable(0);
    }
    set_pos(x, y, depth = 0) {
      this.loc_x.set_target_value(x);
      this.loc_y.set_target_value(y);
      this.set_depth("to", depth);
    }
    set_depth(depth_type, value2) {
      if (depth_type == "by") {
        this.depth += value2;
      } else {
        this.depth = value2;
      }
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
      if (this.image_tag == defaults_default.TEXT_NAME) {
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
      }
      this.loc_x.set_target_value(new_x, duration, now, callback);
      this.loc_y.set_target_value(new_y, duration, now);
      this.enabled = true;
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
      } else if (axis == "r") {
        this.scale_x.set_target_value(this.flip_h ? 1 : -1);
        this.scale_y.set_target_value(this.flip_v ? 1 : -1);
        this.flip_v = false;
        this.flip_h = false;
      }
    }
    current_tint() {
      const shade = Math.round(255 * (100 - this.tint_value.value()) / 100);
      return shade << 16 | shade << 8 | shade;
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
        this.thrown_vy = initial_velocity * Math.cos(radians) * -1;
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
      if (this.type == defaults_default.SPRITE_IMAGE && (this.pi_sprite === null || this.pi_sprite.texture == PIXI.Texture.EMPTY)) {
        let image = get_image(scene, this.image_tag);
        if (image === null) {
          this.enabled = false;
          return;
        }
        if (image != "loading") {
          const img_width = image.pi_image.width;
          const img_height = image.pi_image.height;
          if (this.role != null) {
            const wdw_width = Globals.app.screen.width;
            const wdw_height = Globals.app.screen.height;
            const scale_y = img_height / wdw_height;
            const scale_x = img_width / wdw_width;
            let depth = null;
            switch (this.role) {
              case "background":
              // centre, and scale to window size
              case "backdrop":
                this.loc_x.set_target_value(wdw_width / 2);
                this.loc_y.set_target_value(wdw_height / 2);
                this.size_x.set_target_value(wdw_width);
                this.size_y.set_target_value(wdw_height);
                depth = defaults_default.DEPTH_BACKGROUND;
                break;
              case "left":
                this.loc_x.set_target_value(img_width / 2);
                this.loc_y.set_target_value(wdw_height / 2);
                this.size_x.set_target_value(scale_y * img_width);
                this.size_y.set_target_value(scale_y * img_height);
                depth = defaults_default.DEPTH_LEFT;
                break;
              case "right":
                this.loc_x.set_target_value(wdw_width - img_width / 2);
                this.loc_y.set_target_value(wdw_height / 2);
                this.size_x.set_target_value(scale_y * img_width);
                this.size_y.set_target_value(scale_y * img_height);
                depth = defaults_default.DEPTH_RIGHT;
                break;
              case "top":
              case "sky":
                this.loc_x.set_target_value(wdw_width / 2);
                this.loc_y.set_target_value(img_height / 2);
                this.size_x.set_target_value(scale_x * img_width);
                this.size_y.set_target_value(scale_x * img_height);
                depth = defaults_default.DEPTH_SKY;
                break;
              case "bottom":
              case "ground":
              case "foreground":
                this.loc_x.set_target_value(wdw_width / 2);
                this.loc_y.set_target_value(wdw_height - img_height / 2);
                this.size_x.set_target_value(scale_x * img_width);
                this.size_y.set_target_value(scale_x * img_height);
                depth = this.role == "ground" ? defaults_default.DEPTH_GROUND : defaults_default.DEPTH_FOREGROUND;
                break;
            }
            if (this.depth == null) {
              this.depth = depth;
            }
          } else {
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
              frame: this.image_portion
            });
          } else {
            texture = fullTexture;
          }
          this.pi_sprite = new PIXI.Sprite({
            texture,
            anchor: 0.5,
            position: {
              x: this.loc_x.value(),
              y: this.loc_y.value()
            },
            visible: this.visible
          });
          this.depth = Globals.nextZ(this.depth);
          this.pi_sprite.zIndex = this.depth;
          this.pi_sprite.tint = this.current_tint();
          this.pi_sprite.setSize(this.size_x.value(), this.size_y.value());
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
      if (Math.abs(this.loc_x.value()) > Globals.width * defaults_default.BOUNDS_X || Math.abs(this.loc_y.value()) > Globals.width * defaults_default.BOUNDS_Y) {
        this.enabled = false;
        return;
      }
      if (this.falling) {
        const falling_time = (now - this.throw_time) / 1e3;
        const delta_x = this.thrown_vx * falling_time * Globals.script_scale_x;
        const delta_y = (this.thrown_vy * falling_time - 0.5 * Globals.gravity * -1 * falling_time * falling_time) * Globals.script_scale_y;
        if (Math.abs(delta_x) > Globals.app.screen.width * 2 || Math.abs(delta_y) > Globals.app.screen.height * 2 || Globals.ground_level > 0 && this.loc_y.value + delta_y > Globals.ground_level) {
          this.falling = false;
          this.visible = false;
          this.enabled = false;
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
      } else {
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
      if (this.new_tint) {
        if (this.pi_sprite !== null) {
          this.pi_sprite.tint = this.tint_colour;
          this.new_tint = false;
        }
      }
      if (this.tint_value.update_value()) {
        if (this.pi_sprite !== null) {
          this.pi_sprite.tint = this.current_tint();
        }
      }
      change_x = this.size_x.update_value();
      change_y = this.size_y.update_value();
      if (change_x || change_y) {
        if (this.pi_sprite !== null) {
          this.pi_sprite.setSize(this.size_x.value(), this.size_y.value());
        }
      }
      change_x = this.scale_x.update_value();
      change_y = this.scale_y.update_value();
      if (change_x || change_y) {
        if (this.pi_sprite !== null) {
          this.pi_sprite.scale.set(this.scale_x.value(), this.scale_y.value());
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
      for (let i = 0; i < Globals.scenes.length; i++) {
        if (Globals.scenes[i].name == scene) {
          for (let j = 0; j < Globals.scenes[i].sprites.length; j++) {
            if (!(Globals.scenes[i].state == defaults_default.SCENE_STOPPED) && Globals.scenes[i].sprites[j].name == tag) {
              return Globals.scenes[i].sprites[j];
            }
          }
        }
      }
      if (report) {
        Globals.log.error("No sprite found- " + scene + ":" + tag);
      }
      return false;
    }
    static remove_sprite(scene, tag, report = false) {
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
        if (!word.match(/^[0-9-\.]+$/)) {
          Globals.log.error("Expected integer - " + word);
        }
        let retval = Math.floor(parseFloat(word));
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
      } else if (units.startsWith("t")) {
        mult = 0.1;
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
      this.state = defaults_default.SCENE_STOPPED;
      this.content = [];
      this.reset();
    }
    reset() {
      this.actionGroups = [];
      this.images = [];
      this.sprites = [];
      this.folder = "";
      this.varList = new VarList(this.name);
      this.timers = [];
      this.completion_callback = null;
      this.parameters = defaults_default.NOTFOUND;
      this.graphic_fill = "black";
      this.graphic_stroke = "black";
      this.graphic_stroke_width = 1;
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
    scene_data() {
      let text = "Scene: " + this.name + "\n";
      text += "State: " + this.state + "\n";
      text += "Contains " + this.actionGroups.length + " action groups\n";
      text += this.images.length + " images\n";
      text += this.sprites.length + " sprites\n";
      return text;
    }
    list_sprites(verbose = true) {
      let text = verbose ? "Sprites in Scene " + this.name + "\n" : "";
      for (let i = 0; i < this.sprites.length; i++) {
        const sprite = this.sprites[i];
        if (verbose) {
          const x = sprite.loc_x.value();
          const y = sprite.loc_y.value();
          const z = sprite.depth;
          text += `${sprite.name} (${sprite.type}) `;
          text += sprite.visible ? "visible" : "hidden";
          text += ` at ${x} ${y} ${z}
`;
        } else {
          text += `${sprite.name} `;
        }
      }
      return text;
    }
    list_images(verbose = true) {
      let text = verbose ? "Images in Scene " + this.name + "\n" : "";
      for (let i = 0; i < this.images.length; i++) {
        const image = this.images[i];
        if (verbose) {
          text += `Name ${image.name} `;
          text += image.loading ? "loaded" : "loading";
          text += ` from ${image.url}
`;
        } else {
          text += `${image.name} `;
        }
      }
      return text;
    }
    stop(reset = false) {
      this.state = defaults_default.SCENE_STOPPED;
      this.parameters = defaults_default.NOTFOUND;
      this.actionGroups = [];
      for (let i = 0; i < this.sprites; i++) {
        const sg_sprite = this.sprites[i];
        if (sg_sprite.pi_sprite != null) {
          sg_sprite.pi_sprite.destroy();
        }
      }
      this.sprites = [];
      if (reset) {
        this.reset();
      }
      if (this.completion_callback != null) {
        this.completion_callback();
        this.completion_callback = null;
      }
    }
    pause() {
      if (this.state == defaults_default.SCENE_RUNNING) {
        this.state = defaults_default.SCENE_PAUSED;
      }
    }
    resume() {
      if (this.state == defaults_default.SCENE_PAUSED) {
        this.state = defaults_default.SCENE_RUNNING;
      }
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
    start(parameters) {
      if (this.state != defaults_default.SCENE_STOPPED) {
        return;
      }
      this.actionGroups = [];
      this.parameters = parameters;
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
      this.state = defaults_default.SCENE_RUNNING;
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
          case "speed":
            words.shift();
            Parser.test_word(words, "of");
            command = "speed";
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
          case "darkness":
            words.shift();
            Parser.test_word(words, "of");
            command = "darken";
            break;
          case "lightness":
            words.shift();
            Parser.test_word(words, "of");
            command = "lighten";
            break;
          case "tint":
            words.shift();
            Parser.test_word(words, "of");
            command = "tint";
            break;
          default:
            command = "make";
            break;
        }
      }
      if (command == "create" && words.length > 1) {
        switch (words[0]) {
          case "text":
            command = "text";
            words[0] = "create";
            break;
          case "sprite":
            words.shift();
            command = "sprite";
            words[0] = "create";
            break;
          case "graphic":
          case "shape":
            words.shift();
            command = "shape";
            words[0] = "create";
            break;
          default:
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
          Globals.log.report(words.join(" "));
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
        
           ########  ########  ######  ######## ######## 
           ##     ## ##       ##    ## ##          ##    
           ##     ## ##       ##       ##          ##    
           ########  ######    ######  ######      ##    
           ##   ##   ##             ## ##          ##    
           ##    ##  ##       ##    ## ##          ##    
           ##     ## ########  ######  ########    ##    
        
        **************************************************************************************************/
        case "reset":
          {
            action_group.complete_action("reset");
            const reset_type = Parser.test_word(words, ["sprite", "scene"], "scene");
            if (reset_type == "sprite") {
              if (words.length > 0) {
                let sprite_tag2 = Parser.get_word(words);
                let sg_sprite2 = SG_sprite.get_sprite(this.name, sprite_tag2);
                if (!sg_sprite2) {
                  break;
                }
                sg_sprite2.reset_size();
                sg_sprite2.jiggle(0, 0, 0, 0);
                sg_spitre.flicker(0);
                sg_sprite2.blink(0, 0);
                sg_sprite2.pulse(0);
                sg_sprite2.flip("r");
                sg_sprite2.set_tint("stop");
                sg_sprite2.set_blur(0);
                sg_spriet.set_skew(0, 0);
                sg_sprite2.rotate("to", 0, "in");
              } else {
                Globals.log.error("Missing sprite name at line " + line_no);
              }
            } else if (reset_type == "scene") {
              let sceneName = this.name;
              if (words.length > 0) {
                let sceneName2 = Parser.get_word(words);
              }
              const scene = _Scene.find(sceneName);
              if (scene != false) {
                scene.stop(true);
              } else {
                Globals.log.error("Scene not found at line " + line_no);
              }
            }
          }
          break;
        /**************************************************************************************************
        
            ######  ########  ########  #### ######## ######## 
           ##    ## ##     ## ##     ##  ##     ##    ##       
           ##       ##     ## ##     ##  ##     ##    ##       
            ######  ########  ########   ##     ##    ######   
                 ## ##        ##   ##    ##     ##    ##       
           ##    ## ##        ##    ##   ##     ##    ##       
            ######  ##        ##     ## ####    ##    ######## 
        
        **************************************************************************************************/
        case "sprite":
          if (words.length > 0) {
            const sprite_command = Parser.get_word(words);
            switch (sprite_command) {
              // more to add here?
              case "create":
                {
                  let sprite_tag2 = false;
                  if (Parser.test_word(words, "named") || !Parser.test_word(words, "from")) {
                    sprite_tag2 = Parser.get_word(words);
                  }
                  Parser.test_word(words, "from");
                  let image_tag = Parser.get_word(words);
                  if (!sprite_tag2) {
                    sprite_tag2 = image_tag;
                  }
                  let sg_sprite2 = new SG_sprite(image_tag, sprite_tag2);
                  if (Parser.test_word(words, "area")) {
                    const x = Parser.get_int(words, 0);
                    const y = Parser.get_int(words, 0);
                    const w = Parser.get_int(words, 0);
                    const h = Parser.get_int(words, 0);
                    if (w > 0 && h > 0) {
                      sg_sprite2.image_portion = new PIXI.Rectangle(x, y, w, h);
                      sq_sprite.size_x.set_target_value(w);
                      sq_sprite.size_y.set_target_value(h);
                    }
                  }
                  sg_sprite2.set_visibility(false);
                  this.sprites.push(sg_sprite2);
                }
                break;
              default:
                Globals.log.error("Unknown sprite command at line " + line_no);
            }
          } else {
            Globals.log.error("Missing sprite data at line " + line_no);
          }
          action_group.complete_action("sprite");
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
          action_group.complete_action("place");
          if (words.length > 0) {
            let sprite_tag2 = Parser.get_word(words);
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sprite_tag2);
            if (!sg_sprite2) {
              break;
            }
            const hidden = Parser.test_word(words, "hidden");
            Parser.test_word(words, "at");
            if (Parser.test_word(words, ["center", "centre"])) {
              sg_sprite2.loc_x.set_target_value(Globals.app.screen.width / 2);
              sg_sprite2.loc_y.set_target_value(Globals.app.screen.height / 2);
            } else {
              sg_sprite2.loc_x.set_target_value(Parser.get_int(words, 0) * Globals.script_scale_x);
              sg_sprite2.loc_y.set_target_value(Parser.get_int(words, 0) * Globals.script_scale_y);
            }
            Parser.test_word(words, "depth");
            sg_sprite2.depth = Parser.get_int(words, 0);
            Parser.test_word(words, ["size", "scale"]);
            const width = Parser.get_int(words, 0);
            const height = Parser.get_int(words, 0);
            if (width > 0 && height > 0) {
              sg_sprite2.size_x.set_target_value(width * Globals.script_scale_x);
              sg_sprite2.size_y.set_target_value(height * Globals.script_scale_y);
            }
            if (!hidden) {
              sg_sprite2.set_visibility(true);
            }
          } else {
            Globals.log.error("Missing place data at line " + line_no);
          }
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
          action_group.complete_action("replace");
          if (words.length > 0) {
            let sprite_tag2 = words.shift();
            Parser.test_word(words, "with");
            let image_tag = words.shift();
            let hidden = Parser.test_word(words, "hidden");
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sprite_tag2);
            if (!sg_sprite2) {
              break;
            }
            if (hidden) {
              sg_sprite2.set_visibility(false);
            }
            sg_sprite2.image_tag = image_tag;
            sg_sprite2.pi_sprite.texture = PIXI.Texture.EMPTY;
          } else {
            Globals.log.error("Missing replace data at line " + line_no);
          }
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
        case "use":
          if (words.length > 0) {
            let image_tag = words.shift();
            let sprite_tag2 = null;
            if (Parser.test_word(words, "named")) {
              sprite_tag2 = Parser.get_word(words, image_tag);
            }
            Parser.test_word(words, ["as", "at"]);
            let role = Parser.test_word(words, [
              "background",
              "backdrop",
              "top",
              "bottom",
              "left",
              "right",
              "ground",
              "sky",
              "foreground",
              "frame"
            ]);
            if (role == false) {
              Globals.log.error("Unknown role " + role + " at line " + line_no);
              break;
            }
            if (sprite_tag2 == null) {
              sprite_tag2 = role;
            }
            let sg_sprite2 = new SG_sprite(image_tag, sprite_tag2);
            sg_sprite2.role = role;
            Parser.test_word(words, ["as", "at"]);
            if (Parser.test_word(words, "depth")) {
              sg_sprite2.depth = Parser.get_int(words, 0);
            } else {
              sg_sprite2.depth = null;
            }
            this.sprites.push(sg_sprite2);
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
        
           ######## ######## ##     ## ######## 
              ##    ##        ##   ##     ##    
              ##    ##         ## ##      ##    
              ##    ######      ###       ##    
              ##    ##         ## ##      ##    
              ##    ##        ##   ##     ##    
              ##    ######## ##     ##    ##    
        
        **************************************************************************************************/
        case "text":
          if (words.length > 2) {
            const text_command = words.shift();
            const text_tag = words.shift();
            const text_args = words.join(" ");
            let sg_sprite2 = null;
            if (text_command == "create") {
              sg_sprite2 = new SG_sprite(null, text_tag, defaults_default.SPRITE_TEXT);
              const text_item = new PIXI.Text({
                text: text_args,
                style: {
                  fontFamily: sg_sprite2.text_font,
                  fontSize: sg_sprite2.text_size,
                  fill: sg_sprite2.fill_colour,
                  align: sg_sprite2.text_align
                }
              });
              sg_sprite2.pi_sprite = text_item;
              sg_sprite2.pi_sprite.anchor = 0.5;
              sg_sprite2.set_visibility(false);
              sg_sprite2.size_x.set_target_value(text_item.width);
              sg_sprite2.size_y.set_target_value(text_item.height);
              Globals.root.addChild(text_item);
              this.sprites.push(sg_sprite2);
              action_group.complete_action("text");
              break;
            }
            sg_sprite2 = SG_sprite.get_sprite(this.name, text_tag);
            if (sg_sprite2.type != defaults_default.SPRITE_TEXT) {
              Globals.log.error("Sprite is not text at " + line_no);
              action_group.complete_action("text");
              break;
            }
            let do_update = true;
            switch (text_command) {
              case "font":
              case "fontfamily":
                sg_sprite2.text_font = text_args;
                break;
              case "fontsize":
              case "size":
                sg_sprite2.text_size = text_args;
                break;
              case "align":
                sg_sprite2.text_align = text_args;
                break;
              case "color":
              case "colour":
              case "fill":
                sg_sprite2.fill_colour = text_args;
                break;
              case "stroke":
                sg_sprite2.stroke_colour = text_args;
                break;
              case "add":
                sg_sprite2.pi_sprite.text += "\n" + text_args;
                break;
              case "replace":
                sg_sprite2.pi_sprite.text = text_args;
                break;
              default:
                do_update = false;
                Globals.log.error("Unknown text command at " + line_no);
                break;
            }
            if (do_update) {
              sg_sprite2.set_style();
              sg_sprite2.size_x.set_target_value(sg_sprite2.pi_sprite.width);
              sg_sprite2.size_y.set_target_value(sg_sprite2.pi_sprite.height);
            }
          } else {
            Globals.log.error("Missing argument at line " + line_no);
          }
          action_group.complete_action("text");
          break;
        /**************************************************************************************************
        
            ######   ########     ###    ########  ##     ## ####  ######  
           ##    ##  ##     ##   ## ##   ##     ## ##     ##  ##  ##    ## 
           ##        ##     ##  ##   ##  ##     ## ##     ##  ##  ##       
           ##   #### ########  ##     ## ########  #########  ##  ##       
           ##    ##  ##   ##   ######### ##        ##     ##  ##  ##       
           ##    ##  ##    ##  ##     ## ##        ##     ##  ##  ##    ## 
            ######   ##     ## ##     ## ##        ##     ## ####  ######  
        
        **************************************************************************************************/
        case "graphic":
        case "shape":
          if (words.length > 1) {
            const graphic_command = Parser.get_word(words);
            switch (graphic_command) {
              case "create":
                const graphic_tag = Parser.get_word(words);
                Parser.test_word(words, "as");
                const graphic_type = Parser.get_word(words);
                let graphic = null;
                switch (graphic_type) {
                  case "rectangle":
                  case "rect":
                    {
                      const w = Parser.get_int(words, 0);
                      const h = Parser.get_int(words, w);
                      const r2 = Parser.get_int(words, 0);
                      if (w > 0 && h > 0) {
                        if (r2 > 0) {
                          graphic = new PIXI.Graphics().roundRect(w / -2, h / -2, w, h, r2);
                        } else {
                          graphic = new PIXI.Graphics().rect(w / -2, h / -2, w, h);
                        }
                      }
                    }
                    break;
                  case "circle":
                    {
                      const r2 = Parser.get_int(words, 0);
                      if (r2 > 0) {
                        graphic = new PIXI.Graphics().circle(0, 0, r2);
                      }
                    }
                    break;
                  case "line":
                    {
                      const l = Parser.get_int(words, 0);
                      if (r > 0) {
                        graphic = new PIXI.Graphics().moveTo(l / -2, 0).lineTo(l / 2, 0);
                      }
                    }
                    break;
                  case "ellipse":
                    {
                      const w = Parser.get_int(words, 0);
                      const h = Parser.get_int(words, w);
                      if (w > 0 && h > 0) {
                        graphic = new PIXI.Graphics().ellipse(w / -2, h / -2, w, h);
                      }
                    }
                    break;
                  case "star":
                    {
                      const p = Parser.get_int(words, 0);
                      const ro = Parser.get_int(words, 0);
                      let ri = Parser.get_int(words, 0);
                      if (ri > ro) {
                        ri = 0;
                      }
                      if (p > 2 && r0 > 0) {
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
                      const x = Parser.get_int(words, 0);
                      const y = Parser.get_int(words, x);
                      graphic = new PIXI.Graphics();
                      const width = Globals.app.screen.width;
                      const height = Globals.app.screen.height;
                      if (x > 10 && y > 10) {
                        for (let i = width / -2 + x; i < width / 2; i += x) {
                          graphic.moveTo(i, height / -2).lineTo(i, height / 2);
                        }
                        for (let j = height / -2 + y; j < height / 2; j += y) {
                          graphic.moveTo(width / -2, j).lineTo(width / 2, j);
                        }
                      }
                    }
                    break;
                  default:
                    Globals.log.error("Unknown graphic type at " + line_no);
                    break;
                }
                if (graphic != null) {
                  graphic.fill(this.graphic_fill).stroke({ width: this.graphic_stroke_width, color: this.graphic_stroke });
                  Globals.root.addChild(graphic);
                  const sg_sprite2 = new SG_sprite(null, graphic_tag, defaults_default.SPRITE_GRAPHIC);
                  sg_sprite2.pi_sprite = graphic;
                  sg_sprite2.set_visibility(false);
                  sg_sprite2.size_x.set_target_value(graphic.width);
                  sg_sprite2.size_y.set_target_value(graphic.height);
                  this.sprites.push(sg_sprite2);
                } else {
                  Globals.log.error("Invalid graphic arguments at " + line_no);
                }
                break;
              case "fill":
              case "color":
              case "colour":
                this.graphic_fill = Parser.get_word(words, "black");
                break;
              case "stroke":
                if (Parser.test_word(words, "width")) {
                  this.graphic_stroke_width = Parser.get_int(words, 1);
                } else {
                  this.graphic_stroke = Parser.get_word(words, "black");
                }
                break;
              default:
                Globals.log.error("Unknown graphics command at " + line_no);
                break;
            }
          } else {
            Globals.log.error("Missing argument at line " + line_no);
          }
          action_group.complete_action("graphic");
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
            let sprite_tag2 = words.shift();
            let by_or_to = Parser.get_word(words, ["by", "to"]);
            if (by_or_to === false) {
              Globals.log.error("Expected by or to on line " + line_no);
              break;
            }
            let x = Parser.get_int(words, 0) * Globals.script_scale_x;
            let y = Parser.get_int(words, 0) * Globals.script_scale_y;
            let in_or_at = Parser.test_word(words, ["in", "at"], "in");
            let duration2 = Parser.get_duration(words, 0);
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sprite_tag2);
            if (!sg_sprite2) {
              action_group.complete_action("moveX");
              break;
            }
            sg_sprite2.move(x, y, by_or_to, in_or_at, duration2, now, makeCompletionCallback(action_group));
          } else {
            Globals.log.error("Missing move data at line " + line_no);
            action_group.complete_action("moveX");
          }
          break;
        /**************************************************************************************************
        
            ######  ########  ######## ######## ########  
           ##    ## ##     ## ##       ##       ##     ## 
           ##       ##     ## ##       ##       ##     ## 
            ######  ########  ######   ######   ##     ## 
                 ## ##        ##       ##       ##     ## 
           ##    ## ##        ##       ##       ##     ## 
            ######  ##        ######## ######## ########  
        
        **************************************************************************************************/
        case "speed":
          let sprite_tag = words.shift();
          Parser.test_word(words, "to");
          let speed = Parser.get_int(words, 0) * Globals.script_scale_x;
          let sg_sprite = SG_sprite.get_sprite(this.name, sprite_tag);
          sg_sprite.set_speed(speed);
          action_group.complete_action("speed");
          break;
        /**************************************************************************************************
        
        ########     ###    ####  ######  ######## 
        ##     ##   ## ##    ##  ##    ## ##       
        ##     ##  ##   ##   ##  ##       ##       
        ########  ##     ##  ##   ######  ######   
        ##   ##   #########  ##        ## ##       
        ##    ##  ##     ##  ##  ##    ## ##       
        ##     ## ##     ## ####  ######  ######## 
        
        **************************************************************************************************/
        case "raise":
        case "lower":
          if (words.length > 0) {
            let sprite_tag2 = words.shift();
            let depth_type = Parser.get_word(words, ["to", "by"]);
            if (depth_type === false) {
              Globals.log.error("Expected to or by on line " + line_no);
              break;
            }
            let value2 = Parser.get_int(words, 0);
            if (command == "lower") {
              value2 = -value2;
            }
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sprite_tag2);
            if (sg_sprite2 != null) {
              sg_sprite2.set_depth(depth_type, value2);
            }
          } else {
            Globals.log.error("Missing raise/lower data at line " + line_no);
          }
          action_group.complete_action("raise");
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
            let sprite_tag2 = words.shift();
            let to_or_by = Parser.get_word(words, ["to", "by"]);
            if (to_or_by === false) {
              Globals.log.error("Expected to or by on line " + line_no);
              break;
            }
            let w = Parser.get_int(words, 0) * Globals.script_scale_x;
            let h = Parser.get_int(words, 0) * Globals.script_scale_y;
            let in_or_at = Parser.test_word(words, ["in", "at"]);
            let duration2 = Parser.get_duration(words, 0);
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sprite_tag2);
            if (!sg_sprite2) {
              action_group.complete_action("resize");
              break;
            }
            sg_sprite2.resize(
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
            action_group.complete_action("resize");
          }
          break;
        /**************************************************************************************************
        
            ######   ######     ###    ##       ######## 
           ##    ## ##    ##   ## ##   ##       ##       
           ##       ##        ##   ##  ##       ##       
            ######  ##       ##     ## ##       ######   
                 ## ##       ######### ##       ##       
           ##    ## ##    ## ##     ## ##       ##       
            ######   ######  ##     ## ######## ######## 
        
        **************************************************************************************************/
        case "scale":
        case "rescale":
        case "shrink":
        case "grow":
          if (words.length > 0) {
            let sprite_tag2 = Parser.get_word(words);
            const action2 = Parser.test_word(words, ["to", "by"]);
            let w = Parser.get_int(words, 0);
            let h = Parser.get_int(words, 0);
            if (command == "shrink") {
              if (w > 100) {
                w = 99;
              }
              if (w > 0) {
                w = 100 - w;
              }
              if (h > 100) {
                h = 99;
              }
              if (h > 0) {
                h = 100 - h;
              }
            } else if (command == "grow") {
              if (w > 0) {
                w += 100;
              }
              if (h > 0) {
                h += 100;
              }
            }
            Parser.test_word(words, "in");
            let duration2 = Parser.get_duration(words, 0);
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sprite_tag2);
            if (!sg_sprite2) {
              action_group.complete_action("scale");
              break;
            }
            if (action2 == "reset") {
              sg_sprite2.reset_size();
              action_group.complete_action("scale");
            } else if (w > 0 || h > 0) {
              sg_sprite2.scale(
                w,
                h,
                duration2,
                now,
                makeCompletionCallback(action_group)
              );
            } else {
              Globals.log.error("Invalid scale data at line " + line_no);
              action_group.complete_action("scale");
            }
          } else {
            Globals.log.error("Missing scale data at line " + line_no);
            action_group.complete_action("scale");
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
          action_group.complete_action("remove");
          if (words.length > 1) {
            const type2 = Parser.test_word(words, ["sprite", "audio", "sound", "var", "variable"]);
            const item = Parser.get_word(words);
            switch (type2) {
              case "sprite":
                SG_sprite.remove_sprite(this.name, item, false);
                break;
              case "audio":
              case "sound":
                if (AudioManager.exists(item)) {
                  AudioManager.delete(item);
                }
                break;
              case "var":
              case "variable":
                this.varList.delete(item, false);
                break;
              default:
                Globals.log.error("Unknown deletion type on line " + line_no);
                break;
            }
          } else {
            Globals.log.error("Nothing to remove at line " + line_no);
          }
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
            let sprite_tag2 = words.shift();
            let turn_type = Parser.test_word(words, ["to", "by", "at"], "to");
            let value2 = Parser.get_int(words, 0);
            let dur_type = Parser.test_word(words, ["in", "per"], "in");
            let duration2 = Parser.get_duration(words, 0);
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sprite_tag2);
            if (!sg_sprite2) {
              action_group.complete_action("rotate");
              break;
            }
            sg_sprite2.rotate(turn_type, value2, dur_type, duration2, now, makeCompletionCallback(action_group));
          } else {
            Globals.log.error("Missing rotate data at line " + line_no);
            action_group.complete_action("rotateX");
          }
          break;
        /**************************************************************************************************
        
            ######  ##    ## ######## ##      ## 
           ##    ## ##   ##  ##       ##  ##  ## 
           ##       ##  ##   ##       ##  ##  ## 
            ######  #####    ######   ##  ##  ## 
                 ## ##  ##   ##       ##  ##  ## 
           ##    ## ##   ##  ##       ##  ##  ## 
            ######  ##    ## ########  ###  ###  
        
        **************************************************************************************************/
        case "skew":
        case "twist":
          if (words.length > 0) {
            let sprite_tag2 = words.shift();
            let skew_type = Parser.test_word(words, ["to", "by", "at"], "to");
            let skew_x = Parser.get_int(words, 0);
            let skew_y = Parser.get_int(words, 0);
            let dur_type = Parser.test_word(words, ["in", "per"], "in");
            let duration2 = Parser.get_duration(words, 0);
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sprite_tag2);
            if (!sg_sprite2) {
              action_group.complete_action("skew");
              break;
            }
            sg_sprite2.set_skew(skew_x, skew_y, skew_type, duration2, now, makeCompletionCallback(action_group));
          } else {
            Globals.log.error("Missing skew data at line " + line_no);
            action_group.complete_action("skew");
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
            let sprite_tag2 = words.shift();
            const stop_or_at = Parser.test_word(words, ["at", "stop"], "at");
            let angle = Parser.get_int(words, 0);
            Parser.test_word(words, ["deg", "degs", "degrees"]);
            Parser.test_word(words, "with");
            Parser.test_word(words, ["force", "velocity", "speed"]);
            let initial_velocity = Parser.get_int(words, 10);
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sprite_tag2);
            if (!sg_sprite2) {
              action_group.complete_action("throw");
              break;
            }
            if (stop_or_at == "stop") {
              sg_sprite2.throw("stop");
            } else {
              sg_sprite2.throw(angle, initial_velocity, now, makeCompletionCallback(action_group));
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
            let sprite_tag2 = words.shift();
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sprite_tag2);
            if (!sg_sprite2) {
              action_group.complete_action("drop");
              break;
            }
            if (Parser.test_word(words, "stop")) {
              sg_sprite2.throw("stop");
            } else {
              sg_sprite2.throw(180, 0, now, makeCompletionCallback(action_group));
            }
          } else {
            Globals.log.error("Missing drop data at line " + line_no);
          }
          break;
        /**************************************************************************************************
        
           ######## ##       #### ########  
           ##       ##        ##  ##     ## 
           ##       ##        ##  ##     ## 
           ######   ##        ##  ########  
           ##       ##        ##  ##        
           ##       ##        ##  ##        
           ##       ######## #### ##        
        
        **************************************************************************************************/
        case "flip":
          action_group.complete_action();
          if (words.length > 0) {
            let sprite_tag2 = words.shift();
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sprite_tag2);
            if (!sg_sprite2) {
              break;
            }
            let axis = Parser.get_word(words, "h");
            sg_sprite2.flip(axis.charAt(0));
          } else {
            Globals.log.error("Missing sprite tag at line " + line_no);
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
          action_group.complete_action();
          if (words.length > 0) {
            let sprite_tag2 = words.shift();
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sprite_tag2);
            if (!sg_sprite2) {
              break;
            }
            if (command == "show") {
              sg_sprite2.set_visibility(true);
            } else if (command == "hide") {
              sg_sprite2.set_visibility(false);
            } else if (command == "toggle") {
              sg_sprite2.set_visibility("toggle");
            }
          } else {
            Globals.log.error("Missing sprite tag at line " + line_no);
          }
          break;
        /**************************************************************************************************
        
            ######  ########    ###    ########  ######## 
           ##    ##    ##      ## ##   ##     ##    ##    
           ##          ##     ##   ##  ##     ##    ##    
            ######     ##    ##     ## ########     ##    
                 ##    ##    ######### ##   ##      ##    
           ##    ##    ##    ##     ## ##    ##     ##    
            ######     ##    ##     ## ##     ##    ##    
        
        **************************************************************************************************/
        case "start":
          if (words.length > 0) {
            const scene_name = Parser.get_word(words);
            const scene = _Scene.find(scene_name);
            if (scene !== false) {
              this.completion_callback = makeCompletionCallback(action_group);
              scene.start(words.join(" "));
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
        case "halt":
          action_group.complete_action("stop");
          this.completion_callback = makeCompletionCallback(action_group);
          if (words.length > 0) {
            while (words.length > 0) {
              const stop_type = Parser.test_word(words, ["scene", "audio", "sound", "track", "sprite"]);
              const item = words.shift();
              if (item == null) {
                if (stop_type == "scene") {
                  this.stop(false);
                }
                break;
              }
              if (stop_type == "audio" || stop_type == "sound" || stop_type == "track") {
                if (AudioManager.exists(item)) {
                  AudioManager.delete(item);
                }
              } else if (stop_type == "scene") {
                const scene = _Scene.find(item);
                if (scene !== false) {
                  scene.stop(false);
                }
              } else if (stop_type == "sprite") {
                let sg_sprite2 = SG_sprite.get_sprite(this.name, item, false);
                if (sg_sprite2 != null) {
                  sg_sprite2.stop();
                }
              } else if (AudioManager.exists(item)) {
                AudioManager.delete(item);
              } else {
                const scene = _Scene.find(item);
                if (scene !== false) {
                  scene.stop(false);
                } else {
                  let sg_sprite2 = SG_sprite.get_sprite(this.name, item, false);
                  if (sg_sprite2 != null) {
                    sg_sprite2.stop();
                  }
                }
              }
            }
          } else {
            Globals.log.error("Nothing to stop on line " + line_no);
          }
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
            this.varList.set_value(varName, words.join(" "));
          } else {
            Globals.log.error("Missing variable name at line " + line_no);
          }
          action_group.complete_action("let");
          break;
        case "assign":
          if (words.length > 0) {
            const assignIndex = words.indexOf("as");
            if (assignIndex < 1) {
              Globals.log.error("Missing assign separator 'as' at line " + line_no);
            } else {
              const varNames = words.slice(0, assignIndex);
              const values = words.slice(assignIndex + 1);
              for (let i = 0; i < varNames.length; i++) {
                let value2 = defaults_default.NOTFOUND;
                if (values.length > i) {
                  if (i == varNames.length - 1) {
                    value2 = values.slice(i).join(" ");
                  } else {
                    value2 = values[i];
                  }
                }
                this.varList.set_value(varNames[i], value2);
              }
            }
          } else {
            Globals.log.error("Missing variable name at line " + line_no);
          }
          action_group.complete_action("assign");
          break;
        case "increment":
        case "decrement":
          if (words.length > 0) {
            const varName = words.shift();
            if (this.varList.find(varName) === false) {
              Globals.log.error("Variable not found " + varName);
            } else {
              const currentValue = this.varList.get_value(varName);
              if (`${currentValue}`.match(/^-?[0-9]+(\.[0-9]+)?$/)) {
                const delta = command == "increment" ? 1 : -1;
                this.varList.set_value(varName, parseFloat(currentValue) + delta);
              }
            }
          } else {
            Globals.log.error("Missing variable name at line " + line_no);
          }
          action_group.complete_action(command);
          break;
        case "choose":
          if (words.length > 2) {
            let varName = words.shift();
            Parser.test_word(words, "from");
            this.varList.set_value(varName, words[Math.floor(Math.random() * words.length)]);
          } else {
            Globals.log.error("Missing variable name at line " + line_no);
          }
          action_group.complete_action("choose");
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
          action_group.complete_action("flicker");
          if (words.length > 0) {
            let sprite_tag2 = words.shift();
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sprite_tag2);
            if (!sg_sprite2) {
              break;
            }
            let on_off = Parser.test_word(words, ["by", "stop"]);
            if (on_off == "stop") {
              sg_sprite2.flicker(0, 0);
            } else {
              let flicker_size = Parser.get_int(words, 0, 0, 50) * Globals.script_scale_x;
              Parser.test_word(words, "with");
              Parser.test_word(words, "chance");
              let flicker_chance = Parser.get_int(words, 50);
              sg_sprite2.flicker(flicker_size, flicker_chance);
            }
          } else {
            Globals.log.error("Missing values at line " + line_no);
          }
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
          action_group.complete_action("jiggle");
          if (words.length > 0) {
            let sg_sprite_tag = words.shift();
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sg_sprite_tag);
            if (!sg_sprite2) {
              break;
            }
            let on_off = Parser.test_word(words, ["by", "stop"]);
            if (on_off == "stop") {
              sg_sprite2.jiggle(0, 0, 0);
            } else {
              let jiggle_x = Parser.get_int(words, 0) * Globals.script_scale_x;
              let jiggle_y = Parser.get_int(words, 0) * Globals.script_scale_y;
              let jiggle_r = Parser.get_int(words, 0);
              Parser.test_word(words, "with");
              Parser.test_word(words, "chance");
              let jiggle_chance = Parser.get_int(words, 50);
              sg_sprite2.jiggle(jiggle_x, jiggle_y, jiggle_r, jiggle_chance);
            }
          } else {
            Globals.log.error("Missing values at line " + line_no);
          }
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
          action_group.complete_action("flash");
          if (words.length > 0) {
            let sg_sprite_tag = words.shift();
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sg_sprite_tag);
            if (!sg_sprite2) {
              break;
            }
            let flash_count = Parser.get_int(words, 0, 1, 10);
            sg_sprite2.flash(flash_count, now);
          } else {
            Globals.log.error("Missing values at line " + line_no);
          }
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
          action_group.complete_action("blink");
          if (words.length > 0) {
            let sg_sprite_tag = words.shift();
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sg_sprite_tag);
            if (!sg_sprite2) {
              break;
            }
            let on_off = Parser.test_word(words, ["at", "stop"]);
            if (on_off == "stop") {
              sg_sprite2.blink(0, 0, now);
            } else {
              let blink_rate = Parser.get_int(words, 0, 1, 10);
              Parser.test_word(words, "per");
              Parser.test_word(words, "second");
              Parser.test_word(words, "with");
              Parser.test_word(words, "chance");
              let blink_chance = Parser.get_int(words, 100, 0, 100);
              sg_sprite2.blink(blink_rate, blink_chance, now);
            }
          } else {
            Globals.log.error("Missing values at line " + line_no);
          }
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
          action_group.complete_action("pulse");
          if (words.length > 0) {
            let sg_sprite_tag = words.shift();
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sg_sprite_tag);
            if (!sg_sprite2) {
              break;
            }
            let on_off = Parser.test_word(words, "stop");
            if (on_off == "stop") {
              sg_sprite2.pulse(0, 0, 100, now);
            } else {
              Parser.test_word(words, "at");
              let pulse_rate = Parser.get_int(words, 0, 1, 10);
              Parser.test_word(words, "per");
              Parser.test_word(words, "second");
              Parser.test_word(words, "from");
              let pulse_min = Parser.get_int(words, 0, 0, 100);
              Parser.test_word(words, "to");
              let pulse_max = Parser.get_int(words, 100, 0, 100);
              sg_sprite2.pulse(pulse_rate, pulse_min, pulse_max, now);
            }
          } else {
            Globals.log.error("Missing values at line " + line_no);
          }
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
            let sg_sprite_tag = words.shift();
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sg_sprite_tag);
            if (!sg_sprite2) {
              action_group.complete_action("fade");
              break;
            }
            let fade_type = Parser.test_word(words, ["to", "by", "up", "down"], "to");
            let value2 = Parser.get_int(words, 100);
            Parser.test_word(words, "in");
            let duration2 = Parser.get_duration(words, 0);
            if (sg_sprite2 != null) {
              sg_sprite2.set_trans(value2, duration2, fade_type, now, makeCompletionCallback(action_group));
            }
          } else {
            Globals.log.error("Missing fade parameters");
            action_group.complete_action("fade");
          }
          break;
        /**************************************************************************************************
        
           ##      ##    ###    ##     ## ########       ##  ######  ##      ##    ###    ##    ## 
           ##  ##  ##   ## ##   ##     ## ##            ##  ##    ## ##  ##  ##   ## ##    ##  ##  
           ##  ##  ##  ##   ##  ##     ## ##           ##   ##       ##  ##  ##  ##   ##    ####   
           ##  ##  ## ##     ## ##     ## ######      ##     ######  ##  ##  ## ##     ##    ##    
           ##  ##  ## #########  ##   ##  ##         ##           ## ##  ##  ## #########    ##    
           ##  ##  ## ##     ##   ## ##   ##        ##      ##    ## ##  ##  ## ##     ##    ##    
            ###  ###  ##     ##    ###    ######## ##        ######   ###  ###  ##     ##    ##    
        
        **************************************************************************************************/
        case "wave":
        case "sway":
          action_group.complete_action("wave");
          if (words.length > 0) {
            let sg_sprite_tag = words.shift();
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sprite_tag);
            if (!sg_sprite2) {
              break;
            }
            let on_off = Parser.test_word(words, ["to", "stop"]);
            if (on_off == "stop") {
              if (command == "wave") {
                sg_sprite2.wave(0, 0, 0);
              } else {
                sg_sprite2.sway(0, 0, 0);
              }
            } else {
              let wave_max = Parser.get_int(words, 0, 1, 10);
              Parser.test_word(words, "in");
              let wave_rate = Parser.get_duration(words, 1);
              Parser.test_word(words, "with");
              Parser.test_word(words, "chance");
              let wave_chance = Parser.get_int(words, 100, 0, 100);
              if (command == "wave") {
                sg_sprite2.wave(wave_max, wave_rate, wave_chance);
              } else {
                sg_sprite2.sway(wave_max, wave_rate, wave_chance);
              }
            }
          } else {
            Globals.log.error("Missing values at line " + line_no);
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
            let sprite_tag2 = words.shift();
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sprite_tag2);
            if (!sg_sprite2) {
              action_group.complete_action("blur");
              break;
            }
            let blur_type = Parser.test_word(words, ["to", "by", "up", "down"], "to");
            let value2 = Parser.get_int(words, 100);
            Parser.test_word(words, "in");
            let duration2 = Parser.get_duration(words, 0);
            if (sg_sprite2 != null) {
              sg_sprite2.set_blur(value2, duration2, blur_type, now, makeCompletionCallback(action_group));
            }
          } else {
            Globals.log.error("Missing fade parameters");
            action_group.complete_action("blur");
          }
          break;
        /**************************************************************************************************
        
        ########  #### ###    ## ######## 
           ##      ##  ####   ##    ##    
           ##      ##  ## ##  ##    ##    
           ##      ##  ##  ## ##    ##    
           ##      ##  ##   ####    ##    
           ##      ##  ##    ###    ##    
           ##     #### ##     ##    ##    
        
        **************************************************************************************************/
        case "tint":
          action_group.complete_action("tint");
          if (words.length > 0) {
            let sprite_tag2 = words.shift();
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sprite_tag2);
            if (!sg_sprite2) {
              break;
            }
            Parser.test_word(words, ["to", "by", "at"]);
            const value2 = Parser.get_word(words, "red");
            sg_sprite2.set_tint(value2);
          } else {
            Globals.log.error("Missing tint colour");
          }
          break;
        case "darken":
        case "lighten":
          if (words.length > 0) {
            let sprite_tag2 = words.shift();
            let sg_sprite2 = SG_sprite.get_sprite(this.name, sprite_tag2);
            if (!sg_sprite2) {
              action_group.complete_action(command);
              break;
            }
            Parser.test_word(words, ["to", "by", "at"]);
            let value2 = Parser.get_int(words, 0, 0, 100);
            if (command == "lighten") {
              value2 = 100 - value2;
            }
            Parser.test_word(words, "in");
            let duration2 = Parser.get_duration(words, 0);
            sg_sprite2.set_tint(value2, duration2, now, makeCompletionCallback(action_group));
          } else {
            Globals.log.error("Missing " + command + " parameters");
            action_group.complete_action(command);
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
        /**************************************************************************************************
        
           ##       ####  ######  ######## 
           ##        ##  ##    ##    ##    
           ##        ##  ##          ##    
           ##        ##   ######     ##    
           ##        ##        ##    ##    
           ##        ##  ##    ##    ##    
           ######## ####  ######     ##    
        
        **************************************************************************************************/
        case "dump":
        case "list":
          const type = Parser.get_word(words, "scene");
          const arg = Parser.get_word(words);
          switch (type) {
            case "scenes":
            case "all":
              for (let i = 0; i < Globals.scenes.length; i++) {
                Globals.log.report(Globals.scenes[i].scene_data());
              }
              break;
            case "scene":
              if (arg) {
                const list_scene = _Scene.find(arg);
                if (list_scene) {
                  Globals.log.report(list_scene.scene_data());
                }
              } else {
                Globals.log.report(this.scene_data());
              }
              break;
            case "sprites":
              if (arg) {
                const list_scene = _Scene.find(arg);
                if (list_scene) {
                  Globals.log.report(list_scene.list_sprites());
                }
              } else {
                Globals.log.report(this.list_sprites());
              }
              break;
            case "images":
              if (arg) {
                const list_scene = _Scene.find(arg);
                if (list_scene) {
                  Globals.log.report(list_scene.list_images());
                }
              } else {
                Globals.log.report(this.list_images());
              }
              break;
            case "actions":
              for (let i = 0; i < this.actionGroups.length; i++) {
                Globals.log.report(this.actionGroups[i].list());
              }
              break;
            case "globals":
              Globals.log.report(Globals.list());
              break;
          }
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
    static clean = true;
    constructor() {
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
    readFromText(text) {
      const script = text.split(/\r?\n/);
      const count = script.length;
      const top = new Scene2(defaults_default.MAIN_NAME);
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
            holding = new Scene2(argument);
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
          let gravity = parseFloat(argument);
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
        return false;
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
      return true;
    }
    async run() {
      this.clean = false;
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
      Globals.root.sortableChildren = true;
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
          if (current.state != defaults_default.SCENE_RUNNING) {
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
          if (current.state != defaults_default.SCENE_RUNNING) {
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
      Globals.log.report("Starting Slow Glass from " + url);
      this.cleanUp();
      const response = await fetch(url);
      if (!response.ok) {
        Globals.log.error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      const text = await response.text();
      if (this.readFromText(text)) {
        this.run();
      }
    }
    interactiveAction(text) {
      const topScene = Scene2.find(defaults_default.MAIN_NAME);
      const dummyActionGroupIndex = topScene.actionGroups.length - 1;
      const actionGroup = topScene.actionGroups[dummyActionGroupIndex];
      const lines = text.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i].trim();
        if (lineText.length < 1) {
          continue;
        }
        const dummyLine = new Line(i + 1, lineText);
        topScene.runAction(dummyLine, actionGroup, Date.now());
      }
    }
    setDrawingParent(elementID) {
      _SlowGlass.sg_id = elementID;
    }
    setMessageParent(elementID) {
      Globals.log.messageParent(elementID);
    }
    cleanUp() {
      if (this.clean) {
        return;
      }
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
      this.clean = true;
      Globals.reset();
      Globals.app = new PIXI.Application();
    }
    scriptFromText(text) {
      Globals.log.report("Starting Slow Glass from textarea");
      this.cleanUp();
      if (this.readFromText(text)) {
        this.run();
      }
    }
  };
  window.slowGlass = new SlowGlass();
})();
//# sourceMappingURL=slow-glass.js.map
