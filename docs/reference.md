---
layout: page
sidebar: slow-glass
title               : "Slow Glass Animation System"
subtitle         : ""
teaser              : ""
header:
   image_fullwidth  : "headers/slow-glass.jpg"
---


# Format

New lines are significant, each item must be on a separate line but initial whitespace is ignored.

Comment lines start with hash or are enclosed by /* */. 

# Directives

* scene &lt;name&gt; - starts a new scene (and ends previous one)
* end scene - ends current scene
* finish - stop processing commands (everything else ignored)
* end file - same as above
* include &lt;file&gt; - read file as if inserted at this point
* display height/width &lt;value&gt; - sets window dimensions
* display fullscreen - full screen window

# Triggers

* begin - runs on scene load (or file load if at top level)
* after &lt;duration&gt; - runs after duration has elapsed from scene start
* on key &lt;key&gt; -runs when key is pressed
* on click - runs when any mouse key is pressed
* at time &lt;timecode&gt; - runs when time of day matches the timecode
* each time &lt;timecode&gt; - runs when time of day matches timecode (including wild cards)
* every &lt;duration&gt; - runs after duration has elapsed from scene start and repeats
* when (expression) - Evaluated once per second, runs once when the Python expression becomes truthy
* while (expression) - Evaluated once per second, runs every time the Python expression is truthy

# Commands

In most cases unnecessary words can be omitted, the minimum phrasing is shown in bold

## Resource Management

* **from** &lt;folder&gt; - take all resources from the named folder
* **load** &lt;file&gt; named &lt;r-tag&gt; \[split &lt;cols&gt; by &lt;rows&gt;\] - load resource of any type
* **unload** &lt;r-tag...&gt; - remove resources from memory

## Scene Management

* **start** &lt;scene&gt; - start scene operating
* **stop** \[&lt;scene&gt;\] - stop current scene or named scene (removes all images)
 
## Sprite Placement

* **place** &lt;r-tag&gt; \[named &lt;s-tag&gt;\] **at** &lt;x&gt;,&lt;y&gt; depth &lt;z&gt; \[size|scale &lt;w&gt;,&lt;h&gt;\] - place an image on to the screen
* **put** &lt;r-tag&gt; \[named &lt;s-tag&gt;\] **as** background|top|bottom|left|right|ground|sky \[depth &lt;z&gt;\] - place an image on to the screen in a fixed location
* **raise/lower** &lt;s-tag&gt; **to** &lt;value&gt; - set depth of image on screen to value
* **raise/lower** &lt;s-tag&gt; **by** &lt;value&gt; - change depth of image on screen up or down the set of images
* **show/hide** &lt;s-tag&gt; - reveal or remove images from screens, but still update changes
* **show/hide** &lt;s-tag&gt; for &lt;duration&gt;- reveal or remove images from screens just for a set length of time
* **remove** &lt;s-tag...&gt; - remove images from the screen

## Animated Sprite Management

* **window** &lt;s-tag&gt; at &lt;ix&gt;,&lt;iy&gt;,&lt;iw&gt;,&lt;ih&gt; - define a window on the source image centered at ix,iy of size iw,ih
* **zoom window** &lt;s-tag&gt; to &lt;iw&gt;,&lt;ih&gt; \[in &lt;duration&gt;\]- set new window size on source image
* **move window** of &lt;s-tag&gt; to &lt;ix&gt;,&lt;iy&gt; \[in &lt;duration&gt;\]- set new window centre on source image
* **scroll window** of &lt;s-tag&gt; up|down|left|right \[at &lt;speed&gt;\] - move window centre continuously at speed pixels per minute
* set **animation** rate of &lt;s-tag&gt; to &lt;value&gt; - if image is sprite, update the frame every &lt;value&gt; seconds
* **advance** &lt;s-tag&gt; **to** &lt;number&gt; - switch sprite to the given frame (set rate to zero to use)
* **advance/reverse** &lt;s-tag&gt; **by** &lt;number&gt; - advance or reverse sprite by the given number of frames

(Movie image sources can only advance)

## Sprite Movement

* **move** &lt;s-tag&gt; to &lt;x&gt;,&lt;y&gt; \[in &lt;duration&gt;\] - Move image to a new location on screen in a given time
* **move** &lt;s-tag&gt; to &lt;x&gt;,&lt;y&gt; \[at &lt;speed&gt;\] - Move image to a new location on screen at a given speed
* **move** &lt;s-tag&gt; **by** &lt;x&gt;,&lt;y&gt; \[in &lt;duration&gt;\] - Move image relative to current position a given time
* **move** &lt;s-tag&gt; **by** &lt;x&gt;,&lt;y&gt; \[at &lt;speed&gt;\] - Move image relative to current position at a given speed
* set **speed** of &lt;s-tag&gt; to &lt;speed&gt; \[in &lt;duration&gt;\] - set the speed of image (acclerate/slow if duration given)
* **rotate** &lt;s-tag&gt; **to** &lt;value&gt; - turn image on screen to the given angle (degrees clockwise, 0 at top)
* **rotate** &lt;s-tag&gt; **by** &lt;value&gt; - turn image on screen by given angle (degrees clockwise)
* **pause/resume** &lt;s-tag&gt; - pause or resume all current changes to an image (does not change visibility)

