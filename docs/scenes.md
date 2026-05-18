---
title               : "Slow Glass Animation System"
---


It is possible to group script actions into named “scenes”. Actions within the
scene will only be carried out when the scene is started by another action
(except for the main scene, which will be started automatically).

## Creating Scenes

To create a new scene add the following to your script, on a new line:

`scene <name>`

This can be followed by any number of triggers, conditions and a actions that
will form part of the scene.

To end a scene, just start a new one, or put on a line on its own:

`end scene`

Any triggers and actions that are not within a named scene will be part of the “main”
scene.

### Approaches to Scenes

A simple script can ignore scenes and just contain the options, triggers and
actions that you need. A scene called "main" will be created automatically and
enabled for running.

If you want to re-use parts of a script, or just organise a larger script into
parts then you are free to use as many scenes as you like. You can still
leave "top level" actions outside any scene and they will automatically be
placed into the "main" scene.

Finally you can group everything into scenes, using as many as you like just
be sure to have one scene called "main". It can be anywhere in the script and
will be enabled and run automatically.

## Running Scenes

### Simple Startup

When the script is first read in by the program the scenes (apart from the
main one) are just stored away, ready to be "acted out". You can start
this process following either of two methods. Firstly, and most simply
you can just use the start command:

`start \[scene\] {scene-name} \[named {active-name}\]`

It is important here to understand the difference a "scene" (a reusable
part of the script) and an "active scene" (a scene currently running).

You can start a script as many times as you like as long as every scene
that is currently active has a different "active-name". For example
you can append the $UNIQUE built-in variable to ensure this:

`start scene my_scene named my_scene-$UNIQUE`

If you are only going to use a scene once you leave out providing the active
name and the scene name will be used as the active name.

You can also provide information to an active scene by providing paramters
to the start command. Parameters can be as much text as you want, it is made
available to the active scene through the $PARAMETERS built-in variable.
Typically you can use this with the **assign** command to set variables
for use in the scene.

`start \[scene\] {scene-name} named {active-name\] \[with parameters\] {parameters...}` 

As soon as the scene is started the **init** triggered will be activated
(if present), immmediately followed by any **begin** triggers (again,
if present).

### Flexible Startup

If you need more flexibility that a simple start up and parameter passing
you can use a two stage process to run a scene:

`load scene {scene-name} \[named {active-name}\]`

This will load the scene into memory but the _*ONLY*_ trigger that will
be activated is **init** (alternatively named **setup**). This for
example can be used to load image and other resources.

At this point you can set the value of any scene variables that you
want, using a command like:

`make {active-name}:{variable-name} be {value}`

And then when you are ready you can start the active scene running
with:

`run [scene] {active-name}`

This will start the scene and also activate any **begin** triggers.
You can also use parameters as with the **start** command above.

## Stopping Scenes

Scenes can be stopped with the corresponding command:

`stop church-bells`

Or alternatively a scene can stop itself with actions such as:

`after 30 seconds`
`    stop scene`

If there are other actions needed at the end of the scene make sure that they
are placed _*before*_ the stop command, otherwise they will never be executed.

There is a trigger **atend** which will be activated when the scene is stopped.
This can be used to do any clean up or other actions, such as fading out
sprites but note that if you just want to remove everything created by the scene
you can just use the **delete** command below.

## Resetting Scenes

When you **stop** a scene, all of its sprites are deleted and variables become
inaccessible from other scenes. However, image resources, variable contents and
the graphic drawing options are retained. If you want to also remove these
preserved items then use the command:

`reset {scene-name}`

This will make it look like the scene was never called, so images will be reloaded.

Use the **reset** command if you are not going to use the scene again, or if it has
loaded a lot of images and will not be used again for some time.

## Duplicating Scenes

As noted above, it is only possible for one invocation of a scene to be running
at a time, the **start** command on a running scene is silently ignored. If you
do want to have multiple versions of the same scene running you can create a
copy of a scene with:

`(copy | clone) {scene-name} as {new-name}`

This will create a new version of the original scene which will have its own
sprites, images and variables, as well as a new name, but all the actions
and triggers will be duplicated. (Note that images are
cached so there is no penalty for using the **load** command on multiple
scenes). The new scene will not be running and must be specifically started with:

`start scene {new-scene}`

It is **NOT** possible to duplicate the main scene.

Within a scene you can access the name of the scene with the variable
_*$SCENENAME*_.

## Deleting Scenes

You can delete a scene if you no longer need it. You can only delete a scene
if it is not running or paused, and you cannot delete the main scene.

`delete scene {scene-name}`

Any sprites created by the scene will automatically be removed when the scene
is deleted, however any sounds currently playing will continue to do so until
the normal end of the sound file.

## Loading Images and Sounds

You can safely repeat **load** commands inside scenes, a repeated load does NOT
cause the resource to be re-opened. If the resource tag is already present then
no action is taken.

If you want to override this behaviour (for example, if you have an
infrequently used scene that uses large resource files) you can explicitly
remove images and sound files using:

`unload resource-tag`

This should be placed under the same trigger that stops the scene, before the
stop command. Next time the scene is run the resource will be reloaded.

## Resource Names

It is safe to re-use resource names in different scenes as they will silently
have the scene's own name and a colon prefixed to them, hence the "cloud" within the
scene "rainy-sky" can be safely used alongside the same in the "sunny-sky"
scene, each reference to the will be restricted to that in the named scene.

It is also possible to refer to resources loaded at the top level within
scenes, just use their usual names. The program will look first for local names
(within the scene), then top level tags. Hence local tags will "hide" top-level
tags - if you really want to access a top-level tag that is hidden by a local
one (not a recommended practice!) this can be done by putting a colon (:) in
front of the tag name. NOTE TO SELF - is this correct???

The pre-fixing of scene names means that it is also possible to refer to
resource tags from other scenes, for example we can say:

`hide sunny-sky:cloud`

from within the rainy-sky scene; although I recommend only very careful use of
this - if the other scene isn't running its resources will not be accessible.

## Scene Options

There are some options that can be set specifically for each scene.

`gravity {integer}`

`ground \[level\] {integer}`

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

Additionally, sprites under the influence of gravity will also stop moving if
they reach "ground level". Remember that the 'y' coordinate grows downwards so
ground level cannot be assumed to be 0. You can set the actual level at which a
sprite will stop "falling" with the ground level directive.

Note that if you are using script scaling, both gravity and ground level will
be assumed to be given in script coordinates and will be scaled appropriately
for the actual display.
