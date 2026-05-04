---
title               : "Slow Glass Directives"
---

Directives are instructions that affect the operation of Slow Glass as a whole, or help
structure the script into parts that can be re-used.

The following directives are supported:

## display width / height

`display width {integer}`

`dipslay height {integer}`

`display fullscreen (*)`

Sets the width and height of the HTML Canvas object that the animation will be drawn on.

The current display size can be accessed through the variables $WIDTH and $HEIGHT

(*) Not implemented yet

## script width / height

`script width {integer}`

`script height {integer}`

`script scale (fit | stretch | none) (*)`

This is optional, but if your script has assumed a particular size for the drawing
area you can specify this here. You can also choose how the script coordinates are mapped
on to the actual drawing area. The options are:

- stretch - the x and y coordinates are indenpendently scaled so the script fills the drawing area
- fit - the coordinates are uniformly scaled so that the script fits into the drawing area, possibly leaving unused areas at the side or bottom depending on the aspect ratio
- none - (the default) just use the script coordinates unchanged (i.e. if the script assumes a smaller area, it will  just be drawn in the top left)

(*) "fit" not yet implemented, other options may be added also

## gravity / ground

`gravity {integer}`

`ground [level] {integer}`

These settings determine the behaviour of objects that are subject to the
actions "throw", "launch" or "drop". 'gravity' sets the acceleration due to
gravity, in pixels per second per second (the default is 100). Hence a sprite
that is dropped from the top of the screen will start at rest but be travelling
at 100 pixels per second after one second, 200 pixels per second after 2
seconds and so on.

Sprites under the influence of gravity are assumed to be "out of bounds" if any
coordinate exceeds twice the actual display size. Hence if a sprite goes
slightly out of frame at the top it may well come back into view, but a fast
moving sprite may go out of bounds and stop being updated.

Additionaly, sprites under the influence of gravity will also stop moving if
they reach "ground level". Remember that the 'y' coordinate grows downwards so
ground level cannot be assumed to be 0. You can set the actual level at which a
sprite will stop "falling" with the ground level directive.

Note that if you are using script scaling, both gravity and ground level will
be assumed to be given in script coordinates and will be scaled appropriately
for the actual display.

## end file

`end file`

This is just a convenience directive that causes Slow Glass to ignore
everything in the file beyond this point, even if it is valid script.

You can use this feature to include free text content after your script,
although there are more flexible commenting systems available (see below).

## scene / end scene

`scene {name}`

`end scene`

These directives are used to split your script into smaller, reusable parts. A
scene is introduced with the "scene" directive, which must be followed by a
single word which is used as the name of the scene. You can end a scene with
the "end scene" directive, or (since scenes cannot be nested) you can just
start a new scene.

Scenes are **NOT** started automatically, they must be started using the
"start" action.

Note that any triggers and actions that are **NOT** in a named scene are
considered to be in the "top level" scene, which is given the name "\_MAIN\_".
There _must_ be at least one trigger and one action in the top level scene
otherwise nothing will happen! Typically you will have several named scenes
which are started and stopped by actions in the top level scene.

## Documentation

Documentation is always a good thing! Slow Glass gives you a lot of flexibility
in documenting your code. In addition to the different commenting styles
discussed below you can include a longer section of descriptive text anywhere
in your script file, introduced by the directive:

`description`

All content lines after this directive will be completely ignored by the command
processor, until it finds the corresponding directive:

`end description`

You can have as many description sections as you like, of any length, although
putting one at the top of each file might be useful!

## Comments

Comments aren't really directives as such but discussion of them seems to fit best
here as they are also a means of structuring your scripts

### Ignored lines

Lines begining with '#' (hash, or octothorpe) are completely ignored. You can
have whitespace in front the hash but no other content, hence in the action:

`text greeting colour #00ff00`

The hash does **NOT** introduce a comment and will be treated as normal text.

Blank lines are ignored.

Finally, lines that do not contain any alphabetic characters are also ignored.
This means that you can break up your file with lines such as:

`======================================`

Without having to explicitly put them into comments.

### Programmer's style comments

To add documentation to your code you can use two variations of programmer
style comments.

Any content on a line after two slash characters will be ignored:

`start my-scene // this is ignored`

Also, anything enclosed between /\* and \*/ will be ignored, even if it
spans over multiple lines.

```
/*******
This content will be ignored
********/
```
