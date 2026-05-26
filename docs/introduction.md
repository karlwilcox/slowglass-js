---
title               : "Slow Glass Scripting Language Introduction"
---

## Intentions

The scripting language is intended to be nearer to an English textual description rather
than program. It is also expected to support only simple animation and effects, although
careful design should be able to produce some impressive results.

## Basic Concepts

It might be helpful to imagine a Slow Glass document as a playbook, containing
scenes that can be performed, not by actors but by sprites, small graphical images.
A scene contains one or more "cues" and when the conditions of the cue occur then
one or more actions are carried out, usually involving sprites doing things.

There are also some overall "stage directions" that set things up, like the size of the
stage, any background colours and various options, including the geographical location.

Unlike a traditional play, in which scenes are usually acted out in sequence,
Slow Glass allows you perform scenes in any order, and perform multiple scenes
at the same time. You can even have the same scene being performed at the same
time in different parts of the stage or with different actors (sprites).

There is one scene, called "main" which can be thought of as the director, it controls
all the other scenes, deciding when they are performed and making any changes
necessary as the "play" proceeds.

See the [/docs/overview.html](Overview page) for more information about the
structure and organisation of a Slow Glass Document.

## Coordinate System

In order to instruct our sprite actors in their roles we need to tell them
where to stand and where to move to. We do this in terms of coordinates called
x and y which are whole numbers. 0,0 is the top left corner, x increases to the
right and y increases down the page.

(Note, if you are already familiar with animation systems having y grow
downwards is not always the case with some animation systems so watch the sign
of things, especially on the y axis!)

Additionally sprites may overlap in the coordinate space so we need to know
which one is in front. For this we use the idea of depth, or z coordinate. z is
an arbitrary value but sprites with higher values of z are drawn **in front**
of sprites with lower values of z.

### Documentation Notes

I've tried to provide comprehensive documentation and to be consistent I
have used the following conventions:

* Words in ordinary text are REQUIRED as part of the language
* Words in curly brackets are supplied by the user (usually names)
* (EXCEPT where the examples is discussing variable names, where the curly brackets mark the limits of the variable name)
* Words in square brackets are OPTIONAL and can be used to help readability - this is encouraged but not required
* Words in round brackets separated by vertical bars indicate options
* Words followed by ellipsis (...) can be repeated any number of times

### Naming Conventions

Where you are asked to supply a name it is best to assume that all names should
be unique, i.e. they all share the same namespace. So do not have a scene, a
sprite and a sound all using the same name. Although this might work I can't
guarantee it and you are only making things confusing for yourself anyway.

It is probably also best to avoid using the language keywords as names, so
don't call your scene "scene"! I also recommend NOT using all upper case
names as these are used for built-in variables.

### Specifying Duration

Where are duration is required an integer number will be searched, followed by
an optional time unit. Units can be "seconds", "minutes", or "hours" (or common
abbreviations of those) and the default is seconds.

### Command Completion

In the documentation of the action commands, it is always stated when, and
under what circumstances the command "completes". This is relevant to the
trigger word **then**. This trigger will be succesful when all the immediately
preceding commands have "completed". Many commands complete as soon as they are
encountered, but others complete when whatever action has been requested has
completed, for example when moving a sprite to a specific location the command
completes when the sprite reaches the location or the script sends a **stop**
command to the sprite.

See also the **wait** command discussed
in [/docs/actions/system.html]{the system commands} page.
