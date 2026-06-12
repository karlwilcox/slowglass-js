---
title               : "Slow Glass Animation System"
---


## Format

New lines are significant, each item must be on a separate line but initial whitespace is ignored. Long lines
can be split by ending them with '\\' and will be treated as a single line.

Lines starting with a # are ignored, as is all content from // to the
end of the line and any content between /\* and \*/.

## Directives

* **scene** {scene-name}
* **end scene** - ends current scene
* **finish** - stop processing commands (everything else ignored)
* **end file** - same as above
* **include** {file} - read file as if inserted at this point (TO BE DONE)
* **(canvas | stage | display) height/width** {value} - sets window dimensions
* **(canvas | stage | display) size** {width} {height} - sets window dimensions
* **display fullscreen** - full screen window (TBD)
* **scale** (fit \| stretch \| none) - how to adapt script scale to display
* **gravity** {integer} - force of gravity in pixels per second
* **ground** {integer} - y coordinate of ground level
* **script width** {integer} - assumed width for this script
* **script height** {integer} - assumed height for this script
* **script size {integer} {integer} - assumed size for this script

## Triggers

* **begin** - runs on scene load (or file load if at top level)
* **after** {duration} - runs after duration has elapsed from scene start
* **on key** {key} -runs when key is pressed (TBD)
* **on click** {sprite-name} - runs when named sprite receives a left click
* **at** time {timecode} - runs when time of day matches the timecode
* **atend** - runs when the scene is finished, just prior to deletion
* **each** time {timecode} - runs when time of day matches timecode (including wild cards)
* **every** {duration} - runs after duration has elapsed from scene start and repeats
* **when** (expression) - Evaluated once per second, runs once when the Python expression becomes truthy
* **while** (expression) - Evaluated once per second, runs every time the Python expression is truthy

## Commands

In most cases unnecessary words can be omitted, the minimum phrasing is shown in bold

## System Commands

* **(log \| print)** {text...} - write text to console (or page element)
* **echo** (on \| off \| flip) - log expanded and evaluated commands prior to executing them
* **finish** - stop application
* **list** (scenes \| all) - basic information on all scenes to console
* **list** (scene \| sprites \| images \| actions) \[{scene-name}\] - detailed information to console
* **debug** {integer} {text...} - if a top level variable called DEBUGLEVEL exists and is lower than the number given print the text to console

## Resource Management

* **from** {folder} - take all resources from the named folder
* **reset from** - set folder name to blank
* **(load \| upload)** {file} named {resource-name} \[split {cols} by {rows}\] - load resource of any type
* **unload** {resource-name...} - remove resources from memory

## Scene Management

* **prepare** \[scene\] {scene-name} \[named as {active-name}\] - load scene into memory, do setup actions
* **run** \[scene\] {active-name} \[with parameters {parameters...}\] - start scene executing
* **start** \[scene\] {scene-name} \[named as {active-name}\] \[with paramters\] \[{parameters...}\] - prepare and run scene, pass information
* **stop** \[{active-name}\] - stop current scene or named scene (removes all images)
* **reset scene** \[{active-name}\] - put scene back into the original state

## Sprite Management

* **reset sprite** {sprite-name} - set all sprite aspects back to their original state
* **sprite create** \[named {sprite-name}\] \[in {group-name}\] load from {url} - creates a sprite directly from an image
* **sprite create** \[named {sprite-name}\] \[in {group-name}\] from {resource-name} \[view {x} {y} {w} {h}\] - creates a sprite, needs to be placed
* **replace** {sprite-name} \[with\] {resource-name} - change the sprite image leaving all other aspects unchanged
* **with** {scene-name} - sprite names without a prefix assumed to in the named scene
* **reset with** - sprite names without a prefix assumed to be in the current scene (the default behaviour)

## Sprite Placement

