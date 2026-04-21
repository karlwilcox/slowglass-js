---
layout: page
sidebar: slow-glass
title               : "Slow Glass Web Page Integration"
subtitle         : ""
teaser              : ""
header:
   image_fullwidth  : "headers/slow-glass.jpg"
---

## Required Libraries

SlowGlass uses Pixi.js and you will need to include the latest release in your
web page, before using SlowGlass.

It also uses the
[https://bugwheels94.github.io/math-expression-evaluator/](math expression evaluator)
and a copy of the library is provided in the dist folder.

SlowGlass will also attempt to determine the location of the browser - this is
just to allow the correct assignment of the season (so we need to know which
hemisphere we are in). If location services are not available then the
northern hemisphere is assumed.

## The SlowGlass Object

Slow Glass is provided as an ES6 module which can be found at
https://karlwilcox.com/slow-glass/dist/slow-glass.js . This module instatiates
an instance of the SlowGlass object called "slowGlass" and attaches it to the
window object hence it is available to web page JavaScript through the name
"slowGlass".

## Properties

slowGlass exposes a single static property, "sg_id" which should be set to the
id attribute of the element that you wish to attach the animation to (as the
only child). This **MUST** be done before any method is called, otherwise a
default name of "body" will be used.

## Methods

The object exposes three methods:

### scriptFromText(text)

The script should be provided as a multi-line string argument to this method.
The script will be read and execution of it starts immediately.

### scriptFromURL(url)

The script should be a plain text file located at the given URL. It will be loaded over
HTTP and execution will begin as soon as the file has been loaded and read.

### cleanUp()

This removes the drawing surface and releases all resources. After this another
script can be run on the same page if required.

## Interaction

In order to respond to keyboard inputs you will need to give focus to the
animation area, typically be cliking on it or tabbing in to it.

You may also wish to provide a means of turning on the audio for the page
(e.g. an "unmute" button) to hear any sounds.

## HTML Example

A minimal HTML fragment is shown below:

```html
<div id="sg-id" style="min-height: 600px;"></div>
<script type="module" src="/slow-glass/dist/math-expression-evaluator.min.js";></script>
<script src="https://pixijs.download/release/pixi.min.js"></script>
<script type="module" src="https://karlwilcox.com/slow-glass/web/dist/slow-glass.js";></script>
<script>
    slowGlass.canvas_id = "sg_canvas";
    slowGlass.scriptFromUrl("https://karlwilcox.com/slow-glass/web/scripts/cafe.txt");
</script>
```
