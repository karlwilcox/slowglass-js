---
layout: page
sidebar: slow-glass
title               : "Slow Glass Animation System"
subtitle         : ""
teaser              : ""
header:
   image_fullwidth  : "headers/slow-glass.jpg"
---

## Slow Glass?

The name "Slow Glass" was inspired by the famous Bob Shaw short story "The Light of Other Days". In the story a form of glass is invented which it takes light 20 or more years to travel through its thickness. A pane of such glass can be set up in some picturesque location, left for a few decades and then moved to a new location like the wall of your Manhattan apartment and you get the benefit of that pretty view for an equivalent length of time.

The Slow Glass project aims to provide a similar experience but without the long wait!

## Key Features

* Scripted: Slow glass is controlled by a script file in a fairly readable structured English (not complex code)
* Animated: Moving images and sounds are catered for (2D sprite based for now, perhaps 3D later)
* Long-running: The expectation is that a device such as a Raspberry Pi is attached to a flat panel display and left to run for extended periods
* Event driven: Things happen in response to a wide variety of events:
  1. At regular intervals: "every five minutes"
  1. At fixed times: "each *:30:00" (on the half hour)
  1. At specific times: "at 12:00:00"
  1. In response to user actions ("onclick...", "on key...")
  1. Randomly
  1. Arbitrarily: "when &lt;expression&gt;"

## Requirements

Slow Glass is written in JavaScript, initially targetted at the browser environment. It will ask for
location but this is only to determine the hemisphere so the season variables work correctly.

(Slow glass was originally written in Python 3 using the Pygame-ce library, this code is still available.)

## Guide to the Documentation

The best place to start is probably the [tutorial](/slow-glass/tutorial/).

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

Where are duration is required an integer number will be searched, followed by an optional time unit. Units can be "seconds", "minutes", or "hours" (or common abbreviations of those) and the default is seconds.

### Command Completion

In the documentation of the action commands, it is always stated when, and
under what circumstances the command "completes". This is relevant to the
trigger word **then**. This trigger will be succesful when all the immediately
preceding commands have "completed". Many commands complete as soon as they are
encountered, but others complete when whatever action has been requested has
completed, for example when moving a sprite to a specific location the command
completes when the sprite reaches the location or the script sends a **stop**
command to the sprite.

See also the **wait** command discussed in [/slow-glass/actions/system/]{the system commands} page.

