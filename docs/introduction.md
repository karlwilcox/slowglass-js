---
title               : "Slow Glass Scripting Language Overview"
---

## Intentions

The scripting language is intended to be nearer to an English textual description rather
than program. It is also expected to support only simple animation and effects, although
careful design should be able to produce some impressive results.

## Basic Concepts

At its heart, the Slow Glass Language supports a series of actions that can be
carried out on sprites, small graphical images. Actions take place when they
are triggered by an event. So you will organise your script as a set of one or
more triggers followed by one more actions that will be carried out when the
conditions of the triggers are met.

It is also possible to organise your triggers and actions into separate
scenes, each of which is independent and can be reused if necessary.

In addition to this, the language also contains directives, which are
instructions and information to affect the operation of the program as a
whole, for example defining window sizes or creating scenes.

Hence a script is a series of lines of text, each line will either be a
directive, a trigger or an action. To allow for documentation there are also
ways of including comments in the file and white space is ignored so that we
can use indentation to help show structure.

## Coordinate System

 All positions in SlowGlass are specified in terms of x, y coordinates. 0,0 is
 the top left corner, x increases to the right and y increases down the page.
 (Note, this is not always the case with some animation systems so watch the
 sign of things, especially on the y axis!)

 Additionally sprites may have a depth, or z coordinate. z is an arbitrary value
 but sprites with higher values of z are drawn **in front** of sprites with
 lower values of z.

## Requirements

Slow Glass is written in JavaScript, initially targetted at the browser environment. It will ask for
location but this is only to determine the hemisphere so the season variables work correctly.

(Slow glass was originally written in Python 3 using the Pygame-ce library, this code is still available.)

### Documentation Conventions

When documenting the language the following conventions are used:

* Words in ordinary text are REQUIRED as part of the command
* Words in curly brackets are supplied by the user (usually names)
* (EXCEPT where the examples is discussing variable names, where the curly brackets mark the limits of the variable name)
* Words in square brackets are OPTIONAL and can be used to help readability - this is encouraged but not required
* Words in round brackets separated by vertical bars indicate options
* Words followed by ellipsis (...) can be repeated any number of times

### Naming Conventions

Where you are asked to supply a name it is best to assume that all names should
be unique, i.e. they all share the same namespace. So do not have a scene, a
sprite and a sound all using the same name. Although this will work in most
cases, the **stop** command cannot tell these apart for example. This may change
in a future version but why make things difficult for yourself!

It is probably also best to avoid using the language keywords as names, so don't call you scene "scene"!

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
