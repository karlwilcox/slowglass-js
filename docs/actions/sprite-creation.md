---
layout: page
sidebar: slow-glass
title               : "Slow Glass Sprite Creation Actions"
subtitle         : ""
teaser              : ""
header:
   image_fullwidth  : "headers/slow-glass.jpg"
---

Sprites are created from images, a sequence of images or from text using the following commands:

## Text

`text create {sprite-tag} {content...}`

This creates a sprite containing the specified content in a basic font, size and colour.

**IMPORTANT** Unlike images, text sprites are created and automatically _hidden_. They will
not become visible until you use the **show** command. This is to allow you to add styling
or additional content before making it visible.

`text update {sprite-tag} {content...}`

This changes the text (only) of the text item, leaving the font, position and
so on unchanged, however it will have a new height and width depending on the
length of the content.

`text add {sprite-tag} {content...}`

Adds the content as an additional line to the existing content. The size and width
of the text sprite will be updated to take account of the new content.

text font {sprite-tag} {font-family}

text colour {sprite-tag} {colour}

text size {sprite-tag} {font-size}

text align {sprite-tag} (left | right | center)

All text commands complete immediately.