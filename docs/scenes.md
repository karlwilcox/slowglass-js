---
title               : "Slow Glass Animation System"
---


It is possible to group script actions into named “scenes”. Actions within the
scene will only be carried out when the scene is started by another action
(except for the main scene, which will be started automatically).

## Creating Scenes

To create a new scene add the following to your script, on a new line:

`scene <name>`

This can be followed by any number of cues, conditions and actions that
will form part of the scene.

To end a scene, just start a new one, or put on a line on its own:

`end scene`

Any triggers and actions that are not within a named scene will be part of the “main”
scene.

### Approaches to Scenes

A simple script can ignore scenes and just contain the options, cues and
actions that you need. A scene called "main" will be created automatically and
performed immediately

If you want to re-use parts of a script, or just organise a larger script into
parts then you are free to use as many scenes as you like. You can still
leave "top level" actions outside any scene and they will automatically be
placed into the "main" scene.

Finally you can group everything into scenes, using as many as you like just
be sure to have one scene called "main". It can be anywhere in the script and
will be enabled and performed automatically.

## Performing Scenes

### Simple Startup

When the script is first read in by the program the scenes (apart from the
main one) are just stored away, ready to be performed You can start
this process following either of two methods. Firstly, and most simply
you can just use the perform command:

`perform \[scene\] {scene-name} \[named {active-name}\]`

It is important here to understand the difference a "scene" (a reusable
part of the script) and an "active scene" (a scene currently being performed).

If you need to refer to a scene while it is being performed (for example to pause
it, or access one of its variables) you will need to use the active name. If you
don't give an active name them you can just the scene's own name, and in many
cases this is all that you will need.

One way that you might need to use active names is to manage several versions
of a scene being performed at the same time. It might be helpful to give each
"version" of the scene its own name. For example you can append the $UNIQUE
built-in variable to ensure this:

`perform scene my_scene named my_scene-$UNIQUE`

However, you don't have to do this and below we discuss a different
mechanism that can help with multiple copies of scenes.

### Providing Information to a Scene

You can also provide information to an active scene by providing paramters
to the perform command. Parameters can be as much text as you want, it is made
available to the active scene through the $PARAMETERS built-in variable.
Typically you can use this with the **assign** command to set variables
for use in the scene.

`perform \[scene\] {scene-name} named {active-name\] \[with parameters\] {parameters...}` 

As soon as the scene performance starts the **setup** cue will be activated
(if present), immmediately followed by any **begin** triggers (again,
if present).

### Flexible Startup

If you need more flexibility that a simple start up and parameter passing
you can use a two stage process to run a scene:

`prepare scene {scene-name} \[named {active-name}\]`

This will load the scene into memory but the _*ONLY*_ trigger that will
be activated is **setup** (alternatively named **init**). This for
example can be used to load image and other resources.

At this point you can set the value of any scene variables that you
want, using a command like:

`make {active-name}:{variable-name} be {value}`

And then when you are ready you can start the active scene running
with:

`act out [scene] {active-name}`

This will start the scene and also activate any **begin** triggers.
You can also use parameters as with the **start** command above.

### When Scenes Actually Start Performing

Starting a performance with **perform** or **act out** only marks a scene
as "ready to start performing" and adds it to the queue of scenes in the
update process. Depending on whether the scene is before or after the
current scene in the queue it will start running on the current update or
the next one. This means that variables and sprites will **NOT** necessarily
be set up immediately.

The cues **setup** and **begin** will be run but no other cues will be tested
yet (even if they might be triggered).

If this is an issue then just make the invoking scene pause for a second,
then all the other cues will be tested. For example:

`perform {scene-name}`
`pause for 1 second`
`log ${scene-name}:{local-name}`

## Scene Duration and Deletion

It is likely that you will find yourself creating two types of scenes - those
that run continuously and those that complete after a certain time. For example
the "main" scene will be performed continuously as this is the "director" that
controls all the other scene. You might also have a scene that moves clouds
across the background which will be performed all the time that your animation
is showing. Most scenes however are likely to have a defined end state.

You will find it most convenient if scenes that end clean up after themselves! Most simply,
when the scene is no longer needed you should include a delete action after
an appropriate cue (e.g. after a set length of time, or using the **then**
cue to wait for all previous actions to complete:

`delete scene`

Any sprites created by the scene will automatically be removed when the scene
is deleted, however any sounds currently playing will continue to do so until
the normal end of the sound file.

You can also have another scene carry out an action to delete your scene (for example
the main, "director" scene can do it), just by giving the scene name:

`delete scene {active-name}`

But I would suggest that this is a bit error-prone and it is neater if a scene
deletes itself.

## Stopping Scenes For Manual Clean Up

Scenes can be stopped with the action:

`stop church-bells`

Or alternatively a scene can stop itself with actions such as:

`after 30 seconds`
`    stop scene`

If there are other actions needed at the end of the scene make sure that they
are placed _*before*_ the stop command, otherwise they will never be executed.

There is a cue **atend** which will be activated when the scene is stopped.
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

You can create a copy of a scene with:

`(copy | clone) {scene-name} as {new-name}`

This will create a new version of the original scene which will have its own
sprites, images and variables, as well as a new name, but all the actions
and triggers will be duplicated. (Note that images are
cached so there is no penalty for using the **load** command on multiple
scenes). The new scene will not be running and must be specifically started with:

`perform scene {new-scene}`

It is **NOT** possible to duplicate the main scene.

I'm not really sure where you might use this action but I wrote it as part
of earlier iteration of scene management so I might as well leave it and document
it here.

## Managing Multiple Scene Performances

As discussed above, all scenes have a name, which defaults to the name that you
gave to it originally. When a scene is **prepared** or **performed** you can
give it a different "active-name". In this way if you have multiple
performances of the same scene running you can refer to them by the unique
names that you give them when they start. Within a scene you can access the
name of the scene with the variable _*$SCENENAME*_.

It is NOT required to give scenes unique names, if you just want to start
several copies of a scene and will never need to refer to them at all
(e.g. they all just run forever, or they delete themselves when finished)
then you can just perform them as many times as you need. They will have
the same name.

It is still possible however to access the scenes individually - the program
itself gives every scene an "identifier" which **is** guaranteed to be unique.

Within the scene you can find this identifier by using the built-in variable
_*$SCENEID*_. If you have just started a scene with the **perform** command
then the id of the most recently started performance is available with the
built-in variable _*LASTID*_. You can store this in a variable if you wish,
or just use it until it is overwritten when another scene performance starts.

There is also a built-in scene name, **LAST** which refers to the most recently
started scene.

### Rules for Accessing Scene Variables and Sprites

If there are multiple performances of the same scene, all with the same scene name
then the following rules apply:

`${scene-name}:{local-name}`

Refers to an arbitrary running scene. There is no guarantee which scene and it
may differ between uses, so this isn't really useful

`let reference be ${LASTID}:{local-name}`
`$${reference}`

Refers to local name within the most recently started performance. Can be re-used
even after more scene performances are started as the _*LASTID*_ is stored
with the _*reference*_ variable.

`${LAST}:{local-name}`

Same as the above, but shorter - however it only works as expected immediately
after the scene performance has started.

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