* **place** {sprite-name} \[(hidden | transparent)\] at {x},{y} \[depth {z}\] \[size\|scale\] \[{w},{h}\] - place an image on to the screen
* **put** {resource-name} as (background \| backdrop \| top \| bottom \| left \| right \| ground \| sky \| foreground \| frame) \[at\] \[depth {z}\] - place an image on to the screen in a fixed location
* **raise/lower** {sprite-name} **to** {value} - set depth of image on screen to value
* **raise/lower** {sprite-name} **by** {value} - change depth of image on screen up or down the set of images
* **show/hide** {sprite-name} - reveal or remove images from screens, but still update changes
* **show/hide** {sprite-name} for {duration}- reveal or remove images from screens just for a set length of time (TBD)
* **remove** {sprite-name...} - remove images from the screen

## Animated Sprite Management (all TBD except where noted)

 **window** {sprite-name} at {ix},{iy},{iw},{ih} - define a window on the source image centered at ix,iy of size iw,ih
 **zoom window** {sprite-name} to {iw},{ih} \[in {duration}\]- set new window size on source image
 **move window** of {sprite-name} to {ix},{iy} \[in {duration}\]- set new window centre on source image
 **scroll window** of {sprite-name} up\|down\|left\|right \[at {speed}\] - move window centre continuously at speed pixels per minute
 **scroll** {sprite-name} \[at\] {x} {y} - move window continuously at  x / y pixels per minute DONE
 set **animation** rate of {sprite-name} to {value} - if image is sprite, update the frame every {value} seconds
 **advance** {sprite-name} **to** {number} - switch sprite to the given frame (set rate to zero to use)
 **advance/reverse** {sprite-name} **by** {number} - advance or reverse sprite by the given number of frames

(Movie image sources can only advance)

## Sprite Movement

* **move** {sprite-name} to {x},{y} \[in {duration}\] - Move sprite to a new location on screen in a given time
* **move** {sprite-name} (horizontally \| vertically) to {delta} \[in {duration}\] - Move sprite along an axis in a given time
* **move** {sprite-name} (horizontally \| vertically) **by** {delta} \[in {duration}\] - Move sprite along an axis in a given time
* **move** {sprite-name} to {x},{y} \[at {speed}\] - Move sprite to a new location on screen at a given speed
* **move** {sprite-name} **by** {x},{y} \[in {duration}\] - Move sprite relative to current position a given time
* **move** {sprite-name} **by** {x},{y} \[at {speed}\] - Move sprite relative to current position at a given speed
* **move** {sprite-name} **at** {x},{y} - Move sprite at a given speed
* set **speed** of {sprite-name} to {speed} \[in {duration}\] - set the speed of sprite (acclerate/slow if duration given) TBD
* **rotate** {sprite-name} **to** {value} - turn sprite on screen to the given angle (degrees clockwise, 0 at top)
* **rotate** {sprite-name} **by** {value} - turn sprite on screen by given angle (degrees clockwise)
* **pause/resume** {sprite-name} - pause or resume all current changes to an sprite (does not change visibility)
* **throw** {sprite-name} at {angle} \[with speed\] {speed} - throw the sprite in the given direction with the given speed
* **throw** {sprite-name} stop - stop thrown motion
* **drop** {sprite-name} - convenience function, same as throw {sprite} at 180, 0
* **align** {sprite-name} (top \| bottom \| left \| right) to {location} - move edge of sprite to the location, x or y

## Sprite Sizing

* **resize** {sprite-name} **to** {w},{h} \[in {duration}\] - change size of sprite on screen to given dimensions
* **scale** {sprite-name} **to** {x%},{y%} \[in {duration}\] - change size of sprite on screen by given proportions of the original sprite size
* **scale** {sprite-name} **by** {x%},{y%} \[in {duration}\] - change size of sprite on screen by given proportions of the current sprite size
* **flip** {sprite-name} (horizontally \| vertically) - flips sprite around given axis without changing position

## Sprite Appearance

* **fade** {sprite-name} (to \| by \| up \| down) {value} \[in {duration}\] - set sprite transparency (0 = solid, 100 = transparent)
* **darken** {sprite-name} to {value} \[in {duration}\] - make sprite darker (0 = no change, 100 = solid black)
* **lighten** {sprite-name} to {value} \[in {duration}\] - make sprite lighter (0 = no change, 100 = solid white) (TBD)
* **blur** {sprite-name} (to \| by \| up \| down) {value} \[in {duration}\] - make blurry (0 = unchanged, 100 = very blurry)
* **tint** {sprite-name} to {colour} - tint with named colour or hex code

