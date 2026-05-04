---
title:    "Slow Glass Animation System"
banner:   "big"
---

## Slow Glass?

The name "Slow Glass" was inspired by the famous Bob Shaw short story "The
Light of Other Days". In the story a form of glass is invented which it takes
light 20 or more years to travel through its thickness. A pane of such glass
can be set up in some picturesque location, left for a few decades and then
moved to a new location like the wall of your Manhattan apartment and you get
the benefit of that pretty view for an equivalent length of time.

The Slow Glass project aims to provide a similar experience but without the
long wait! Watch some the demos available from the drop down at the top of the
page to see what sorts of things Slow Glass is capable of.

{% capture disclaimer %}
I first read the story more than 40 years ago and it has stuck with me ever since.
The use of the Slow Glass concept is intended as an homage to the author and
without any intention to claim ownership or infringe any copyrights.
{% endcapture %}

{% include card title="Disclaimer" text=disclaimer %}

## Key Features

The idea for Slow Glass originated with the desire to have a flat panel display
at the end of a street of Lego Creator buildings making it appear that a busy street
receeded into the background. With that in mind I wanted something:

* Scripted: driven by a text file with readable structured English
* Animated: Moving images with simple effects and sounds
* Long-running: Non-repeating action over many hours, hence-
* Event driven: Things happen in response to random or timed events
* Calendar aware: Different from day to day and season to season

{% capture warning %}
Slow Glass is very new and much untested! It should be regarded as an Alpha
release at best. It contains many bugs and the documentation should be taken
as "aspirational" rather than accurate(!) The details of the language
are also subject to change if I find a better way to do things, but please
give it a go and if you find a bug or have ideas for improvements just
let me know.
{% endcapture %}

{% include card title="Warning!" text=warning type="dark" linkURL="/contact.html" linkText="Contact" %}

## Design Goals

In designing the scripting language for Slow Glass I had the following goals in mind

### Readbility

The language should look like English and work like English, so verbs make
things happen and nouns represent things. Prepositions make sense in their
context, so `move to` and `move by` retain their normal English meanings. Even
a reader completely new to Slow Glass should be able to make a reasonable guess
at what they will be seeing just by reading the scripting and interpreting it
as normal English.

### Graded Complexity

Simple things should be easy - loading an image, placing it on the screen and
making it move can each be done with a single, clearly written command.

More complex things should be possible but might require some knowledge of very
basic programming concepts like simple loops and the use of variables.

Very complex things are out of scope. This is **not** a game engine, most
things happen on a timescale of around 1 second and fancy graphical effects are
not supported (even if the underlying graphics engine allows for it).

### Progamming Concepts

As noted above, to do somewhat more complex things some programming concepts
are needed. These should be as simple as possible while still being familiar to
anyone who has written in a high level language before. The number of
programming concepts used has been kept to a minimum, which may sometimes
require more verbose code but keeps the actual language quite simple.

## Get Me Started!

The tutorials are probably the best place to start to gain an understanding of the scripting language, which is all fully documented in the links shown at the top of the page.

The demos show the sorts of things that are possible, and the demo source code is provided at the bottom of each demo page, so study these listing to see how they work.

There is also a "playground" page where you can load scripts and run commands interactively to see what they do, and also debug your scripts with a visible message console.

### Assets

In the course of creating and testing Slow Glass I've created a number of graphic objects (largely with the assistance of the Affinity App Canva AI image generator) and you are free to use these as you wish.
