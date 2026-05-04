---
title               : "Slow Glass Web Page Integration"
---

## Required Libraries

SlowGlass uses Pixi.js and you will need to include the latest release in your
web page, before using SlowGlass.

It also uses the
[https://bugwheels94.github.io/math-expression-evaluator/](math expression evaluator)
and a copy of the library is provided in the dist folder.

SlowGlass will also attempt to determine the geographical location of the
browser - this is just to allow the correct assignment of the season (hence we
need to know which hemisphere we are in). If location services are not
available then the northern hemisphere is assumed.

## The SlowGlass Object

Slow Glass is provided as an ES6 module which can be found at
https://slowglass.net/js/slowglass.js . This module instantiates
an instance of the SlowGlass object called "slowGlass" and attaches it to the
window object hence it is available to web page JavaScript through the name
"slowGlass".

## Methods

The Slow Glass object exposes two methods to allow integration with the
web page.

### setDrawingParent(id)

The element with the given id will be used as the parent of the drawing area
(typically an empty "div"). If it is **not** called then the drawing area will
be attached as a child of the "body" element.

## setMessageParent(id)

If you call this method the element with the given id will be used as the
destination for console messages (so should typically be a read-only textbox).
If this method is not called messages will instead be written to the JavaScript
console.

The object exposes three methods for script management:

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
<div id="sg-canvas" style="min-height: 600px;"></div>
<script type="module" src="https://slowglass.net/js/math-expression-evaluator.min.js";></script>
<script src="https://pixijs.download/release/pixi.min.js"></script>
<script type="module" src="https://slowglass.net/js/slowglass.js"></script>
<script>
    slowGlass.setDrawingParent("sg_canvas");
    slowGlass.scriptFromUrl("https://slowglass.net/scripts/cafe/cafe.txt");
</script>
```