## Sprite Effects

* **flicker** {sprite-name} **by** {amount} \[with chance {percentage}\] - randomly adjust transparency
* **flicker** {sprite-name} **stop**
* **jiggle** {sprite-name} **by** {x-amount} {y-amount} \[with chance {percentage}\] - randomly adjust position
* **jiggle** {sprite-name} **stop**
* **flash** {sprite-name} {number-of-times} - show for 1/10 second (hidden when finished)
* **blink** {sprite-name} **at** {rate} per second \[with chance {percentage}\] - on/off at given rate
* **blink** {sprite-name} **stop**
* **pulse** {sprite-name} **at** {rate} per second from {min-value} to {max-value} - fade up and down
* **pulse** {sprite-name} **stop**
* **wave** {sprite-name} **to** {wave-max} in {duration} \[with chance {percentage}\] - random skew in height
* **wave** {sprite-name} **stop**
* **sway** {sprite-name} to {sway-max} in {duration} \[with chance {percentage}\] - random skew in width
* **sway** {sprite-name} **stop**

## Text Commands

* **text create** {text-name} \[in {group-name}\] {text...} - create a named text item
* **text font** {font-name} - sets font face (no checking)
* **text size** {integer} - sets font size (no checking)
* **text align** (left \| centre \| right) - sets font alignment
* **text wrap** {integer} - wrap text at this point, 0 to disable
* **text colour** {colour} - sets fill and stroke to named colour or hex code
* **text fill** {colour} - sets fill to named colour or hex code
* **text stroke** {colour} - sets stroke to named colour or hex code

Once created a text item is like a sprite and must be placed to become visible. Colour, font
and other aspects of appearance can be changed after the text item has been created.

## Graphic Commands

* **graphic create** {graphic-name} \[in {group-name}\] as (rect \| rectangle) {width} {height} \[{corner-radius}\]
* **graphic create** {graphic-name} \[in {group-name}\] as circle {radius}
* **graphic create** {graphic-name} \[in {group-name}\] as line {height} (rotate as required)
* **graphic create** {graphic-name} \[in {group-name}\] as star {num-points} {outer-radius} \[{inner-radius}\]
* **graphic create** {graphic-name} \[in {group-name}\] as ellipse {x-radius} {y-radius} (rotate as required)
* **graphic create** {graphic-name} \[in {group-name}\] as bubble {height} {width} {radius} {pointers...}
* **graphic create** {graphic-name} \[in {group-name}\] as grid {x-size} {y-size} (covers whole display)
* **graphic stroke** {graphic-name} {colour} - sets fill to named colour or hex code
* **graphic fill** {graphic-name} {colour} - sets fill to named colour or hex code
* **graphic stroke** {graphic-name} {colour} - sets stroke to named colour or hex code
* **graphic stroke width** {graphic-name} {integer} - sets stroke width

The word 'shape' can be used instead of 'graphic'.

## Sounds

* **play** {resource-name} \[fade in\] \[{duration}\] \[at volume\] {level} - play a sound resource
* set **volume** of {resource-name} to {level} \[in {duration}\] - set volume of sound resource (0-100)

## Group Management

* **group create** {group-name} \[size {width} {height}\] - create a named empty group, needs to be placed
* **group add** {sprite-name} to {group-name} - add named sprites to the group (removes them from scene)

## Flow Control

* **pause** {duration} - do nothing for given time (safe to use, not busy wait)
* **wait (until | while)** {condition} - suspend execution until condition is true/false
* **for** {variable-name} **in** {values...}
* **for** {variable-name} **range** {N..M}
* **(endfor \| next)** - assign each value to variable in turn
* **repeat**
* **until** {logical-expression} - run actions until expression is false
* **if** {logical-expression}
* **endif** - run actions if the expression is true

## Logical Expressions

* **(false \| no \| n \| none \| 0 \| 0.0)** - are all false, everything else is true
* **{value1} (is \| equals \| = \| ==) {value2}** - Javascript equality test
* **{value1} (not \| != \| !==) {value2}** - Javascript inequality test
* **{value1} (> \| \< \| >= \| \<=) {value2}** - Javascript comparison

