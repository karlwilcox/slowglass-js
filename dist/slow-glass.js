(() => {
  // src/adjustable.js
  var Adjustable = class {
    constructor(inValue, minValue, maxValue, wrap) {
      if (arguments.length < 4) {
        wrap = false;
      }
      this.currentValue = inValue;
      this.targetValue = inValue;
      this.deltaValue = 0;
      if (arguments.length >= 3) {
        this.lowerLimit = minValue;
        this.upperLimit = maxValue;
      } else {
        this.lowerLimit = Number.MIN_SAFE_INTEGER;
        this.upperLimit = Number.MAX_SAFE_INTEGER;
      }
      this.lastAdjustment = 0;
      this.changing = false;
      this.wrap = wrap;
      this.jigStep = 0;
      this.jigLimit = 0;
      this.jigChance = 0;
      this.accelerationRate = 0;
      this.accelerationTime = 0;
      this.positionCallback = null;
      this.accelerateCallback = null;
      this.swayLimit = 0;
      this.swayStep = 0;
      this.swayRate = 0;
      this.swayUp = false;
      this.swayChance = 0;
      this.lastSway = 0;
    }
    value() {
      return this.currentValue + this.jigStep + this.swayStep;
    }
    speed() {
      return this.deltaValue;
    }
    sway_stop() {
      this.swayLimit = 0;
      this.swayStep = 0;
      this.swayRate = 0;
      this.swayChance = 0;
    }
    sway_start(limit, rate, chance) {
      this.swayLimit = limit;
      this.swayRate = rate * 1e3;
      this.swayChance = chance;
      this.swayStep = 0;
      this.swayUp = true;
      this.lastSway = Date.now();
    }
    stop() {
      if (typeof this.positionCallback === "function") {
        this.positionCallback("stop");
      }
      if (typeof this.accelerationCallback === "function") {
        this.accelerationCallback("stop");
      }
      this.deltaValue = 0;
      this.changing = false;
    }
    set_speed(delta) {
      if (Math.abs(delta) > 0) {
        this.deltaValue = delta;
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
        this.accelerationCallback = callback;
      }
      this.accelerationRate = rate;
    }
    // adjust(delta) {
    //     let newValue = this.value + delta;
    //     // but check limits
    //     if ( newValue < this.lowerLimit ) {
    //         newValue = this.wrap ? this.upperLimit : this.lowerLimit;
    //     } else if ( newValue > this.upperLimit ) {
    //         newValue = this.wrap ? this.lowerLimit : this.upperLimit;
    //     }
    //     this.value = this.newValue;
    // }
    // Some things need to be kept in step (e.g. size and scale) without triggering
    // an update, so do it here.
    forceValue(value2) {
      this.currentValue = value2;
      this.targettValue = value2;
      this.deltaValue = 0;
      this.changing = false;
    }
    tweak(value2) {
      this.currentValue += value2;
      this.changing = true;
    }
    setTargetValue(target, seconds, timestamp, callback) {
      if (arguments.length == 1) {
        seconds = 0;
      }
      if (arguments.length == 2) {
        timestamp = Date.now();
      }
      if (arguments.length > 3) {
        this.positionCallback = callback;
      }
      if (target < this.lowerLimit) {
        target = this.lowerLimit;
      } else if (target > this.upperLimit) {
        target = this.upperLimit;
      }
      this.targetValue = target;
      if (seconds == 0) {
        this.currentValue = target;
        this.deltaValue = 0;
        if (this.callback != null) {
          this.positionCallback("adjustable");
        }
      } else {
        this.deltaValue = (this.targetValue - this.currentValue) / (seconds * 1e3);
        this.lastAdjustment = timestamp;
      }
      this.changing = true;
    }
    updateValue() {
      let updated = false;
      let thisAdjustment = Date.now();
      if (this.jigLimit > 0 && this.jigChance > 0) {
        if (Math.random() * 100 < this.jigChance) {
          updated = true;
          this.jigStep += this.jigLimit / 4 - Math.random() * (this.jigLimit / 2);
          if (this.jigStep > this.jigLimit) {
            this.jigStep = this.jigLimit;
          } else if (this.jigStep < this.jigLimit * -1) {
            this.jigStep = this.jigLimit * -1;
          }
        }
      }
      if (this.swayLimit > 0) {
        if (Math.random() * 100 < this.swayChance) {
          let step = this.swayLimit / this.swayRate * (thisAdjustment - this.lastSway);
          if (this.swayUp) {
            this.swayStep += step;
            if (this.swayStep > this.swayLimit) {
              this.swayStep = this.swayLimit;
              this.swayUp = false;
            }
          } else {
            this.swayStep -= step;
            if (this.swayStep < this.swayLimit * -1) {
              this.swayStep = this.swayLimit * -1;
              this.swayUp = true;
            }
          }
          this.lastSway = thisAdjustment;
          updated = true;
        }
      }
      if (!this.changing) {
        return updated;
      }
      if (this.deltaValue < 0 && this.currentValue < this.targetValue || this.deltaValue > 0 && this.currentValue > this.targetValue || Math.abs(this.currentValue - this.targetValue) < this.deltaValue) {
        this.currentValue = this.targetValue;
        this.deltaValue = 0;
        this.changing = false;
        if (this.callback != null) {
          this.positionCallback("adjustable");
        }
      } else {
        this.currentValue += this.deltaValue * (thisAdjustment - this.lastAdjustment);
        this.lastAdjustment = thisAdjustment;
      }
      return true;
    }
    jiggle_stop() {
      this.jigStep = 0;
      this.jigLimit = 0;
      this.jigChance = 0;
    }
    jiggle_start(limit, chance) {
      this.jigLimit = limit;
      this.jigChance = chance;
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
    TRIGGER_RATE: 500,
    // milliseconds between trigger tests
    SPRITE_RATE: 40,
    // milliseconds between sprite updates
    VOLUME_MIN: 0,
    VOLUME_MAX: 100,
    GRAVITY_PS2: 100,
    // force of gravity in pixels per second per second
    BOUNDS_X: 2,
    // Multiplier for display width for bounds checking
    BOUNDS_Y: 2,
    // Multiplier for display height for bounds checking
    DEPTH_BACKGROUND: 50,
    DEPTH_SKY: 100,
    DEPTH_GROUND: 200,
    DEPTH_LEFT: 300,
    DEPTH_RIGHT: 301,
    DEPTH_FOREGROUND: 400,
    DEPTH_FRAME: 1e3,
    LOOP_MAXIMUM: 1e3
    // greatest number of times we allow a loop to run
  };

  // src/constants.js
  var TRUE_VALUE = "YES";
  var MAIN_NAME = "_MAIN_";
  var SPRITE_IMAGE = "_IMAGE_";
  var SPRITE_TEXT = "_TEXT_";
  var SPRITE_GRAPHIC = "_GRAPHIC_";
  var SPRITE_GROUP = "_GROUP_";
  var SCENE_STOPPED = "_STOPPED_";
  var SCENE_RUNNING = "_RUNNING_";
  var SCENE_PAUSED = "_PAUSED_";
  var SCALE_FIT = "_FIT_";
  var SCALE_STRETCH = "_STRETCH_";
  var SCALE_NONE = "_NONE_";
  var STACK_FOR = "_FOR_";
  var STACK_REPEAT = "_REPEAT_";

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
  var VarList = class {
    static key = null;
    static lastKey = null;
    static hemisphere = null;
    constructor(sceneName) {
      this.variables = [];
      this.trigger = null;
      this.sceneName = sceneName;
      getHemisphere();
    }
    setValue(name, value2) {
      if (this.built_in(name)) {
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
    listNames() {
      let result = "";
      let first = true;
      for (let i = 0; i < this.variables.length; i++) {
        if (first) {
          first = false;
        } else {
          result += " ";
        }
        result += this.variables[i].name;
      }
      return result;
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
    built_in(name) {
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
          return this.hemisphere == "northern" && (month >= 12 || month <= 2) || this.hemisphere == "southern" && (month >= 6 && month <= 8) ? TRUE_VALUE : defaults_default.FALSEVALUE;
        case "SPRING":
          return this.hemisphere == "northern" && (month >= 3 && month <= 5) || this.hemisphere == "southern" && (month >= 9 && month <= 11) ? TRUE_VALUE : defaults_default.FALSEVALUE;
        case "SUMMER":
          return this.hemisphere == "northern" && (month >= 6 && month <= 8) || this.hemisphere == "southern" && (month >= 12 || month <= 2) ? TRUE_VALUE : defaults_default.FALSEVALUE;
        case "AUTUMN":
          return this.hemisphere == "northern" && (month >= 9 && month <= 11) || this.hemisphere == "southern" && (month >= 3 && month <= 5) ? TRUE_VALUE : defaults_default.FALSEVALUE;
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
          return date.getDay() > 0 && date.getDay() < 6 ? TRUE_VALUE : defaults_default.FALSEVALUE;
        case "WEEKEND":
          return date.getDay() == 0 || date.getDay() == 6 ? TRUE_VALUE : defaults_default.FALSEVALUE;
        case "MORNING":
          return date.getHours() > 6 && date.getHour() < 13 ? TRUE_VALUE : defaults_default.FALSEVALUE;
        case "AFTERNOON":
          return date.getHours() > 11 && date.getHour() < 18 ? TRUE_VALUE : defaults_default.FALSEVALUE;
        case "EVENING":
          return date.getHours() > 18 && date.getHour() < 22 ? TRUE_VALUE : defaults_default.FALSEVALUE;
        case "NIGHT":
          return boolAsString(date.getHours() > 22 || date.getHour() < 6);
        case "KEY":
          return Globals.key == null ? defaults_default.NOTFOUND : Globals.key;
        case "LASTKEY":
          return Globals.lastKey == null ? defaults_default.NOTFOUND : Globals.lastKey;
        case "SCALEX":
          return Globals.scriptScaleX;
        case "SCALEY":
          return Globals.scriptScaleY;
        case "SCENENAME":
          return this.sceneName;
        case "PARAMS":
        case "PARAMETERS":
          const scene = Scene2.find(this.sceneName);
          return scene.parameters;
        case "ELAPSED":
          return Math.floor((Date.now() - Globals.startTime) / 1e3);
        case "MILLIS":
        case "MS":
          return Date.now() - Globals.startTime;
        case "VARIABLES":
        case "VARNAMES":
          return this.listNames();
        default:
          return false;
      }
    }
    sceneVar(varName) {
      let value2 = defaults_default.NOTFOUND;
      const parts = varName.split(/:/);
      const scene = Scene2.find(parts[0]);
      if (scene !== false) {
        value2 = scene.varList.getValue(parts[1]);
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
    getValue(varName, report = false) {
      let value2 = false;
      let sceneName = this.sceneName;
      if (varName.match(/:/)) {
        const colonParts = varName.split(/:/);
        varName = colonParts[1];
        sceneName = colonParts[0];
      }
      const scene = Scene2.find(sceneName);
      if (!scene) {
        value2 = defaults_default.NOTFOUND;
      }
      switch (varName) {
        case "SPRITES":
          value2 = scene.listSprites(false);
          break;
        case "IMAGES":
        case "IMGS":
          value2 = scene.listImages(false);
          break;
        case "SCENES":
          value2 = Globals.listScenes(false);
          break;
        default:
          break;
      }
      if (value2 === false && varName.match(/\./)) {
        const parts = varName.split(/\./, 2);
        const sgSprite = SGSprite.getSprite(sceneName, parts[0], false);
        if (sgSprite != null) {
          switch (parts[1]) {
            case "x":
            case "loc.x":
            case "location.x":
            case "pos.x":
            case "position.x":
              value2 = sgSprite.locX.value();
              break;
            case "y":
            case "loc.y":
            case "location.y":
            case "pos.y":
            case "position.y":
              value2 = sgSprite.locY.value();
              break;
            case "z":
            case "depth":
              value2 = sgSprite.depth;
              break;
            case "sx":
            case "size.x":
              value2 = sgSprite.sizeX.value();
              break;
            case "sy":
            case "size.y":
              value2 = sgSprite.sizeY.value();
              break;
            case "pivot.x":
            case "px":
              value2 = sgSprite.piSprite.pivot.x;
              break;
            case "pivot.y":
            case "py":
              value2 = sgSprite.piSprite.pivot.y;
              break;
            case "angle":
            case "rotation":
              value2 = sgSprite.angle.value();
              break;
            case "visible":
              value2 = boolAsString(sgSprite.visible);
              break;
            case "role":
              if (sgSprite.role == null) {
                value2 = defaults_default.NOTFOUND;
              } else {
                value2 = sgSprite.role;
              }
              break;
            case "bounds":
              const bounds = sgSprite.piSprite.getBounds();
              value2 = `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`;
              break;
            // More still to do
            default:
          }
        }
      }
      if (value2 === false) {
        value2 = this.built_in(varName);
      }
      if (value2 === false) {
        if (sceneName != this.sceneName) {
          value2 = scene.varList.getValue(varName);
        } else {
          let index = this.find(varName);
          if (index !== false) {
            value2 = this.variables[index].getValue();
          }
        }
      }
      if (report && value2 === false) {
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
    expandVars(input) {
      let output = "";
      let i = 0;
      while (i < input.length) {
        if (input[i] === "\\" && input[i + 1] === "$") {
          output += "$";
          i += 2;
          continue;
        }
        if (input[i] === "$") {
          let indirect = input[i + 1] === "$";
          let j = i + (indirect ? 2 : 1);
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
          let replacement = this.getValue(varName);
          if (indirect) {
            replacement = this.getValue(replacement);
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
  var StackFrame = class {
    constructor(type, line_no, data = null, varName = null) {
      this.type = type;
      this.varName = varName;
      this.forValues = data;
      this.whileTest = data;
      this.jump_line = line_no;
      this.counter = 0;
    }
  };
  var ActionGroup = class {
    constructor() {
      this.triggers = [];
      this.actions = [];
      this.anyTrigger = true;
      this.unfinishedCount = 0;
      this.stack = [];
      this.nextAction = 0;
      this.failedIfCount = 0;
    }
    complete_action(action2) {
      this.unfinishedCount -= 1;
    }
    addAction(action2) {
      this.actions.push(action2);
    }
    addTrigger(trigger) {
      this.triggers.push(trigger);
    }
    isFinished() {
      return this.unfinishedCount < 1;
    }
    resetUnfinishedt() {
      this.unfinishedCount = 0;
    }
    list() {
      let text = this.anyTrigger ? "Any trigger\n" : "All triggers\n";
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
    object.unfinishedCount += 1;
    return function(action2) {
      object.unfinishedCount -= 1;
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
  function logical(words) {
    let result = false;
    let inverted = false;
    if (words[0] == "not") {
      words.shift();
      inverted = true;
    }
    if (words.length == 0) {
      result = !inverted;
    } else if (words.length == 1) {
      if (words[0].match(/^[-0-9\.\+]+$/)) {
        result = !(Math.abs(parseFloat(words[0])) < 1e-3);
      } else if (["false", "no", "n", "none"].includes(words[0].toLowerCase())) {
        result = false;
      } else {
        result = true;
      }
    } else if (words.length == 2) {
      result = words[0].toLowerCase == words[1].toLowerCase;
    } else if (words.length > 2) {
      let lvalue = words[0].toLowerCase();
      let rvalue = words[2].toLowerCase();
      let comparison = words[1].toLowerCase();
      switch (comparison) {
        case "is":
        case "equals":
        case "=":
        case "==":
          result = lvalue == rvalue;
          break;
        case "not":
        case "!=":
        case "!==":
          result = lvalue != rvalue;
          break;
        case ">":
          result = lvalue > rvalue;
          break;
        case "<":
          result = lvalue < rvalue;
          break;
        case ">=":
          result = lvalue >= rvalue;
          break;
        case "<=":
          result = lvalue <= rvalue;
          break;
        default:
          Globals.log.error("Unknown comparison - " + comparison);
          break;
      }
    }
    return inverted ? !result : result;
  }
  var Timer = class {
    constructor(startTime, duration, callback) {
      this.endtime = startTime + 1e3 * duration;
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
  function boolAsString(value2) {
    return value2 ? TRUE_VALUE : defaults_default.FALSEVALUE;
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
    static startTime = Date.now();
    static root = null;
    static scenes = [];
    static app = null;
    static log = new Log(defaults_default.DEBUG);
    static reporter = new Reporter();
    static evaluator = new Mexp();
    static currentTrigger = "";
    static displayWidth = defaults_default.DISPLAY_WIDTH;
    static displayHeight = defaults_default.DISPLAY_HEIGHT;
    static scriptWidth = defaults_default.DISPLAY_WIDTH;
    static scriptHeight = defaults_default.DISPLAY_HEIGHT;
    static scriptScaleType = SCALE_NONE;
    static scriptScaleX = 1;
    static scriptScaleY = 1;
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
    static listScenes(verbose = true) {
      let text = "";
      for (let i = 0; i < _Globals.scenes.length; i++) {
        text += _Globals.scenes[i].name + " ";
      }
      return text;
    }
    static reset() {
      _Globals.root = null;
      _Globals.scenes = [];
      _Globals.app = null;
      _Globals.currentTrigger = "";
      _Globals.displayWidth = defaults_default.DISPLAY_WIDTH;
      _Globals.displayHeight = defaults_default.DISPLAY_HEIGHT;
      _Globals.scriptWidth = defaults_default.DISPLAY_WIDTH;
      _Globals.scriptHeight = defaults_default.DISPLAY_HEIGHT;
      _Globals.scriptScaleType = SCALE_NONE;
      _Globals.scriptScaleX = 1;
      _Globals.scriptScaleY = 1;
      _Globals.gravity = defaults_default.GRAVITY_PS2;
      _Globals.lastKey = null;
      _Globals.key = null;
      _Globals.highestZ = 0;
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

  // src/sgsprite.js
  function getImage(scene, tag) {
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
  var SGImage = class {
    constructor(data, tag) {
      this.name = tag;
      this.width = 0;
      this.height = 0;
      if (typeof data === "string") {
        this.piImage = null;
        this.loading = true;
        this.url = data;
      } else {
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
  };
  var SGSprite = class {
    constructor(imageName, spriteName = imageName, type = SPRITE_IMAGE) {
      this.type = type;
      this.imageName = imageName;
      this.name = spriteName;
      this.sgParent = null;
      this.piSprite = null;
      this.enabled = true;
      this.locX = new Adjustable(0);
      this.locY = new Adjustable(0);
      this.angle = new Adjustable(0, 0, 360);
      this.depth = 0;
      this.sizeX = new Adjustable(0);
      this.sizeY = new Adjustable(0);
      this.scaleX = new Adjustable(1);
      this.scaleY = new Adjustable(1);
      this.flipH = false;
      this.flipV = false;
      this.flipChange = false;
      this.windowed = false;
      this.viewX = new Adjustable(0);
      this.viewY = new Adjustable(0);
      this.viewWidth = new Adjustable(0);
      this.viewHeight = new Adjustable(0);
      this.scrollX = 0;
      this.scrollY = 0;
      this.lastScroll = 0;
      this.pivotX = new Adjustable(50, 0, 100);
      this.pivotY = new Adjustable(50, 0, 100);
      this.visible = true;
      this.transparency = new Adjustable(100, 0, 100);
      this.tintValue = new Adjustable(0, 0, 100);
      this.tintColour = null;
      this.newTint = false;
      this.role = null;
      this.next_blink = 0;
      this.blinkRate = 0;
      this.blinkChance = 0;
      this.pulseRate = 0;
      this.pulseMin = 0;
      this.pulseMax = 0;
      this.pulseUp = true;
      this.flashCount = 0;
      this.nextFlash = 0;
      this.throwVx = 0;
      this.throwVy = 0;
      this.throwTime = 0;
      this.falling = false;
      this.throwCallback = null;
      this.bluriness = new Adjustable(0, 0, 100);
      this.blurFilter = null;
      this.textFont = "arial";
      this.textSize = 24;
      this.textAlign = "center";
      this.fillColour = "black";
      this.strokeColour = "black";
      this.skewX = new Adjustable(0);
      this.skewY = new Adjustable(0);
    }
    setPosition(x, y, depth = 0) {
      this.locX.setTargetValue(x);
      this.locY.setTargetValue(y);
      this.setDepth("to", depth);
    }
    setDepth(depth_type, value2 = "to") {
      if (depth_type == "by") {
        this.depth += value2;
      } else {
        this.depth = value2;
      }
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
      if (this.imageName == defaults_default.TEXT_NAME) {
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
      } else {
        if (newX === false) {
          newX = this.locX.value();
        }
        if (newY === false) {
          newY = this.locY.value();
        }
      }
      if (in_or_at == "at") {
      }
      this.locX.setTargetValue(newX, duration, now, callback);
      this.locY.setTargetValue(newY, duration, now);
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
    rotate(turn_type, value2, dur_type, duration, now, callback) {
      let newValue = 0;
      if (turn_type == "to") {
        newValue = value2;
      } else if (turn_type == "by") {
        newValue = this.angle.value() + value2;
      }
      if (dur_type == "in") {
        this.angle.setTargetValue(newValue, duration, now, callback);
      } else {
        this.angle.setTargetValue(newValue, 0);
      }
    }
    pivotPoint(pivotX, pivotY, duration, now, callback) {
      this.pivotX.setTargetValue(pivotX, duration, now, callback);
      this.pivotY.setTargetValue(pivotY, duration, now);
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
      } else if (axis == "r") {
        this.flipV = false;
        this.flipH = false;
      }
      this.flipChange = true;
    }
    currentTint() {
      const shade = Math.round(255 * (100 - this.tintValue.value()) / 100);
      return shade << 16 | shade << 8 | shade;
    }
    flash(flashCount, now) {
      this.flashCount = flashCount;
      this.nextFlash = now + 100;
    }
    jiggle(x, y, rot, chance) {
      if (chance > 0) {
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
        this.thrownVy = initialVelocity * Math.cos(radians) * -1;
        this.throwTime = now;
      }
    }
    blink(rate, chance, now) {
      this.blinkRate = rate;
      this.blinkChance = chance;
      if (rate <= 0) {
        this.visible = false;
      }
      this.next_blink = now + 1e3 / this.blinkRate;
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
    setVisibility(visible) {
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
          if (toOrBy == "by") {
            scaleX = currentX - scaleX;
            scaleY = currentY - scaleY;
          }
          break;
        case "grow":
          if (toOrBy == "by") {
            scaleX = currentX + scaleX;
            scaleY = currentY + scaleY;
          }
          break;
        case "scale":
        // just use the given values
        // toOrBy is ignored (it means the same thing)
        default:
          break;
      }
      if (scaleX <= 0) {
        scaleX = 1;
      }
      if (scaleY <= 0) {
        scaleY = 1;
      }
      this.scaleX.setTargetValue(scaleX / 100, duration, now, callback);
      this.scaleY.setTargetValue(scaleY / 100);
    }
    update(scene, now) {
      if (!this.enabled) {
        return;
      }
      if (this.type == SPRITE_IMAGE && (this.piSprite === null || this.piSprite.texture == PIXI.Texture.EMPTY)) {
        let image = getImage(scene, this.imageName);
        if (image === null) {
          this.enabled = false;
          return;
        }
        if (image != "loading") {
          const img_width = image.piImage.width;
          const imgHeight = image.piImage.height;
          if (this.role != null) {
            const wdw_width = Globals.app.screen.width;
            const wdwHeight = Globals.app.screen.height;
            const aspectY = imgHeight / wdwHeight;
            const aspectX = img_width / wdw_width;
            let depth = null;
            switch (this.role) {
              case "background":
              // centre, and scale to window size
              case "backdrop":
                this.locX.setTargetValue(wdw_width / 2);
                this.locY.setTargetValue(wdwHeight / 2);
                this.sizeX.setTargetValue(wdw_width);
                this.sizeY.setTargetValue(wdwHeight);
                depth = defaults_default.DEPTH_BACKGROUND;
                break;
              case "left":
                this.locX.setTargetValue(img_width / 2);
                this.locY.setTargetValue(wdwHeight / 2);
                this.sizeX.setTargetValue(aspectY * img_width);
                this.sizeY.setTargetValue(aspectY * imgHeight);
                depth = defaults_default.DEPTH_LEFT;
                break;
              case "right":
                this.locX.setTargetValue(wdw_width - img_width / 2);
                this.locY.setTargetValue(wdwHeight / 2);
                this.sizeX.setTargetValue(aspectY * img_width);
                this.sizeY.setTargetValue(aspectY * imgHeight);
                depth = defaults_default.DEPTH_RIGHT;
                break;
              case "top":
              case "sky":
                this.locX.setTargetValue(wdw_width / 2);
                this.locY.setTargetValue(imgHeight / 2);
                this.sizeX.setTargetValue(aspectX * img_width);
                this.sizeY.setTargetValue(aspectX * imgHeight);
                depth = defaults_default.DEPTH_SKY;
                break;
              case "bottom":
              case "ground":
              case "foreground":
                this.locX.setTargetValue(wdw_width / 2);
                this.locY.setTargetValue(wdwHeight - imgHeight / 2);
                this.sizeX.setTargetValue(aspectX * img_width);
                this.sizeY.setTargetValue(aspectX * imgHeight);
                depth = this.role == "ground" ? defaults_default.DEPTH_GROUND : defaults_default.DEPTH_FOREGROUND;
                break;
            }
            if (this.depth == null) {
              this.depth = depth;
            }
          } else {
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
            const viewRectangle = new PIXI.Rectangle(
              this.viewX.value(),
              this.viewY.value(),
              this.viewWidth.value(),
              this.viewHeight.value()
            );
            texture = new PIXI.Texture({
              source: fullTexture.source,
              frame: viewRectangle
            });
            texture.source.wrapMode = "mirror-repeat";
            this.sizeX.setTargetValue(this.viewWidth.value());
            this.sizeY.setTargetValue(this.viewHeight.value());
          } else {
            texture = fullTexture;
          }
          this.piSprite = new PIXI.Sprite({
            texture,
            anchor: 0.5,
            position: {
              x: this.locX.value(),
              y: this.locY.value()
            },
            visible: this.visible
          });
          this.depth = Globals.nextZ(this.depth);
          this.piSprite.zIndex = this.depth;
          this.piSprite.tint = this.currentTint();
          this.piSprite.setSize(
            this.sizeX.value() * this.scaleX.value() * Globals.scriptScaleX,
            this.sizeY.value() * this.scaleY.value() * Globals.scriptScaleY
          );
          if (this.sgParent) {
            this.sgParent.piSprite.addChild(this.piSprite);
          } else {
            Globals.root.addChild(this.piSprite);
          }
        }
      }
      if (this.piSprite !== null && this.flipChange) {
        this.piSprite.scale.set(this.flipH ? -1 : 1, this.flipV ? -1 : 1);
        this.flipChange = false;
      }
      if (this.windowed) {
        let scrolled = false;
        if (this.scrollX || this.scrollY) {
          if (this.scrollX != 0 && now - this.lastScroll > 1e3 / this.scrollX) {
            this.viewX.tweak(this.scrollX > 0 ? 1 : -1);
            scrolled = true;
          }
          if (this.scrollY != 0 && now - this.lastScroll > 1e3 / this.scrollY) {
            this.viewY.tweak(this.scrollY > 0 ? 1 : -1);
            scrolled = true;
          }
          if (scrolled) {
            this.lastScroll = now;
          }
        }
        const updateViewX = this.viewX.updateValue();
        const updateViewY = this.viewY.updateValue();
        const updateViewWidth = this.viewWidth.updateValue();
        const updateViewHeight = this.viewHeight.updateValue();
        if (scrolled || updateViewHeight || updateViewWidth || updateViewX || updateViewY) {
          if (this.piSprite !== null) {
            this.piSprite.texture.frame = new PIXI.Rectangle(
              this.viewX.value(),
              this.viewY.value(),
              this.viewWidth.value(),
              this.viewHeight.value()
            );
            this.piSprite.texture.updateUvs();
            this.sizeX.setTargetValue(this.viewWidth.value());
            this.sizeY.setTargetValue(this.viewHeight.value());
          }
        }
      }
      let changeX = this.locX.updateValue();
      let changeY = this.locY.updateValue();
      if (changeX || changeY) {
        if (this.piSprite !== null) {
          this.piSprite.position.set(this.locX.value(), this.locY.value());
        }
      }
      if (Math.abs(this.locX.value()) > Globals.width * defaults_default.BOUNDS_X || Math.abs(this.locY.value()) > Globals.width * defaults_default.BOUNDS_Y) {
        this.enabled = false;
        return;
      }
      if (this.falling) {
        const fallingTime = (now - this.throwTime) / 1e3;
        const deltaX = this.thrownVx * fallingTime * Globals.scriptScaleX;
        const deltaY = (this.thrownVy * fallingTime - 0.5 * Globals.gravity * -1 * fallingTime * fallingTime) * Globals.scriptScaleY;
        if (Math.abs(deltaX) > Globals.app.screen.width * 2 || Math.abs(deltaY) > Globals.app.screen.height * 2 || Globals.ground_level > 0 && this.locY.value + deltaY > Globals.ground_level) {
          this.falling = false;
          this.visible = false;
          this.enabled = false;
          if (this.throwCallback != null) {
            this.throwCallback();
          }
        }
        this.locX.setTargetValue(this.locX.value() + deltaX);
        this.locY.setTargetValue(this.locY.value() + deltaY);
        if (this.piSprite !== null) {
          this.piSprite.position.set(this.locX.value(), this.locY.value());
        }
      }
      const pivotOnX = this.pivotX.updateValue();
      const pivotOnY = this.pivotY.updateValue();
      const changeAngle = this.angle.updateValue();
      if (pivotOnX || pivotOnY || changeAngle) {
        if (this.piSprite !== null) {
          this.piSprite.angle = this.angle.value();
        }
      }
      if (this.transparency.updateValue()) {
        if (this.piSprite !== null) {
          this.piSprite.alpha = this.transparency.value() / 100;
        }
      } else {
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
      if (this.newTint) {
        if (this.piSprite !== null) {
          this.piSprite.tint = this.tintColour;
          this.newTint = false;
        }
      }
      if (this.tintValue.updateValue()) {
        if (this.piSprite !== null) {
          this.piSprite.tint = this.currentTint();
        }
      }
      const changeSX = this.scaleX.updateValue();
      const changeSY = this.scaleY.updateValue();
      changeX = this.sizeX.updateValue();
      changeY = this.sizeY.updateValue();
      if (changeSX || changeSY || changeX || changeY) {
        if (this.piSprite !== null) {
          this.piSprite.setSize(
            this.sizeX.value() * this.scaleX.value() * Globals.scriptScaleX,
            this.sizeY.value() * this.scaleY.value() * Globals.scriptScaleY
          );
        }
      }
      if (this.blinkRate > 0 && this.next_blink < now) {
        if (this.blinkChance >= 100 || Math.random() * 100 < this.blinkChance) {
          this.visible = !this.visible;
          this.next_blink += 1e3 / this.blinkRate;
          if (this.piSprite !== null) {
            this.piSprite.visible = this.visible;
          }
        }
      }
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
      if (this.bluriness.updateValue()) {
        if (this.piSprite !== null) {
          if (this.piSprite.filters == null) {
            this.piSprite.filters = [this.blurFilter];
          }
          this.blurFilter.strength = this.bluriness.value() / 10;
        }
      }
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
      for (let i = 0; i < Globals.scenes.length; i++) {
        if (Globals.scenes[i].name == scene) {
          for (let j = 0; j < Globals.scenes[i].sprites.length; j++) {
            if (!(Globals.scenes[i].state == SCENE_STOPPED) && Globals.scenes[i].sprites[j].name == tag) {
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
      if (!tag) {
        return false;
      }
      let parts = tag.split(":");
      if (parts.length > 1) {
        scene = parts[0];
        tag = parts[1];
      }
      for (let i = 0; i < Globals.scenes.length; i++) {
        if (Globals.scenes[i].name == scene) {
          for (let j = 0; j < Globals.scenes[i].sprites.length; j++) {
            if (Globals.scenes[i].sprites[j].tag == tag) {
              Globals.scenes[i].sprites[j].piSprite.destroy();
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
    static joinWords(words) {
      let result = "";
      let isFirst = true;
      for (let i = 0; i < words.length; i++) {
        if (isFirst) {
          isFirst = false;
        } else {
          result += " ";
        }
        if (words[i].includes(" ")) {
          result += `"${words[i]}"`;
        } else {
          result += words[i];
        }
      }
      return result;
    }
    static splitWords(input) {
      const result = [];
      let current = "";
      let inQuotes = false;
      let escape = false;
      for (let i = 0; i < input.length; i++) {
        const char = input[i];
        if (escape) {
          current += char;
          escape = false;
          continue;
        }
        if (char === "\\") {
          escape = true;
          continue;
        }
        if (char === '"') {
          inQuotes = !inQuotes;
          continue;
        }
        if (char === " " && !inQuotes) {
          if (current.length > 0) {
            result.push(current);
            current = "";
          }
          continue;
        }
        current += char;
      }
      if (current.length > 0) {
        result.push(current);
      }
      return result;
    }
    static testWord(words, word, def) {
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
    static getInt(words, def, min, max) {
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
    static getFloat(words, def) {
      if (words.length > 0) {
        return parseFloat(words.shift());
      }
      return def;
    }
    static getWord(words, def) {
      if (words.length > 0) {
        return words.shift();
      }
      return def;
    }
    static getTime_units(words, def) {
      let mult = 1;
      let units = _Parser.getWord(words, def);
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
    static getDuration(words, def) {
      let value2 = _Parser.getFloat(words, def) * _Parser.getTime_units(words, "s");
      return Math.round(value2);
    }
    static getRate(words, def, extra) {
      let value2 = _Parser.getFloat(words, def);
      if (arguments.length > 2) {
        _Parser.testWord(words, extra);
      }
      _Parser.testWord(words, "per");
      value2 *= _Parser.getTime_units(words, "s");
      return value2;
    }
  };

  // src/triggers.js
  var Trigger = class {
    constructor(scene, timestamp, params) {
      this.scene = scene;
      this.triggered = false;
      this.expired = false;
      this.nextUpdate = 0;
      this.triggerTime = 0;
      this.createTime = timestamp;
      this.params = params;
      this.expanded = null;
    }
    fired(timestamp) {
      return false;
    }
    expandAll(input) {
      let expanded = this.scene.varList.expandVars(input);
      expanded = evaluate(expanded);
      return Parser.splitWords(expanded);
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
      this.triggerTime = null;
    }
    fired(timestamp) {
      if (this.expired) {
        return false;
      }
      if (this.expanded == null) {
        this.expanded = this.expandAll(this.params);
        this.triggerTime = this.createTime + Parser.getDuration(this.expanded, 1) * 1e3;
      }
      if (timestamp > this.triggerTime) {
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
      this.triggerRate = null;
      this.last_triggered = timestamp;
    }
    fired(timestamp) {
      if (this.expanded == null) {
        this.expanded = this.expandAll(this.params);
        this.triggerRate = Parser.getDuration(this.expanded, 1) * 1e3;
      }
      if (timestamp - this.last_triggered > this.triggerRate) {
        this.triggered = true;
        this.last_triggered = timestamp;
        return true;
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
      this.nextCheck = 0;
      this.valid = true;
    }
    fired(timestamp) {
      if (!this.valid) {
        return false;
      }
      if (this.expanded == null) {
        this.expanded = this.expandAll(this.params);
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
      if (this.nextCheck > timestamp) {
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
        this.nextCheck = timestamp + 60 * 60 * 1e3;
      }
      return matched;
    }
  };
  var ThenClass = class extends Trigger {
    constructor(scene, timestamp, params, actionGroup) {
      super(scene, timestamp, params);
      this.actionGroup = actionGroup;
    }
    fired(timestamp) {
      if (this.expired) {
        return false;
      }
      if (this.actionGroup.isFinished()) {
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
        this.expanded = this.expandAll(this.params);
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

  // src/wordlist.js
  var WordList = class {
    constructor(input) {
      this.index = 0;
      const result = [];
      let current = "";
      let currentWord = "";
      let inQuotes = false;
      let escape = false;
      for (let i = 0; i < input.length; i++) {
        const char = input[i];
        if (escape) {
          current += char;
          escape = false;
          continue;
        }
        if (char === "\\") {
          escape = true;
          continue;
        }
        if (char === '"') {
          inQuotes = !inQuotes;
          continue;
        }
        if (char === " " && !inQuotes) {
          if (current.length > 0) {
            result.push(current);
            current = "";
          }
          continue;
        }
        current += char;
      }
      if (current.length > 0) {
        result.push(current);
      }
      this.words = result;
      if (result.length) {
        this.currentWord = this.words[0];
      }
    }
    nextWord() {
      if (++this.index < this.words.length) {
        this.currentWord = this.words[this.index];
      } else {
        this.currentWord = false;
      }
    }
    rewind(toIndex) {
      this.index = toIndex;
      this.currentWord = this.words[this.index];
    }
    allUsed() {
      return this.index >= this.words.length;
    }
    wordsLeft() {
      return this.words.length - this.index;
    }
    joinWords() {
      let result = "";
      let isFirst = true;
      for (let i = this.index; i < this.words.length; i++) {
        if (isFirst) {
          isFirst = false;
        } else {
          result += " ";
        }
        if (this.words[i].includes(" ")) {
          result += `"${this.words[i]}"`;
        } else {
          result += this.words[i];
        }
      }
      return result;
    }
    randomWord() {
      if (this.allUsed()) {
        return false;
      } else if (this.wordsLeft() == 1) {
        return this.currentWord;
      }
      const randomIndex = this.index + Math.floor(Math.random() * this.wordsLeft());
      return this.words[randomIndex];
    }
    matchWords(searchWord, anchor = false) {
      if (this.allUsed()) {
        return false;
      }
      const matchWords = this.words.slice(this.index);
      let matches = [];
      if (anchor == "start") {
        matches = matchWords.filter((word) => word.startsWith(searchWord));
      } else if (anchor == "end") {
        matches = matchWords.filter((word) => word.endsWith(searchWord));
      } else {
        matches = matchWords.filter((word) => word.includes(searchWord));
      }
      return matches;
    }
    testWord(target, def = false) {
      let result = def;
      if (this.wordsLeft()) {
        const compareTo = this.currentWord.toLowerCase();
        if (target instanceof Array) {
          for (let i = 0; i < target.length; i++) {
            if (compareTo == target[i]) {
              result = this.currentWord;
              this.nextWord();
              break;
            }
          }
        } else if (compareTo == target) {
          result = this.currentWord;
          this.nextWord();
        }
      }
      return result;
    }
    getInt(def = false, min = false, max = false) {
      let result = def;
      if (this.wordsLeft()) {
        const candidate = this.getFloat();
        if (candidate !== false) {
          result = Math.floor(candidate);
          if (min !== false && result < min) {
            result = min;
          }
          if (max !== false && result > max) {
            result = max;
          }
        }
      }
      return result;
    }
    getFloat(def = false) {
      let result = def;
      if (this.wordsLeft()) {
        const candidate = this.currentWord;
        if (candidate.match(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/)) {
          result = parseFloat(candidate);
          this.nextWord();
        }
      }
      return result;
    }
    indexOfWord(target) {
      return this.words.indexOf(target);
    }
    sliceWords(start, end) {
      if (arguments.length == 1) {
        return this.words.slice(start);
      } else {
        return this.words.slice(start, end);
      }
    }
    getWord(def = false) {
      let result = def;
      if (this.wordsLeft()) {
        result = this.currentWord;
        this.nextWord();
      }
      return result;
    }
    getTimeUnitMultiplier() {
      let mult = 1;
      if (this.allUsed()) {
        return mult;
      }
      const candidate = this.currentWord;
      let found = true;
      switch (candidate) {
        case "s":
        case "sec":
        case "secs":
        case "second":
        case "seconds":
          break;
        case "m":
        case "min":
        case "mins":
        case "minute":
        case "minutes":
          mult = 60;
          break;
        case "h":
        case "hr":
        case "hrs":
        case "hour":
        case "hours":
          mult = 3600;
          break;
        case "t":
        case "tenth":
        case "tenths":
          mult = 0.1;
          break;
        default:
          found = false;
          Globals.log.error("Unknown time unit - " + candidate);
          break;
      }
      if (found) {
        this.nextWord();
      }
      return mult;
    }
    getDuration(def = 0, requireIn = false) {
      let value2 = def;
      const hold = this.index;
      if (this.wordsLeft()) {
        if (this.currentWord == "in") {
          this.nextWord();
        } else {
          if (requireIn) {
            this.rewind(hold);
            return value2;
          }
        }
        value2 = this.getFloat();
        if (value2 !== false) {
          value2 *= this.getTimeUnitMultiplier();
        }
      }
      return value2;
    }
    getGroup(sceneName) {
      let groupSprite = null;
      let hold = this.index;
      if (this.testWord(["in", "to"])) {
        if (this.getWord() != "group") {
          this.rewind(hold);
        } else {
          const groupName = this.getWord();
          if (groupName) {
            groupSprite = SGSprite.getSprite(sceneName, groupName, true);
            if (groupSprite && groupSprite.type != SPRITE_GROUP) {
              Globals.log.error("Not a group at line " + action.number);
            }
          }
        }
      }
      return groupSprite;
    }
  };

  // src/scene.js
  var Scene2 = class _Scene {
    constructor(sceneName) {
      this.name = sceneName;
      this.state = SCENE_STOPPED;
      this.content = [];
      this.interactive_index = 0;
      this.reset();
    }
    reset() {
      this.actionGroups = [];
      this.images = [];
      this.sprites = [];
      this.folder = "";
      this.spriteScene = this.name;
      this.varList = new VarList(this.name);
      this.timers = [];
      this.completionCallback = null;
      this.parameters = defaults_default.NOTFOUND;
      this.graphicFill = "black";
      this.graphicStroke = "black";
      this.graphicStrokeWidth = 1;
      this.echo = false;
    }
    static find(scene_name, report = true) {
      for (let i = 0; i < Globals.scenes.length; i++) {
        if (scene_name == Globals.scenes[i].name) {
          return Globals.scenes[i];
        }
      }
      if (report) {
        Globals.log.error("Cannot find scene " + scene_name);
      }
      return false;
    }
    showSceneData() {
      let text = "Scene: " + this.name + "\n";
      text += "State: " + this.state + "\n";
      text += "Contains " + this.actionGroups.length + " action groups\n";
      text += this.images.length + " images\n";
      text += this.sprites.length + " sprites\n";
      return text;
    }
    listSprites(verbose = true) {
      let text = verbose ? "Sprites in Scene " + this.spriteScene + "\n" : "";
      for (let i = 0; i < this.sprites.length; i++) {
        const sprite = this.sprites[i];
        if (verbose) {
          const x = sprite.locX.value();
          const y = sprite.locY.value();
          const z = sprite.depth;
          text += `${sprite.name} (${sprite.type}) `;
          text += sprite.visible ? "visible" : "hidden";
          text += ` at ${x} ${y} ${z}
`;
          const sx = sprite.sizeX.value();
          const sy = sprite.sizeY.value();
          text += `size ${sx} x ${sy} `;
          if (sprite.sgParent) {
            text += `child of ${sprite.sgParent.name}`;
          }
          text += "\n";
        } else {
          text += `${sprite.name} `;
        }
      }
      return text;
    }
    listImages(verbose = true) {
      let text = verbose ? "Images in Scene " + this.spriteScene + "\n" : "";
      for (let i = 0; i < this.images.length; i++) {
        const image = this.images[i];
        if (verbose) {
          const width = this.images[i].piImage.width;
          const height = this.images[i].piImage.height;
          text += `Name ${image.name} `;
          text += image.loading ? "loaded" : "loading";
          text += ` from ${image.url}
`;
          text += `Width: ${width} Height: ${height}
`;
        } else {
          text += `${image.name} `;
        }
      }
      return text;
    }
    stop(reset = false) {
      this.state = SCENE_STOPPED;
      this.parameters = defaults_default.NOTFOUND;
      this.actionGroups = [];
      for (let i = 0; i < this.sprites; i++) {
        const sgSprite = this.sprites[i];
        if (sgSprite.piSprite != null) {
          sgSprite.piSprite.destroy();
        }
      }
      this.sprites = [];
      if (reset) {
        this.reset();
      }
      if (this.completionCallback != null) {
        this.completionCallback();
        this.completionCallback = null;
      }
    }
    pause() {
      if (this.state == SCENE_RUNNING) {
        this.state = SCENE_PAUSED;
      }
    }
    resume() {
      if (this.state == SCENE_PAUSED) {
        this.state = SCENE_RUNNING;
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
      if (this.state != SCENE_STOPPED) {
        return;
      }
      this.actionGroups = [];
      this.parameters = parameters;
      let actionGroup = new ActionGroup();
      let state = "T";
      let timestamp = Date.now();
      for (let i = 0; i < this.content.length; i++) {
        let trigger = null;
        const lineNo = this.content[i].number;
        const wordList = new WordList(this.content[i].text);
        const keyword = wordList.getWord();
        switch (keyword.toLowerCase()) {
          case "when":
            const allOrAny = wordList.testWord(["all", "any"]);
            if (allOrAny == "all") {
              actionGroup.any_trigger = false;
            } else if (allOrAny == false) {
              Globals.log.error("Unknown when condition - ");
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
          case "after":
            trigger = new After(this, timestamp, wordList.joinWords());
            break;
          case "on":
            let on_word = wordList.getWord();
            switch (on_word) {
              case "key":
                wordList.testWord("press");
                trigger = new Trigger("ONKEY", wordList.joinWords());
                break;
              case "keypress":
                trigger = new Trigger("ONKEY", wordList.joinWords());
                break;
              case "mouse":
                wordList.testWord("click");
                trigger = new Trigger("MOUSECLICK", wordList.joinWords());
                break;
              default:
                Globals.log.error("Unknown trigger type on " + on_word + " at line " + lineNo);
                break;
            }
            break;
          case "at":
            wordList.testWord("time");
            trigger = new AtClass(this, timestamp, wordList.joinWords());
            break;
          case "each":
            wordList.testWord("time");
            trigger = new Each(this, timestamp, wordList.joinWords());
            break;
          case "then":
            if (state == "T") {
              Globals.log.error("Then must be the only trigger in that group");
            } else {
              trigger = new ThenClass(this, timestamp, wordList.joinWords(), actionGroup);
            }
            break;
          case "every":
            trigger = new Every(this, timestamp, wordList.joinWords());
            break;
          case "triggers":
          case "trigger":
            continue;
          case "action":
          case "actions":
            continue;
          default:
            break;
        }
        if (trigger !== null) {
          if (state == "T") {
            actionGroup.addTrigger(trigger);
          } else {
            this.actionGroups.push(actionGroup);
            actionGroup = new ActionGroup();
            actionGroup.addTrigger(trigger);
            state = "T";
          }
          continue;
        }
        state = "A";
        if (actionGroup.triggers.length < 1) {
          Globals.log.error("No trigger for action in scene " + this.name + " at line " + lineNo);
        }
        actionGroup.addAction(this.content[i]);
      }
      this.actionGroups.push(actionGroup);
      this.state = SCENE_RUNNING;
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
      let actionGroup = this.actionGroups[index];
      actionGroup.resetUnfinishedt();
      let actions = actionGroup.actions;
      actionGroup.nextAction = 0;
      do {
        this.runAction(actionGroup.nextAction, actionGroup, now);
      } while (actionGroup.nextAction < actions.length);
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
    runAction(actionIndex, actionGroup, now) {
      const action2 = actionGroup.actions[actionIndex];
      actionGroup.nextAction += 1;
      if (actionGroup.failedIfCount > 0) {
        const special = action2.text.match(/^[^a-z]*(if|endif)/);
        if (special && special[1] == "endif") {
          actionGroup.failedIfCount -= 1;
        } else if (special && special[1] == "if") {
          actionGroup.failedIfCount += 1;
        }
        return;
      }
      const expandedText = this.varList.expandVars(action2.text);
      const evaluatedText = evaluate(expandedText);
      if (this.echo) {
        Globals.log.report("> " + evaluatedText);
      }
      const wordList = new WordList(evaluatedText);
      wordList.testWord("and");
      let command = wordList.getWord().toLowerCase();
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
          const request = wordList.getWord("flip");
          switch (request) {
            case "flip":
              this.echo = !this.echo;
              break;
            case "on":
              this.echo = true;
              break;
            case "off":
              this.echo = false;
              break;
          }
          break;
        case "debug":
          const thisLevel = wordList.getInt(0);
          const targetLevel = this.varList.getValue("_MAIN_:DEBUG_LEVEL", false);
          if (targetLevel != defaults_default.NOTFOUND && thisLevel >= targetLevel) {
            Globals.log.report(wordList.joinWords());
          }
          break;
        case "log":
        case "print":
          Globals.log.report(wordList.joinWords());
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
          if (wordList.wordsLeft() < 1) {
            Globals.log.error("Missing filename at line " + action2.number);
            break;
          }
          let filename = wordList.getWord();
          wordList.testWord(["named", "as"]);
          if (wordList.wordsLeft() > 0) {
            tag = wordList.getWord();
          } else {
            let slash = filename.lastIndexOf("/");
            let dot = filename.lastIndexOf(".");
            tag = filename.slice(slash, dot);
          }
          for (let j = 0; j < this.images.length; j++) {
            if (this.images[j].tag == tag) {
              continue;
            }
          }
          if (filename.endsWith(".jpg") || filename.endsWith(".jpeg") || filename.endsWith(".png")) {
            const sg_image = new SGImage(this.folder + filename, tag);
            this.images.push(sg_image);
            sg_image.load_image();
          } else if (filename.endsWith(".wav") || filename.endsWith(".mp3")) {
            AudioManager.create(tag, this.folder + filename);
          }
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
          if (wordList.wordsLeft() > 0) {
            this.folder = wordList.getWord() + "/";
          } else {
            Globals.log.error("Expected folder name at " + action2.number);
          }
          break;
        /**************************************************************************************************
        
           #### ##    ##  ######  ##       ##     ## ########  ######## 
            ##  ###   ## ##    ## ##       ##     ## ##     ## ##       
            ##  ####  ## ##       ##       ##     ## ##     ## ##       
            ##  ## ## ## ##       ##       ##     ## ##     ## ######   
            ##  ##  #### ##       ##       ##     ## ##     ## ##       
            ##  ##   ### ##    ## ##       ##     ## ##     ## ##       
           #### ##    ##  ######  ########  #######  ########  ######## 
        
        **************************************************************************************************/
        case "include":
        case "require":
          if (wordList.wordsLeft() > 0) {
            const URL = wordList.getWord();
            slowGlass.scriptFromURL(URL, true);
          } else {
            Globals.log.error("Expected URL at " + action2.number);
          }
          break;
        /**************************************************************************************************
        
           ##      ## #### ######## ##     ## 
           ##  ##  ##  ##     ##    ##     ## 
           ##  ##  ##  ##     ##    ##     ## 
           ##  ##  ##  ##     ##    ######### 
           ##  ##  ##  ##     ##    ##     ## 
           ##  ##  ##  ##     ##    ##     ## 
            ###  ###  ####    ##    ##     ## 
        
        **************************************************************************************************/
        case "with":
          if (wordList.wordsLeft() > 0) {
            this.spriteScene = wordList.getWord();
          } else {
            Globals.log.error("Expected folder name at " + action2.number);
          }
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
            const reset_type = wordList.testWord(["sprite", "scene", "from", "with"], "scene");
            if (reset_type == "sprite") {
              if (wordList.wordsLeft() > 0) {
                let spriteName2 = wordList.getWord();
                let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
                if (!sgSprite2) {
                  break;
                }
                sgSprite2.resetsize();
                sgSprite2.jiggle(0, 0, 0, 0);
                sg_spitre.flicker(0);
                sgSprite2.blink(0, 0);
                sgSprite2.pulse(0);
                sgSprite2.flip("r");
                sgSprite2.setTint("stop");
                sgSprite2.setBlur(0);
                sg_spriet.setSkew(0, 0);
                sgSprite2.rotate("to", 0, "in");
              } else {
                Globals.log.error("Missing sprite name at line " + action2.number);
              }
            } else if (reset_type == "scene") {
              let sceneName = this.name;
              if (wordList.wordsLeft() > 0) {
                let sceneName2 = wordList.getWord();
              }
              const scene = _Scene.find(sceneName);
              if (scene != false) {
                scene.stop(true);
              } else {
                Globals.log.error("Scene not found at line " + action2.number);
              }
            } else if (reset_type == "from") {
              this.folder = "";
            } else if (reset_type == "with") {
              this.defaultScene = this.name;
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
          if (wordList.wordsLeft() > 0) {
            const sprite_command = wordList.getWord();
            switch (sprite_command) {
              // more to add here?
              case "create":
                {
                  let spriteName2 = false;
                  let groupName = null;
                  if (wordList.testWord("named") || !wordList.testWord("from")) {
                    spriteName2 = wordList.getWord();
                  }
                  const groupSprite = wordList.getGroup(this.spriteScene);
                  wordList.testWord("from");
                  let imageName = wordList.getWord();
                  if (!spriteName2) {
                    spriteName2 = imageName;
                  }
                  let sgSprite2 = new SGSprite(imageName, spriteName2);
                  if (groupSprite) {
                    sgSprite2.sgParent = groupSprite;
                  }
                  if (wordList.testWord("view")) {
                    const x = wordList.getInt(0);
                    const y = wordList.getInt(0);
                    const w = wordList.getInt(0);
                    const h = wordList.getInt(0);
                    if (w > 0 && h > 0) {
                      sgSprite2.setView(x, y, w, h, "in", 0, now, null);
                      sgSprite2.sizeX.setTargetValue(w);
                      sgSprite2.sizeY.setTargetValue(h);
                    }
                  }
                  sgSprite2.setVisibility(false);
                  this.sprites.push(sgSprite2);
                }
                break;
              default:
                Globals.log.error("Unknown sprite command at line " + action2.number);
            }
          } else {
            Globals.log.error("Missing sprite data at line " + action2.number);
          }
          break;
        /**************************************************************************************************
        
           ##     ## #### ######## ##      ## 
           ##     ##  ##  ##       ##  ##  ## 
           ##     ##  ##  ##       ##  ##  ## 
           ##     ##  ##  ######   ##  ##  ## 
            ##   ##   ##  ##       ##  ##  ## 
             ## ##    ##  ##       ##  ##  ## 
              ###    #### ########  ###  ###  
        
        **************************************************************************************************/
        case "view":
          if (wordList.wordsLeft() > 0) {
            let spriteName2 = wordList.getWord();
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (!sgSprite2) {
              break;
            }
            wordList.testWord("to");
            const x = wordList.getInt(0);
            const y = wordList.getInt(0);
            const w = wordList.getInt(0);
            const h = wordList.getInt(0);
            let inOrAt = wordList.testWord(["in", "at"], "in");
            let duration2 = wordList.getDuration(0);
            if (w > 0 && h > 0) {
              sgSprite2.setView(
                x,
                y,
                w,
                h,
                inOrAt,
                duration2,
                now,
                makeCompletionCallback(actionGroup)
              );
            } else {
              Globals.log.error("Not sensible view data at line " + action2.number);
            }
          } else {
            Globals.log.error("Missing view data at line " + action2.number);
          }
          break;
        /**************************************************************************************************
        
            ######   ######  ########   #######  ##       ##       
           ##    ## ##    ## ##     ## ##     ## ##       ##       
           ##       ##       ##     ## ##     ## ##       ##       
            ######  ##       ########  ##     ## ##       ##       
                 ## ##       ##   ##   ##     ## ##       ##       
           ##    ## ##    ## ##    ##  ##     ## ##       ##       
            ######   ######  ##     ##  #######  ######## ######## 
        
        **************************************************************************************************/
        case "scroll":
          if (wordList.wordsLeft() > 0) {
            let spriteName2 = wordList.getWord();
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (!sgSprite2) {
              break;
            }
            if (!sgSprite2.windowed) {
              Globals.log.error("Sprite does not have view window " + action2.number);
              break;
            }
            const direction = wordList.testWord(["stop", "left", "right", "up", "down"]);
            wordList.testWord("at");
            const dx = wordList.getFloat(0);
            const dy = wordList.getFloat(0);
            switch (direction) {
              case "stop":
                sgSprite2.setScroll(0, 0);
                break;
              case "right":
                sgSprite2.setScroll(dx, 0);
                break;
              case "left":
                sgSprite2.setScroll(dx * -1, 0);
                break;
              case "up":
                sgSprite2.setScroll(0, dy * -1);
                break;
              case "down":
                sgSprite2.setScroll(0, dy);
                break;
              default:
                sgSprite2.setScroll(dx, dy);
            }
          } else {
            Globals.log.error("Missing scroll data at line " + action2.number);
          }
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
          if (wordList.wordsLeft() > 0) {
            let spriteName2 = wordList.getWord();
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (!sgSprite2) {
              break;
            }
            const hidden = wordList.testWord("hidden");
            wordList.testWord("at");
            if (wordList.testWord(["center", "centre"])) {
              sgSprite2.locX.setTargetValue(Globals.app.screen.width / 2);
              sgSprite2.locY.setTargetValue(Globals.app.screen.height / 2);
            } else {
              sgSprite2.locX.setTargetValue(wordList.getInt(0) * Globals.scriptScaleX);
              sgSprite2.locY.setTargetValue(wordList.getInt(0) * Globals.scriptScaleY);
            }
            wordList.testWord("depth");
            sgSprite2.setDepth("to", wordList.getInt(0));
            wordList.testWord(["size", "scale"]);
            let width = wordList.getInt(0);
            let height = wordList.getInt(0);
            if (height < 1 && width > 1) {
              height = sgSprite2.piSprite.texture.height / sgSprite2.piSprite.texture.width * width;
            } else if (width < 1 && height > 1) {
              width = sgSprite2.piSprite.texture.width / sgSprite2.piSprite.texture.height * height;
            }
            if (width > 0 && height > 0) {
              sgSprite2.sizeX.setTargetValue(width * Globals.scriptScaleX);
              sgSprite2.sizeY.setTargetValue(height * Globals.scriptScaleY);
            }
            if (!hidden) {
              sgSprite2.setVisibility(true);
            }
            if (sgSprite2.sgParent) {
              sgSprite2.sgParent.sizeX.forceValue(sgSprite2.sgParent.piSprite.width);
              sgSprite2.sgParent.sizeY.forceValue(sgSprite2.sgParent.piSprite.height);
            }
          } else {
            Globals.log.error("Missing place data at line " + action2.number);
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
          if (wordList.wordsLeft() > 0) {
            let spriteName2 = wordList.getWord();
            wordList.testWord("with");
            let imageName = wordList.getWord();
            let hidden = wordList.testWord("hidden");
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (!sgSprite2) {
              break;
            }
            if (hidden) {
              sgSprite2.setVisibility(false);
            }
            sgSprite2.imageName = imageName;
            sgSprite2.piSprite.texture = PIXI.Texture.EMPTY;
          } else {
            Globals.log.error("Missing replace data at line " + action2.number);
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
          if (wordList.wordsLeft() > 0) {
            let imageName = wordList.getWord();
            let spriteName2 = null;
            if (wordList.testWord("named")) {
              spriteName2 = wordList.getWord(imageName);
            }
            wordList.testWord(["as", "at"]);
            let role = wordList.testWord([
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
              Globals.log.error("Unknown role " + role + " at line " + action2.number);
              break;
            }
            if (spriteName2 == null) {
              spriteName2 = role;
            }
            let sgSprite2 = new SGSprite(imageName, spriteName2);
            sgSprite2.role = role;
            wordList.testWord(["as", "at"]);
            if (wordList.testWord("depth")) {
              sgSprite2.depth = wordList.getInt(0);
            } else {
              sgSprite2.depth = null;
            }
            this.sprites.push(sgSprite2);
          } else {
            Globals.log.error("Missing put data at line " + action2.number);
          }
          break;
        /**************************************************************************************************
        
            ######   ########   #######  ##     ## ########  
           ##    ##  ##     ## ##     ## ##     ## ##     ## 
           ##        ##     ## ##     ## ##     ## ##     ## 
           ##   #### ########  ##     ## ##     ## ########  
           ##    ##  ##   ##   ##     ## ##     ## ##        
           ##    ##  ##    ##  ##     ## ##     ## ##        
            ######   ##     ##  #######   #######  ##        
        
        **************************************************************************************************/
        case "group":
          if (wordList.wordsLeft() > 0) {
            switch (wordList.getWord()) {
              // more to add here?
              case "create":
                {
                  wordList.testWord("named");
                  const groupName = wordList.getWord();
                  if (SGSprite.getSprite(this.spriteScene, groupName, false)) {
                    break;
                  }
                  const sgSprite2 = new SGSprite(null, groupName, SPRITE_GROUP);
                  const group = new PIXI.Container();
                  const superGroupSprite = wordList.getGroup(this.spriteScene);
                  wordList.testWord("size");
                  const width = wordList.getInt(0);
                  const height = wordList.getInt(0);
                  if (width > 0 && height > 0) {
                    sgSprite2.sizeX.setTargetValue(width);
                    sgSprite2.sizeY.setTargetValue(height);
                    group.pivot.set(width / 2, height / 2);
                  } else if (superGroupSprite) {
                    const parentWidth = superGroupSprite.sizeX;
                    const parentHeight = superGroupSprite.sizeY;
                    sgSprite2.sizeX.setTargetValue(parentWidth);
                    sgSprite2.sizeY.setTargetValue(parentHeight);
                    group.pivot.set(parentWidth / 2, parentHeight / 2);
                  } else {
                    group.pivot.set(Globals.displayWidth / 2, Globals.displayHeight / 2);
                  }
                  sgSprite2.depth = Globals.nextZ(0);
                  group.zIndex = sgSprite2.depth;
                  if (superGroupSprite) {
                    sgSprite2.sgParent = superGroupSprite;
                    superGroupSprite.piSprite.addChild(group);
                  } else {
                    Globals.root.addChild(group);
                  }
                  sgSprite2.piSprite = group;
                  sgSprite2.setVisibility(false);
                  sgSprite2.locX.forceValue(0);
                  sgSprite2.locY.forceValue(0);
                  this.sprites.push(sgSprite2);
                }
                break;
              case "add": {
                const spriteName2 = wordList.getWord();
                const sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
                if (!sgSprite2) {
                  break;
                }
                const groupSprite = wordList.getGroup(this.spriteScene);
                if (!groupSprite) {
                  break;
                }
                sgSprite2.sgParent = groupSprite;
                groupSprite.piSprite.reparentChild(sgSprite2.piSprite);
                sgSprite2.sizeX.forceValue(groupSprite.width);
                sgSprite2.sizeY.forceValue(groupSprite.height);
                break;
              }
              default:
                Globals.log.error("Unknown group command at line " + action2.number);
            }
          } else {
            Globals.log.error("Missing group data at line " + action2.number);
          }
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
          if (wordList.wordsLeft() > 0) {
            const resourceName = wordList.getWord();
            wordList.testWord("fade");
            wordList.testWord("in");
            const fadein = wordList.getDuration(0);
            wordList.testWord("at");
            wordList.testWord("volume");
            const volume = wordList.getInt(50, defaults_default.VOLUME_MIN, defaults_default.VOLUME_MAX);
            AudioManager.play(resourceName, { fadeInMs: fadein * 1e3, targetVolume: volume });
          } else {
            Globals.log.error("Nothing to play at line " + action2.number);
          }
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
          if (wordList.wordsLeft() > 0) {
            wordList.testWord("of");
            const resourceName = wordList.getWord();
            wordList.testWord("to");
            const volume = wordList.getInt(0, defaults_default.VOLUME_MIN, defaults_default.VOLUME_MAX);
            const fadein = wordList.getDuration(0);
            AudioManager.setVolume(resourceName, volume, { fadeMs: fadein * 1e3 });
          } else {
            Globals.log.error("No volume change at line " + action2.number);
          }
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
          if (wordList.wordsLeft() > 2) {
            let groupName = null;
            const textCommand = wordList.getWord();
            const textName = wordList.getWord();
            const groupSprite = wordList.getGroup(this.spriteScene);
            const textData = wordList.joinWords();
            let sgSprite2 = null;
            if (textCommand == "create") {
              sgSprite2 = new SGSprite(null, textName, SPRITE_TEXT);
              const textSprite = new PIXI.Text({
                text: textData,
                style: {
                  fontFamily: sgSprite2.textFont,
                  fontSize: sgSprite2.textFont,
                  fill: sgSprite2.fillColour,
                  align: sgSprite2.textAlign
                }
              });
              sgSprite2.piSprite = textSprite;
              sgSprite2.piSprite.anchor = 0.5;
              sgSprite2.setVisibility(false);
              sgSprite2.sizeX.setTargetValue(textSprite.width);
              sgSprite2.sizeY.setTargetValue(textSprite.height);
              if (groupSprite) {
                sgSprite2.sgParent = groupSprite;
                groupSprite.piSprite.addChild(graphic);
              } else {
                Globals.root.addChild(textSprite);
              }
              this.sprites.push(sgSprite2);
              break;
            }
            sgSprite2 = SGSprite.getSprite(this.spriteScene, textName);
            if (sgSprite2.type != SPRITE_TEXT) {
              Globals.log.error("Sprite is not text at " + action2.number);
              break;
            }
            let doUpdate = true;
            switch (textCommand) {
              case "font":
              case "fontfamily":
                sgSprite2.textFont = textData;
                break;
              case "fontsize":
              case "size":
                sgSprite2.textFont = textData;
                break;
              case "align":
                sgSprite2.textAlign = textData;
                break;
              case "color":
              case "colour":
                sgSprite2.fillColour = textData;
                sgSprite2.strokeColour = textData;
                break;
              case "fill":
                sgSprite2.fillColour = textData;
                break;
              case "stroke":
                sgSprite2.strokeColour = textData;
                break;
              case "add":
                sgSprite2.piSprite.text += "\n" + textData;
                break;
              case "replace":
                sgSprite2.piSprite.text = textData;
                break;
              default:
                doUpdate = false;
                Globals.log.error("Unknown text command at " + action2.number);
                break;
            }
            if (doUpdate) {
              sgSprite2.setStyle();
              sgSprite2.sizeX.setTargetValue(sgSprite2.piSprite.width);
              sgSprite2.sizeY.setTargetValue(sgSprite2.piSprite.height);
            }
          } else {
            Globals.log.error("Missing argument at line " + action2.number);
          }
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
          if (wordList.wordsLeft() > 1) {
            const graphicCommand = wordList.getWord();
            switch (graphicCommand) {
              case "create": {
                const graphicTag = wordList.getWord();
                const groupSprite = wordList.getGroup(this.spriteScene);
                wordList.testWord("as");
                const graphicType = wordList.getWord();
                let graphic2 = null;
                switch (graphicType) {
                  case "rectangle":
                  case "rect":
                    {
                      const w = wordList.getInt(0);
                      const h = wordList.getInt(w);
                      const r = wordList.getInt(0);
                      if (w > 0 && h > 0) {
                        if (r > 0) {
                          graphic2 = new PIXI.Graphics().roundRect(w / -2, h / -2, w, h, r);
                        } else {
                          graphic2 = new PIXI.Graphics().rect(w / -2, h / -2, w, h);
                        }
                      }
                    }
                    break;
                  case "circle":
                    {
                      const r = wordList.getInt(0);
                      if (r > 0) {
                        graphic2 = new PIXI.Graphics().circle(0, 0, r);
                      }
                    }
                    break;
                  case "line":
                    {
                      const r = wordList.getInt(0);
                      if (r > 0) {
                        graphic2 = new PIXI.Graphics().moveTo(l / -2, 0).lineTo(l / 2, 0);
                      }
                    }
                    break;
                  case "ellipse":
                    {
                      const w = wordList.getInt(0);
                      const h = wordList.getInt(w);
                      if (w > 0 && h > 0) {
                        graphic2 = new PIXI.Graphics().ellipse(w / -2, h / -2, w, h);
                      }
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
                      if (p > 2 && r0 > 0) {
                        if (ri > 0) {
                          graphic2 = new PIXI.Graphics().star(0, 0, p, ro, ri);
                        } else {
                          graphic2 = new PIXI.Graphics().star(0, 0, p, ro);
                        }
                      }
                    }
                    break;
                  case "grid":
                    {
                      const x = wordList.getInt(100);
                      const y = wordList.getInt(x);
                      graphic2 = new PIXI.Graphics();
                      const width = Globals.app.screen.width;
                      const height = Globals.app.screen.height;
                      if (x > 10 && y > 10) {
                        for (let i = width / -2 + x; i < width / 2; i += x) {
                          graphic2.moveTo(i, height / -2).lineTo(i, height / 2);
                        }
                        for (let j = height / -2 + y; j < height / 2; j += y) {
                          graphic2.moveTo(width / -2, j).lineTo(width / 2, j);
                        }
                      }
                    }
                    break;
                  default:
                    Globals.log.error("Unknown graphic type at " + action2.number);
                    break;
                }
                if (graphic2 != null) {
                  graphic2.fill(this.graphicFill).stroke({ width: this.graphicStrokeWidth, color: this.graphicStroke });
                  const sgSprite2 = new SGSprite(null, graphicTag, SPRITE_GRAPHIC);
                  if (groupSprite) {
                    sgSprite2.sgParent = groupSprite;
                    groupSprite.piSprite.addChild(graphic2);
                  } else {
                    Globals.root.addChild(graphic2);
                  }
                  sgSprite2.piSprite = graphic2;
                  sgSprite2.setVisibility(false);
                  sgSprite2.sizeX.setTargetValue(graphic2.width);
                  sgSprite2.sizeY.setTargetValue(graphic2.height);
                  this.sprites.push(sgSprite2);
                } else {
                  Globals.log.error("Invalid graphic arguments at " + action2.number);
                }
                break;
              }
              case "color":
              case "colour":
                this.graphicFill = wordList.getWord("black");
                this.graphicStroke = wordList.getWord("black");
                break;
              case "fill":
                this.graphicFill = wordList.getWord("black");
                break;
              case "stroke":
                if (wordList.testWord("width")) {
                  this.graphicStrokeWidth = wordList.getInt(1);
                } else {
                  this.graphicStroke = wordList.getWord("black");
                }
                break;
              default:
                Globals.log.error("Unknown graphics command at " + action2.number);
                break;
            }
          } else {
            Globals.log.error("Missing argument at line " + action2.number);
          }
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
          if (wordList.wordsLeft() > 0) {
            let spriteName2 = wordList.getWord();
            const direction = wordList.testWord(["horizontally", "hor", "h", "vertically", "vert", "v"]);
            let delta = 0;
            let x = 0;
            let y = 0;
            let byOrTo = wordList.getWord(["by", "to"]);
            if (byOrTo === false) {
              Globals.log.error("Expected by or to on line " + action2.number);
              break;
            }
            if (direction !== false) {
              delta = wordList.getInt(0) * Globals.scriptScaleX;
            } else {
              x = wordList.getInt(0) * Globals.scriptScaleX;
              y = wordList.getInt(0) * Globals.scriptScaleY;
            }
            let inOrAt = wordList.testWord(["in", "at"], "in");
            let duration2 = wordList.getDuration(0);
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (!sgSprite2) {
              break;
            }
            switch (direction) {
              case "horizontally":
              case "hor":
              case "h":
                sgSprite2.move(delta, false, byOrTo, inOrAt, duration2, now, makeCompletionCallback(actionGroup));
                break;
              case "vertically":
              case "vert":
              case "v":
                sgSprite2.move(false, delta, byOrTo, inOrAt, duration2, now, makeCompletionCallback(actionGroup));
                break;
              default:
                sgSprite2.move(x, y, byOrTo, inOrAt, duration2, now, makeCompletionCallback(actionGroup));
                break;
            }
          } else {
            Globals.log.error("Missing move data at line " + action2.number);
          }
          break;
        /**************************************************************************************************
        
        ########  #### ##     ##  #######  ######## 
        ##     ##  ##  ##     ## ##     ##    ##    
        ##     ##  ##  ##     ## ##     ##    ##    
        ########   ##  ##     ## ##     ##    ##    
        ##         ##   ##   ##  ##     ##    ##    
        ##         ##    ## ##   ##     ##    ##    
        ##        ####    ###     #######     ##    
        
        **************************************************************************************************/
        case "pivot":
          if (wordList.wordsLeft() > 0) {
            let spriteName2 = wordList.getWord();
            wordList.testWord(["around", "from"]);
            let x = wordList.getInt(0);
            let y = wordList.getInt(0);
            let duration2 = wordList.getDuration(0);
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (!sgSprite2) {
              break;
            }
            sgSprite2.pivotPoint(x, y, duration2, now, makeCompletionCallback(actionGroup));
          } else {
            Globals.log.error("Missing pivot data at line " + action2.number);
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
          let spriteName = wordList.getWord();
          wordList.testWord("to");
          let speed = wordList.getInt(0) * Globals.scriptScaleX;
          let sgSprite = SGSprite.getSprite(this.spriteScene, spriteName);
          sgSprite.set_speed(speed);
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
          if (wordList.wordsLeft() > 0) {
            let spriteName2 = wordList.getWord();
            let depth_type = wordList.getWord(["to", "by"]);
            if (depth_type === false) {
              Globals.log.error("Expected to or by on line " + action2.number);
              break;
            }
            let value2 = wordList.getInt(0);
            if (command == "lower") {
              value2 = -value2;
            }
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (sgSprite2) {
              sgSprite2.setDepth(depth_type, value2);
            }
          } else {
            Globals.log.error("Missing raise/lower data at line " + action2.number);
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
          if (wordList.wordsLeft() > 0) {
            let spriteName2 = wordList.getWord();
            let toOrBy = wordList.getWord(["to", "by", "reset"]);
            if (toOrBy === false) {
              Globals.log.error("Expected to or by on line " + action2.number);
              break;
            }
            let w = wordList.getInt(0) * Globals.scriptScaleX;
            let h = wordList.getInt(0) * Globals.scriptScaleY;
            let inOrAt = wordList.testWord(["in", "at"]);
            let duration2 = wordList.getDuration(0);
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (!sgSprite2) {
              break;
            }
            if (toOrBy == "reset") {
              sgSprite2.resetSize();
            } else {
              sgSprite2.resize(
                w,
                h,
                toOrBy,
                inOrAt,
                duration2,
                now,
                makeCompletionCallback(actionGroup)
              );
            }
          } else {
            Globals.log.error("Missing resize data at line " + action2.number);
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
          if (wordList.wordsLeft() > 0) {
            let spriteName2 = wordList.getWord();
            const toOrBy = wordList.testWord(["to", "by", "reset"]);
            let w = wordList.getInt(0);
            let h = wordList.getInt(w);
            let duration2 = wordList.getDuration(0);
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (!sgSprite2) {
              break;
            }
            if (toOrBy == "reset") {
              sgSprite2.scaleX.setTargetValue(100);
              sgSprite2.scaleY.setTargetValue(100);
            } else if (w != 0 || h != 0) {
              sgSprite2.setScale(
                w,
                h,
                command,
                toOrBy,
                duration2,
                now,
                makeCompletionCallback(actionGroup)
              );
            } else {
              Globals.log.error("Invalid scale data at line " + action2.number);
            }
          } else {
            Globals.log.error("Missing scale data at line " + action2.number);
          }
          break;
        /**************************************************************************************************
        
              ###    ##       ####  ######   ##    ## 
             ## ##   ##        ##  ##    ##  ###   ## 
            ##   ##  ##        ##  ##        ####  ## 
           ##     ## ##        ##  ##   #### ## ## ## 
           ######### ##        ##  ##    ##  ##  #### 
           ##     ## ##        ##  ##    ##  ##   ### 
           ##     ## ######## ####  ######   ##    ## 
        
        **************************************************************************************************/
        case "align":
          if (wordList.wordsLeft() > 2) {
            const spriteName2 = wordList.getWord();
            const type2 = wordList.testWord(["top", "bottom", "left", "right"]);
            wordList.testWord("to");
            const location = wordList.getInt(0);
            const duration2 = wordList.getDuration(0);
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (!sgSprite2) {
              break;
            }
            let newX = sgSprite2.locX.value();
            let newY = sgSprite2.locY.value();
            const width = sgSprite2.sizeX.value() * sgSprite2.scaleX.value();
            const height = sgSprite2.sizeY.value() * sgSprite2.scaleY.value();
            switch (type2) {
              case "top":
                newY = location + height / 2;
                break;
              case "bottom":
                newY = location - height / 2;
                break;
              case "left":
                newX = location + width / 2;
                break;
              case "right":
                newX = location - width / 2;
                break;
              default:
                Globals.log.error("Unknown alignment at line " + action2.number);
                break;
            }
            sgSprite2.move(
              newX,
              newY,
              "to",
              "in",
              duration2,
              now,
              makeCompletionCallback(actionGroup)
            );
          } else {
            Globals.log.error("Missing alignment at line " + action2.number);
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
          if (wordList.wordsLeft() > 1) {
            const type2 = wordList.testWord(["sprite", "audio", "sound", "var", "variable", "scene"]);
            const item = wordList.getWord();
            switch (type2) {
              case "sprite":
                SGSprite.remove_sprite(this.spriteScene, item, false);
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
              case "scene":
                if (item == MAIN_NAME) {
                  Globals.log.error("Cannot delete main scene on line " + action2.number);
                } else {
                  for (let i = 0; i < Globals.scenes.length; i++) {
                    if (Globals.scenes[i].name == item) {
                      if (Globals.scenes[i].state != SCENE_STOPPED) {
                        Globals.log.error("Cannot delete running scene on line " + action2.number);
                      } else {
                        Globals.scenes.splice(i, 1);
                        break;
                      }
                    }
                  }
                }
                break;
              default:
                Globals.log.error("Unknown deletion type on line " + action2.number);
                break;
            }
          } else {
            Globals.log.error("Nothing to remove at line " + action2.number);
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
          if (wordList.wordsLeft() > 0) {
            let spriteName2 = wordList.getWord();
            let turn_type = wordList.testWord(["to", "by", "at"], "to");
            let value2 = wordList.getInt(0);
            let dur_type = wordList.testWord(["in", "per"], "in");
            let duration2 = wordList.getDuration(0);
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (!sgSprite2) {
              break;
            }
            sgSprite2.rotate(turn_type, value2, dur_type, duration2, now, makeCompletionCallback(actionGroup));
          } else {
            Globals.log.error("Missing rotate data at line " + action2.number);
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
          if (wordList.wordsLeft() > 0) {
            let spriteName2 = wordList.getWord();
            let skew_type = wordList.testWord(["to", "by", "at"], "to");
            let skewX = wordList.getInt(0);
            let skewY = wordList.getInt(0);
            let dur_type = wordList.testWord(["in", "per"], "in");
            let duration2 = wordList.getDuration(0);
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (!sgSprite2) {
              break;
            }
            sgSprite2.setSkew(skewX, skewY, skew_type, duration2, now, makeCompletionCallback(actionGroup));
          } else {
            Globals.log.error("Missing skew data at line " + action2.number);
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
          if (wordList.wordsLeft() > 0) {
            let spriteName2 = wordList.getWord();
            const stop_or_at = wordList.testWord(["at", "stop"], "at");
            let angle = wordList.getInt(0);
            wordList.testWord(["deg", "degs", "degrees"]);
            wordList.testWord("with");
            wordList.testWord(["force", "velocity", "speed"]);
            let initialVelocity = wordList.getInt(10);
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (!sgSprite2) {
              break;
            }
            if (stop_or_at == "stop") {
              sgSprite2.throw("stop");
            } else {
              sgSprite2.throw(angle, initialVelocity, now, makeCompletionCallback(actionGroup));
            }
          } else {
            Globals.log.error("Missing throw data at line " + action2.number);
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
          if (wordList.wordsLeft() > 0) {
            let spriteName2 = wordList.getWord();
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (!sgSprite2) {
              break;
            }
            if (wordList.testWord("stop")) {
              sgSprite2.throw("stop");
            } else {
              sgSprite2.throw(180, 0, now, makeCompletionCallback(actionGroup));
            }
          } else {
            Globals.log.error("Missing drop data at line " + action2.number);
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
          if (wordList.wordsLeft() > 0) {
            let spriteName2 = wordList.getWord();
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (!sgSprite2) {
              break;
            }
            let axis = wordList.getWord("h");
            sgSprite2.flip(axis.charAt(0));
          } else {
            Globals.log.error("Missing sprite tag at line " + action2.number);
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
          if (wordList.wordsLeft() > 0) {
            let spriteName2 = wordList.getWord();
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (!sgSprite2) {
              break;
            }
            if (command == "show") {
              sgSprite2.setVisibility(true);
            } else if (command == "hide") {
              sgSprite2.setVisibility(false);
            } else if (command == "toggle") {
              sgSprite2.setVisibility("toggle");
            }
          } else {
            Globals.log.error("Missing sprite tag at line " + action2.number);
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
          if (wordList.wordsLeft() > 0) {
            wordList.testWord("scene");
            const scene_name = wordList.getWord();
            const scene = _Scene.find(scene_name);
            if (scene !== false) {
              this.completionCallback = makeCompletionCallback(actionGroup);
              scene.start(wordList.joinWords());
            }
          } else {
            Globals.log.error("Missing scene name at line " + action2.number);
          }
          break;
        /**************************************************************************************************
        
            ######  ##        #######  ##    ## ######## 
           ##    ## ##       ##     ## ###   ## ##       
           ##       ##       ##     ## ####  ## ##       
           ##       ##       ##     ## ## ## ## ######   
           ##       ##       ##     ## ##  #### ##       
           ##    ## ##       ##     ## ##   ### ##       
            ######  ########  #######  ##    ## ######## 
        
        **************************************************************************************************/
        case "copy":
        case "clone":
          if (wordList.wordsLeft() > 0) {
            const scene_name = wordList.getWord();
            if (scene_name == MAIN_NAME) {
              Globals.log.error("Cannot duplicate main scene at line " + action2.number);
              break;
            }
            wordList.testWord("as");
            const new_name = wordList.getWord();
            const scene = _Scene.find(scene_name, false);
            if (scene === false) {
              Globals.log.error("Scene not found at line " + action2.number);
              break;
            }
            if (_Scene.find(new_name, false)) {
              Globals.log.error("Scene with that name already exists " + action2.number);
              break;
            }
            const new_scene = new _Scene(new_name);
            new_scene.content = scene.content;
            Globals.scenes.push(new_scene);
          } else {
            Globals.log.error("Missing scene name at line " + action2.number);
          }
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
          if (wordList.wordsLeft() < 1) {
            Globals.log.error("Nothing to stop on line " + action2.number);
            break;
          }
          this.completionCallback = makeCompletionCallback(actionGroup);
          while (wordList.wordsLeft() > 0) {
            const stop_type = wordList.testWord(["scene", "audio", "sound", "track", "sprite"]);
            const item = wordList.getWord();
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
              let sgSprite2 = SGSprite.getSprite(this.spriteScene, item, false);
              if (sgSprite2) {
                sgSprite2.stop();
              }
            } else if (AudioManager.exists(item)) {
              AudioManager.delete(item);
            } else {
              const scene = _Scene.find(item);
              if (scene !== false) {
                scene.stop(false);
              } else {
                let sgSprite2 = SGSprite.getSprite(this.spriteScene, item, false);
                if (sgSprite2) {
                  sgSprite2.stop();
                }
              }
            }
          }
          break;
        /**************************************************************************************************
        
              ###     ######   ######  ####  ######   ##    ## ##     ## ######## ##    ## ######## 
             ## ##   ##    ## ##    ##  ##  ##    ##  ###   ## ###   ### ##       ###   ##    ##    
            ##   ##  ##       ##        ##  ##        ####  ## #### #### ##       ####  ##    ##    
           ##     ##  ######   ######   ##  ##   #### ## ## ## ## ### ## ######   ## ## ##    ##    
           #########       ##       ##  ##  ##    ##  ##  #### ##     ## ##       ##  ####    ##    
           ##     ## ##    ## ##    ##  ##  ##    ##  ##   ### ##     ## ##       ##   ###    ##    
           ##     ##  ######   ######  ####  ######   ##    ## ##     ## ######## ##    ##    ##    
        
        **************************************************************************************************/
        case "let":
        case "make":
          if (wordList.wordsLeft() > 0) {
            let varName = wordList.getWord();
            wordList.testWord(["be", "to"]);
            this.varList.setValue(varName, wordList.joinWords());
          } else {
            Globals.log.error("Missing variable name at line " + action2.number);
          }
          break;
        case "assign":
          if (wordList.wordsLeft() > 0) {
            const assignIndex = wordList.indexOf("as");
            if (assignIndex < 1) {
              Globals.log.error("Missing assign separator 'as' at line " + action2.number);
            } else {
              const varNames = wordList.sliceWords(1, assignIndex);
              const values = wordList.sliceWords(assignIndex + 1);
              for (let i = 0; i < varNames.length; i++) {
                let value2 = defaults_default.NOTFOUND;
                if (values.length > i) {
                  if (i == varNames.length - 1) {
                    value2 = values.slice(i).join(" ");
                  } else {
                    value2 = values[i];
                  }
                }
                this.varList.setValue(varNames[i], value2);
              }
            }
          } else {
            Globals.log.error("Missing variable name at line " + action2.number);
          }
          break;
        case "increment":
        case "decrement":
          if (wordList.wordsLeft() > 0) {
            const varName = wordList.getWord();
            if (this.varList.find(varName) === false) {
              Globals.log.error("Variable not found " + varName);
            } else {
              const currentValue = this.varList.getValue(varName);
              if (`${currentValue}`.match(/^-?[0-9]+(\.[0-9]+)?$/)) {
                const delta = command == "increment" ? 1 : -1;
                this.varList.setValue(varName, parseFloat(currentValue) + delta);
              }
            }
          } else {
            Globals.log.error("Missing variable name at line " + action2.number);
          }
          break;
        case "choose":
          if (wordList.wordsLeft() > 2) {
            let varName = wordList.getWord();
            wordList.testWord("from");
            this.varList.setValue(varName, wordList.randomWord());
          } else {
            Globals.log.error("Missing variable name at line " + action2.number);
          }
          break;
        case "match":
          if (wordList.wordsLeft() > 4) {
            const varName = wordList.getWord();
            if (!wordList.testWord("to")) {
              Globals.log.error("Missing match separator 'to' at line " + action2.number);
            } else {
              const searchWord = wordList.getWord();
              if (searchWord == null) {
                Globals.log.error("Missing search word at line " + action2.number);
              } else {
                wordList.testWord("at");
                const anchor = wordList.testWord(["start", "end"]);
                if (!wordList.testWord("from")) {
                  Globals.log.error("Missing match separator 'from' at line " + action2.number);
                } else {
                  const matches = wordList.matchWords(searchWord, anchor);
                  this.varList.setValue(varName, matches.length > 0 ? matches.join(" ") : defaults_default.NOTFOUND);
                }
              }
            }
          } else {
            Globals.log.error("Missing values for match at line " + action2.number);
          }
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
          if (wordList.wordsLeft() > 0) {
            let spriteName2 = wordList.getWord();
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (!sgSprite2) {
              break;
            }
            let on_off = wordList.testWord(["by", "stop"]);
            if (on_off == "stop") {
              sgSprite2.flicker(0, 0);
            } else {
              let flickerStrength = wordList.getInt(0, 0, 50) * Globals.scriptScaleX;
              wordList.testWord("with");
              wordList.testWord("chance");
              let flickerChance = wordList.getInt(50);
              sgSprite2.flicker(flickerStrength, flickerChance);
            }
          } else {
            Globals.log.error("Missing values at line " + action2.number);
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
          if (wordList.wordsLeft() > 0) {
            let sgSpriteName = wordList.getWord();
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, sgSpriteName);
            if (!sgSprite2) {
              break;
            }
            let on_off = wordList.testWord(["by", "stop"]);
            if (on_off == "stop") {
              sgSprite2.jiggle(0, 0, 0);
            } else {
              let jiggleX = wordList.getInt(0) * Globals.scriptScaleX;
              let jiggleY = wordList.getInt(0) * Globals.scriptScaleY;
              let jiggle_r = wordList.getInt(0);
              wordList.testWord("with");
              wordList.testWord("chance");
              let jiggleChance = wordList.getInt(50);
              sgSprite2.jiggle(jiggleX, jiggleY, jiggle_r, jiggleChance);
            }
          } else {
            Globals.log.error("Missing values at line " + action2.number);
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
          if (wordList.wordsLeft() > 0) {
            let sgSpriteName = wordList.getWord();
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, sgSpriteName);
            if (!sgSprite2) {
              break;
            }
            let flashCount = wordList.getInt(0, 1, 10);
            sgSprite2.flash(flashCount, now);
          } else {
            Globals.log.error("Missing values at line " + action2.number);
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
          if (wordList.wordsLeft() > 0) {
            let sgSpriteName = wordList.getWord();
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, sgSpriteName);
            if (!sgSprite2) {
              break;
            }
            let on_off = wordList.testWord(["at", "stop"]);
            if (on_off == "stop") {
              sgSprite2.blink(0, 0, now);
            } else {
              let blinkRate = wordList.getInt(0, 1, 10);
              wordList.testWord("per");
              wordList.testWord("second");
              wordList.testWord("with");
              wordList.testWord("chance");
              let blinkChance = wordList.getInt(100, 0, 100);
              sgSprite2.blink(blinkRate, blinkChance, now);
            }
          } else {
            Globals.log.error("Missing values at line " + action2.number);
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
          if (wordList.wordsLeft() > 0) {
            let sgSpriteName = wordList.getWord();
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, sgSpriteName);
            if (!sgSprite2) {
              break;
            }
            let on_off = wordList.testWord("stop");
            if (on_off == "stop") {
              sgSprite2.pulse(0, 0, 100, now);
            } else {
              wordList.testWord("at");
              let pulseRate = wordList.getInt(0, 1, 10);
              wordList.testWord("per");
              wordList.testWord("second");
              wordList.testWord("from");
              let pulseMin = wordList.getInt(0, 0, 100);
              wordList.testWord("to");
              let pulseMax = wordList.getInt(100, 0, 100);
              sgSprite2.pulse(pulseRate, pulseMin, pulseMax, now);
            }
          } else {
            Globals.log.error("Missing values at line " + action2.number);
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
          if (wordList.wordsLeft() > 0) {
            let sgSpriteName = wordList.getWord();
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, sgSpriteName);
            if (!sgSprite2) {
              break;
            }
            let fade_type = wordList.testWord(["to", "by", "up", "down"], "to");
            let value2 = wordList.getInt(100);
            let duration2 = wordList.getDuration(0);
            if (sgSprite2) {
              sgSprite2.setTransparency(value2, duration2, fade_type, now, makeCompletionCallback(actionGroup));
            }
          } else {
            Globals.log.error("Missing fade parameters");
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
          if (wordList.wordsLeft() > 0) {
            let sgSpriteName = wordList.getWord();
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName);
            if (!sgSprite2) {
              break;
            }
            let on_off = wordList.testWord(["to", "stop"]);
            if (on_off == "stop") {
              if (command == "wave") {
                sgSprite2.wave(0, 0, 0);
              } else {
                sgSprite2.sway(0, 0, 0);
              }
            } else {
              let waveMax = wordList.getInt(0, 1, 10);
              let waveRate = wordList.getDuration(1);
              wordList.testWord("with");
              wordList.testWord("chance");
              let waveChance = wordList.getInt(100, 0, 100);
              if (command == "wave") {
                sgSprite2.wave(waveMax, waveRate, waveChance);
              } else {
                sgSprite2.sway(waveMax, waveRate, waveChance);
              }
            }
          } else {
            Globals.log.error("Missing values at line " + action2.number);
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
          if (wordList.wordsLeft() > 0) {
            let spriteName2 = wordList.getWord();
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (!sgSprite2) {
              break;
            }
            let blur_type = wordList.testWord(["to", "by", "up", "down"], "to");
            let value2 = wordList.getInt(100);
            let duration2 = wordList.getDuration(0);
            if (sgSprite2) {
              sgSprite2.setBlur(value2, duration2, blur_type, now, makeCompletionCallback(actionGroup));
            }
          } else {
            Globals.log.error("Missing fade parameters");
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
          if (wordList.wordsLeft() > 0) {
            let spriteName2 = wordList.getWord();
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (!sgSprite2) {
              break;
            }
            wordList.testWord(["to", "by", "at"]);
            const value2 = wordList.getWord("red");
            sgSprite2.setTint(value2);
          } else {
            Globals.log.error("Missing tint colour");
          }
          break;
        case "darken":
        case "lighten":
          if (wordList.wordsLeft() > 0) {
            let spriteName2 = wordList.getWord();
            let sgSprite2 = SGSprite.getSprite(this.spriteScene, spriteName2);
            if (!sgSprite2) {
              break;
            }
            wordList.testWord(["to", "by", "at"]);
            let value2 = wordList.getInt(0, 0, 100);
            if (command == "lighten") {
              value2 = 100 - value2;
            }
            let duration2 = wordList.getDuration(0);
            sgSprite2.setTint(value2, duration2, now, makeCompletionCallback(actionGroup));
          } else {
            Globals.log.error("Missing " + command + " parameters");
          }
          break;
        /**************************************************************************************************
        
           ########  #######  ########     #### ##    ## 
           ##       ##     ## ##     ##     ##  ###   ## 
           ##       ##     ## ##     ##     ##  ####  ## 
           ######   ##     ## ########      ##  ## ## ## 
           ##       ##     ## ##   ##       ##  ##  #### 
           ##       ##     ## ##    ##      ##  ##   ### 
           ##        #######  ##     ##    #### ##    ## 
        
        **************************************************************************************************/
        case "for":
          if (wordList.wordsLeft() > 0) {
            let varName = wordList.getWord();
            let offset = 3;
            if (wordList.testWord("in")) {
              offset = 4;
            }
            this.varList.setValue(varName, wordList.getWord(defaults_default.NOTFOUND));
            const stackFrame2 = new StackFrame(STACK_FOR, actionIndex + 1, wordList.sliceWords(offset), varName);
            actionGroup.stack.push(stackFrame2);
          } else {
            Globals.log.error("Missing for loop");
          }
          break;
        case "next":
        case "endfor":
          {
            const stackSize = actionGroup.stack.length;
            if (stackSize < 1) {
              Globals.log.error("No for loop for next at " + action2.number);
              break;
            }
            const stackFrame2 = actionGroup.stack[stackSize - 1];
            if (stackFrame2.type != STACK_FOR) {
              Globals.log.error("For loop error at " + action2.number);
              break;
            }
            if (stackFrame2.counter++ > defaults_default.LOOP_MAXIMUM) {
              Globals.log.error("Looping exceeded at " + action2.number);
              actionGroup.stack.pop();
              break;
            }
            if (stackFrame2.forValues.length < 1) {
              actionGroup.stack.pop();
            } else {
              this.varList.setValue(stackFrame2.varName, stackFrame2.forValues.shift());
              actionGroup.nextAction = stackFrame2.jump_line;
            }
          }
          break;
        /**************************************************************************************************
        
           ########  ######## ########  ########    ###    ######## 
           ##     ## ##       ##     ## ##         ## ##      ##    
           ##     ## ##       ##     ## ##        ##   ##     ##    
           ########  ######   ########  ######   ##     ##    ##    
           ##   ##   ##       ##        ##       #########    ##    
           ##    ##  ##       ##        ##       ##     ##    ##    
           ##     ## ######## ##        ######## ##     ##    ##    
        
        **************************************************************************************************/
        case "repeat":
          const stackFrame = new StackFrame(STACK_REPEAT, actionIndex + 1);
          actionGroup.stack.push(stackFrame);
          break;
        case "until":
          {
            const stackSize = actionGroup.stack.length;
            if (stackSize < 1) {
              Globals.log.error("No repeat for until at " + action2.number);
              break;
            }
            const stackFrame2 = actionGroup.stack[stackSize - 1];
            if (stackFrame2.type != STACK_REPEAT) {
              Globals.log.error("Repeat loop error at " + action2.number);
              break;
            }
            if (stackFrame2.counter++ > defaults_default.LOOP_MAXIMUM) {
              Globals.log.error("Looping exceeded at " + action2.number);
              actionGroup.stack.pop();
              break;
            }
            const result = logical(wordList.sliceWords(1));
            if (result) {
              actionGroup.stack.pop();
            } else {
              actionGroup.nextAction = stackFrame2.jump_line;
            }
          }
          break;
        /**************************************************************************************************
        
           #### ######## 
            ##  ##       
            ##  ##       
            ##  ######   
            ##  ##       
            ##  ##       
           #### ##       
        
        **************************************************************************************************/
        case "if":
          if (wordList.wordsLeft() > 0) {
            if (actionGroup.failedIfCount > 0) {
              actionGroup.failedIfCount += 1;
            } else {
              const result = logical(wordList.sliceWords(1));
              if (!result) {
                actionGroup.failedIfCount += 1;
              }
            }
          } else {
            Globals.log.error("Missing if condition at line " + action2.number);
          }
          break;
        case "endif":
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
          let duration = wordList.getDuration(5);
          this.timers.push(new Timer(now, duration, makeCompletionCallback(actionGroup)));
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
          const type = wordList.getWord("scene");
          const arg = wordList.getWord();
          switch (type) {
            case "scenes":
            case "all":
              for (let i = 0; i < Globals.scenes.length; i++) {
                Globals.log.report(Globals.scenes[i].showSceneData());
              }
              break;
            case "scene":
              if (arg) {
                const listScene = _Scene.find(arg);
                if (listScene) {
                  Globals.log.report(listScene.showSceneData());
                }
              } else {
                Globals.log.report(this.showSceneData());
              }
              break;
            case "sprites":
              if (arg) {
                const listScene = _Scene.find(arg);
                if (listScene) {
                  Globals.log.report(listScene.listSprites());
                }
              } else {
                Globals.log.report(this.listSprites());
              }
              break;
            case "images":
              if (arg) {
                const listScene = _Scene.find(arg);
                if (listScene) {
                  Globals.log.report(listScene.listImages());
                }
              } else {
                Globals.log.report(this.listImages());
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
    static nextAction_run = 0;
    static next_spriteUpdate = 0;
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
    readFromText(text, include = false) {
      const script = text.split(/\r?\n/);
      const count = script.length;
      const top = new Scene2(MAIN_NAME);
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
        currentLine = currentLine.replace(/^[^a-zA-Z"\$]+/, "");
        let words = Parser.splitWords(currentLine.toLowerCase());
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
          if (include) {
            Globals.log.error("Directives in include will be ignored!");
            continue;
          }
          if (argument == "width") {
            let displayWidth = parseInt(argument2);
            if (displayWidth < 50 || displayWidth > 5e3) {
              Globals.log.error("silly display width");
              displayWidth = defaults_default.DISPLAY_WIDTH;
            }
            Globals.displayWidth = displayWidth;
          } else if (argument == "height") {
            let displayHeight = parseInt(argument2);
            if (displayHeight < 50 || displayHeight > 5e3) {
              Globals.log.error("silly display height");
              displayHeight = defaults_default.DISPLAY_HEIGHT;
            }
            Globals.displayHeight = displayHeight;
          }
        } else if (command == "script") {
          if (include) {
            Globals.log.error("Directives in include will be ignored!");
            continue;
          }
          if (argument == "width") {
            let scriptWidth = parseInt(argument2);
            if (scriptWidth < 50 || scriptWidth > 5e3) {
              Globals.log.error("silly script width");
              scriptWidth = defaults_default.DISPLAY_WIDTH;
            }
            Globals.scriptWidth = scriptWidth;
          } else if (argument == "height") {
            let scriptHeight = parseInt(argument2);
            if (scriptHeight < 50 || scriptHeight > 5e3) {
              Globals.log.error("silly script height");
              scriptHeight = defaults_default.DISPLAY_HEIGHT;
            }
            Globals.scriptHeight = scriptHeight;
          } else if (argument == "scale") {
            switch (argument2) {
              case "fit":
                Globals.scriptScaleType = SCALE_FIT;
                break;
              case "stretch":
                Globals.scriptScaleType = SCALE_STRETCH;
                break;
              case "none":
              default:
                Globals.scriptScaleType = SCALE_STRETCH;
                break;
            }
          }
        } else if (command == "gravity") {
          if (include) {
            Globals.log.error("Directives in include will be ignored!");
            continue;
          }
          let gravity = parseFloat(argument);
          if (gravity <= 0) {
            Globals.log.error("silly gravity setting");
            gravity = defaults_default.GRAVITY_PS2;
          }
          Globals.gravity_ps2 = gravity;
        } else if (command == "ground") {
          if (include) {
            Globals.log.error("Directives in include will be ignored!");
            continue;
          }
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
      if (include) {
        top.name = "_INCLUDE_";
        top.start();
        Globals.scenes.push(top);
      } else {
        if (top.content.length < 1) {
          Globals.log.error("No top level actions, nothing will happen!");
          return false;
        } else {
          switch (Globals.scriptScaleType) {
            case SCALE_STRETCH:
              Globals.scriptScaleX = Globals.displayWidth / Globals.scriptWidth;
              Globals.scriptScaleY = Globals.displayHeight / Globals.scriptHeight;
              break;
            case SCALE_FIT:
            // todo
            case SCALE_NONE:
            default:
              break;
          }
          top.start();
          top.interactive_index = top.actionGroups.length;
          top.actionGroups.push(new ActionGroup());
          Globals.scenes.push(top);
        }
      }
      return true;
    }
    async run() {
      this.clean = false;
      await Globals.app.init({
        // resizeTo: window,
        background: "#dfdfdf",
        width: Globals.displayWidth,
        height: Globals.displayHeight
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
      if (_SlowGlass.nextAction_run < current_millis) {
        if (Globals.app.screen.width != Globals.displayWidth) {
          Globals.app.screen.width = Globals.displayWidth;
        }
        if (Globals.app.screen.height != Globals.displayHeight) {
          Globals.app.screen.height = Globals.displayHeight;
        }
        for (let i = 0; i < Globals.scenes.length; i++) {
          let current = Globals.scenes[i];
          if (current.state != SCENE_RUNNING) {
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
        _SlowGlass.nextAction_run = current_millis + defaults_default.TRIGGER_RATE;
      }
      if (_SlowGlass.next_spriteUpdate < current_millis) {
        for (let i = 0; i < Globals.scenes.length; i++) {
          let current = Globals.scenes[i];
          if (current.state != SCENE_RUNNING) {
            continue;
          }
          for (let j = 0; j < current.sprites.length; j++) {
            current.sprites[j].update(current.name, current_millis);
          }
        }
        _SlowGlass.next_spriteUpdate = current_millis + defaults_default.SPRITE_RATE;
      }
    }
    async scriptFromURL(url, include = false) {
      if (include) {
        Globals.log.report("Including script from " + url);
      } else {
        Globals.log.report("Starting Slow Glass from " + url);
        this.cleanUp();
      }
      const response = await fetch(url);
      if (!response.ok) {
        Globals.log.error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
      const text = await response.text();
      if (this.readFromText(text, include)) {
        if (!include) {
          this.run();
        }
      }
    }
    interactiveAction(text) {
      const topScene = Scene2.find(MAIN_NAME);
      const interactiveGroup = topScene.actionGroups[topScene.interactive_index];
      interactiveGroup.actions = [];
      const lines = text.split(";");
      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i].trim();
        if (lineText.length < 1) {
          continue;
        }
        interactiveGroup.actions.push(new Line(i + 1, lineText));
      }
      interactiveGroup.nextAction = 0;
      do {
        topScene.runAction(interactiveGroup.nextAction, interactiveGroup, Date.now());
      } while (interactiveGroup.nextAction < interactiveGroup.actions.length);
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
