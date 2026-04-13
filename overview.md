---
layout: page
sidebar: slow-glass
title               : "Slow Glass Script Overview"
subtitle         : ""
teaser              : ""
header:
   image_fullwidth  : "headers/slow-glass.jpg"
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
