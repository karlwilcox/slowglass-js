/* Imports */
import { Scene } from "./scene.js";
import Defaults from "./defaults.js";
import { Globals } from "./globals.js";
import { AudioManager } from "./audio.js";

class SlowGlass {
    static next_action_run = 0;
    static next_sprite_update = 0;
    static sg_id = "body";

    constructor() {
    }

    async run() {
        // Initialise renderer (Pixi v8 requirement)
        await Globals.app.init({
            // resizeTo: window,
            background: "#dfdfdf",
            width: Globals.display_width,
            height: Globals.display_height,
        });

        // Add canvas to page
        document.onkeydown = function(e) {Globals.event("onkeydown", e.key);};
        document.onkeyup = function(e) {Globals.event("onkeyup", e.key);};
        pixi.appendChild(Globals.app.canvas);

        // Root container for scene
        Globals.root = new PIXI.Container();
        Globals.app.stage.addChild(Globals.root);

        // Main loop
        Globals.app.ticker.add(this.update);

        // Keep sprite centred when window resizes
        // window.addEventListener("resize", () => {
        // });
    }

    update(ticker) {
        // Action granularity is only 1 second, so only update every 0.5 seconds
        // (to ensure we catch triggers that are accurate to 1 second, e.g. "at"
        // Could adjust this if needed in defaults
        let current_millis = Date.now();
        if (SlowGlass.next_action_run < current_millis) {
            if (Globals.app.screen.width != Globals.display_width) {
                Globals.app.screen.width = Globals.display_width;
            }
            if (Globals.app.screen.height != Globals.display_height) {
                Globals.app.screen.height = Globals.display_height;
            }
            for ( let i = 0; i < Globals.scenes.length; i++ ) {
                let current = Globals.scenes[i];
                if (!current.enabled) {
                    continue;
                }
                // First let's see if any local timers have expired
                for (let j = 0; j < current.timers.length; j++ ) {
                    if (current.timers[j].expired(current_millis)) {
                        current.timers.splice(j,1);
                    }
                }
                // this implements the any/all condition. It is set by looking
                // at each trigger in turn. If the when condition is "any"
                // we immediately break out of the loop and run actions
                // If when is "all" we break out of the loop as soon as a
                // trigger fails. Hence the only way to get out of the loop
                // with do_run set to true is for all the tirggers to succeed
                // Found an active scene, now go through each action group
                for ( let j = 0; j < current.actionGroups.length; j++ ) {
                    let do_run = false;
                    // check each trigger, if ANY is valid then execute actions
                    let triggers = current.actionGroups[j].triggers;
                    for ( let k = 0; k < triggers.length; k++) {
                        if (triggers[k].fired(current_millis)) {
                            // console.log("Firing on " + triggers[k].constructor.name);
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
                        current.run_actions(j, current_millis);
                    }
                }
            }
            SlowGlass.next_action_run = current_millis + Defaults.TRIGGER_RATE;
        }
        // But sprites can be updated up to every frame if we want...
        if (SlowGlass.next_sprite_update < current_millis) {
            for ( let i = 0; i < Globals.scenes.length; i++ ) {
                let current = Globals.scenes[i];
                if (!current.enabled) {
                    continue;
                }
                // Found an active scene, now go through each sprite
                for ( let j = 0; j < current.sprites.length; j++ ) {
                    current.sprites[j].update(current.name, current_millis);
                }
            }
            SlowGlass.next_sprite_update = current_millis + Defaults.SPRITE_RATE;
        }
    }

    async scriptFromURL(url) {
        Globals.log.debug("Starting Slow Glass from " + window.sg_filename );
        this.cleanUp();
        const response = await fetch(url);
        if (!response.ok) {
            Globals.log.error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        Scene.readFromText(text);
        run();
    }

    cleanUp() {
        // tidy up previous run
        const pixi = document.getElementById(SlowGlass.sg_id);
        AudioManager.deleteAll();
        if (Globals.app != null) {
            Globals.app.destroy(
                { removeView: true },    // removes the canvas element from the DOM
                {
                    children: true,        // destroy all children in the stage
                    texture: true,         // destroy textures used by children
                    textureSource: true,   // destroy the underlying GPU texture sources
                },
            );
        }
        Globals.reset();
        if (pixi.hasChildNodes()) {
            pixi.removeChild(pixi.firstChild);
        }
        Globals.app = new PIXI.Application();
    }

    scriptFromText(text) {
        Globals.log.debug("Starting Slow Glass from textarea");
        // tidy up previous run
        this.cleanUp();
        Scene.readFromText(text);
        this.run();
    }
}

window.slowGlass = new SlowGlass();