## Sprite Sizing

* **resize** &lt;s-tag&gt; **to** &lt;w&gt;,&lt;h&gt; \[in &lt;duration&gt;\] - change size of image on screen to given dimensions
* **scale** &lt;s-tag&gt; **to** &lt;x%&gt;,&lt;y%&gt; \[in &lt;duration&gt;\] - change size of image on screen by given proportions of the original image size
* **scale** &lt;s-tag&gt; **by** &lt;x%&gt;,&lt;y%&gt; \[in &lt;duration&gt;\] - change size of image on screen by given proportions of the current image size

## Sprite Appearance

* set **transparency** of &lt;s-tag&gt; to &lt;value&gt; \[in &lt;duration&gt;\] - set image transparency (0 = solid, 100 = transparent)
* **darken** &lt;s-tag&gt; to &lt;value&gt; \[in &lt;duration&gt;\] - make image darker (0 = no change, 100 = solid black)
* **lighten** &lt;s-tag&gt; to &lt;value&gt; \[in &lt;duration&gt;\] - make image lighter (0 = no change, 100 = solid white)
* **blur** &lt;s-tag&gt; to &lt;value&gt; \[in &lt;duration&gt;\] - make blurry (0 = unchanged, 100 = very blurry)

## Text Commands

* **create text** &lt;t-name:&gt; - create a named text item
* **set content** of &lt;t-name&gt; to text.... - sets the text to display
* **set style** of &lt;t-name&gt; to bold | italic | underline - sets text style
* **set color** of &lt;t-name&gt; to \[named web color\] - sets text foreground color
* **set background** of &lt;t-name&gt; to \[named web color\] - sets text background color
* **set size** of &lt;t-name&gt; to number - sets the point size of the text

Once created a text item be used as a source image for a sprite to which all the comands above can be applied.

## Sounds

* **play** &lt;r-tag&gt; - play a sound resource
* set **volume** of &lt;r-tag&gt; to &lt;value&gt; - set volume of sound resource (0-100)

## Group Management

* **create group** &lt;name&gt; - create a named group of sprites.
* **add to group** &lt;name&gt; &lt;s-tags...&gt; - add named sprites to the group (removes them from scene)


The named group can now be used as an image source for sprites, e.g. "place named-group at x,y,z" and all sprite commands 
operate on the whole image, however individual sprites within the group can still be operated on by name.

## System Commands

* **log** &lt;args...&gt; - write arguments to the console
* **let** &lt;var&gt; be (expression) - set the value of a variable
* **exit** - ends program

# Conditionals

Any command may be prefixed with a conditional, of the form:

```
if (expression) command...
```

Depending on system configuration, expression can be any valid python code, or a limited arithmetic expression. In 
either case the command is executed if the expression evaluates to a truthy value. Slow-glass variables are
expanded each time the expression is evaluated.

# Variables

All variables start with $. Unset variables evaluate to "???". 

Variables are local to scenes, to access variables in other scenes use $&lt;scene-name&gt;:variable.

Create / update variables with the make command, e.g.

```
make COUNT be 1
make COUNT be ($COUNT + 1)
```

Variables in commands are evaluated every time the command is invoked, variables in triggers are expanded when the
trigger is created (i.e. when the scene is started).

## Built-in Variables

* $SECOND - current second (0 - 59)
* $MINUTE - current minute (0 - 59)
* $HOUR - current hour (0 - 23)
* $DAY - day of month (1-31)
* $DAYNAME - name of day as a string
* $MONTH - month of year (1-12)
* $MONTHNAME - name of the month as a string
* $YEAR - year as a 4 digit number
* $SEASON - season as lower case string (needs $HEMISPHERE set correctly)
* $WIDTH - width of the display in pixels
* $HEIGHT - height of the display in pixels
* $FRAMERATE - update rate of display (for Pygame, not the physical device)
* $CENTREX, CENTREY - x, y coordinates of the centre of the display
* $MOUSEX, $MOUSEY - current x & y coordinates of mouse
* $PERCENT - random value from 0 to 100, set on use
* $CHANCE - random value from 0.0 to 1.0, set on use
* $RANDOMX, $RANDOMY - random values somewhere within the current window 
* $KEY - key currently being pressed (None if none pressed)
* $LASTKEY - last key that was pressed
* $CLICKX, $CLICKY - x & y coordinates of the last time the mouse was clicked

## Sprite properties

Some sprite properties are available as variables, using the sprite tag as the variable name, followed
by a '.' and one of the following:

* x - current x coordinate
* y - current y coordinate
* w - current width
* h - current height
* s - current speed (pixels per second)