## Mathematical Expressions

Anything in round brackets is assumed to be a mathemtical expression and on use will be
replaced by its evaluated result. _*Before*_ evaluation all variables will be expanded
to their values.

All the standard operator symbols are supported,
including ! and ^ for factorial and power. Brackets can be nested to any depth.
'Pi' and 'e' are replace by their respective values. The following functions are
supported:

* sin cos tan asin acos atan sinh cosh tanh asinh acosh atanh - trigonmetric, angles in degrees
* Mod log ln - modulus & logarithms (note capitals)

## Variable Creation

* **(let \| make)** {variable-name} be {value} - set the variable to the given value
* **assign** {variable-names...} **as** {values...} - set multiple variables at once
* **choose** {variable-name} from {values...} - randomly assign one of the values
* **match** {variable-name} **to** {search-string} \[at (start \| end)\] **from** {values...} - set variable to all the values that match
* **make** {variable-name} from** - assign array key / values from following lines
* **enddata** - end of array assignment
* **increment** {variable-name} - if it looks like a number
* **deccrement** {variable-name} - if it looks like a number

All variables start with $, use braces '{}' to isolate variable names within strings
or if the variable name contains a '.' character. Unset variables evaluate to "NONE".

Variables are local to scenes, to access variables in other scenes use
${scene-name:variable-name}. Variables in the scene named 'data' are also
global.

Variables in commands are evaluated every time the command is invoked, variables in triggers are expanded when the
trigger is tested. Variables can **NOT** be used in stage directions

## Built-in Variables

* $SECONDS - current second (0 - 59)
* $MINUTES - current minute (0 - 59)
* $HOURS - current hour (0 - 23)
* $ELAPSED - no. seconds since script started
* $MILLIS - millseconds since script started (probably unique)
* $DAY - day of month (1-31) (TBD)
* $DAYNAME - name of day as a string
* $DAYOFWEEK - Sunday = 1, Monday = 2 etc.
* $WEEKDAY - yes/no
* $WEEKEND - yes/no
* $MORNING - yes/no
* $AFTERNOON - yes/no
* $EVENING - yes/no
* $NIGHT - yes/no
* $MONTH - month of year (1-12)
* $MONTHNAME - name of the month as a string
* $YEAR - year as a 4 digit number
* $SEASON - season as lower case string (needs $HEMISPHERE set correctly)
* $WINTER - yes/no
* $SPRING - yes/no
* $SUMMER - yes/no
* $AUTUMN - yes/no
* $WIDTH - width of the display in pixels
* $HEIGHT - height of the display in pixels
* $SCALEX, $SCALEY - Script scaling factors
* $CENTREX, CENTREY - x, y coordinates of the centre of the display
* $MOUSEX, $MOUSEY - current x & y coordinates of mouse TBD
* $PERCENT - random value from 0 to 100, set on use
* $CHANCE - random value from 0.0 to 1.0, set on use
* $RANDOMX, $RANDOMY - random values somewhere within the current window
* $KEY - key currently being pressed (None if none pressed)
* $LASTKEY - last key that was pressed
* $SCENENAME - name of the current scene
* $PARAMETERS - values passed to this scene on start
* ${scene-name:SPRITES} - list of all sprite names in named scene
* $SPRITES - list of all sprites in current scene
* $IMAGES - as above for images
* $SCENES - list of all scene names
* $VARIABLES - list of all variables in the current scene ONLY
* $UNIQUE - incrementing number guaranteed to be unique in this run
* $FRAME - 1 based count of frames rendered so far

## Sprite properties

Some sprite properties are available as variables, using the sprite tag as the variable name, followed
by a '.' and one of the following:

* loc.x, x - current x coordinate
* loc.y, y- current y coordinate
* size.x, sx - current width
* size.y,  sy - current height
* s - current speed (pixels per second) TBD
* click.x, cx - coordinate of last click on this sprite
* click.y, cy - coordinate of last click on this sprite
* depth, z - current depth
* angle - current rotation
* visible - true/false visibity
* role - if used in a put command, the name of the location
* frame - current frame number, 0 if not animated
* bounds - for debugging
