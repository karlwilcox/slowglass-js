---
layout: page
sidebar: slow-glass
title               : "Slow Glass Sprite Placement Actions"
subtitle         : ""
teaser              : ""
header:
   image_fullwidth  : "headers/slow-glass.jpg"
---

## Sprite Initial Placement

`place {sprite-name} [hidden] at {x} {y} [depth {z}] [size {w} {h}]`

`place {sprite-name} [hidden] at (centre | center) [depth {z}] [size {w} {h}]`

Places the named sprite at the given location and depth. If no
depth is specified the sprite will automatically be assigned
the next highest depth that has been used so far. I.e. sprites
will be overlaid in the order that they are placed, so later
placements will be "on top" of earlier ones, excluding the **frame**
if present (see below).

If the keyword **hidden** is present then the sprite will be placed
but will not be visible. In this way you can apply further modifications
or effects before making the sprite visible with the **show** command.

The sprite will be created at its original size unless you explicitly
provide a size. If one of the size parameters is less than 1 then it
will be calculated from the other dimension to preseve the aspect ratio.
For example if the source image was 250 by 200 pixels and you request
a size of **0, 100** then the sprite will be created sized **125, 100**.

This command completes immediately (but see the note above about
asynchronous image loading).

## Sprite Special Placement

Some images are not expected to move around but to occupy a particular
location or fulfill a particular role on the "stage". Although you
can use the place command for this purpose there is a separate
helper command which automatically takes account of the display
area size.

`(put | use) {image-name} as {role} [named {sprite-name}]`

This command will put the named image in a specific location
depending on the role. If you do not provide a name then the
role will be used as the name.

These are normal sprites and can have all the usual sprite
modification commands applied to them, including changing
the depth although I wouldn't expect them to be moved much.

You do not have to use these roles, you can set your own
sprites for these purposes they are just provided for
convenience.

The roles, and their characteristics are as follows:

### Background

The image is scaled to occupy the whole of the display area, aspect
ratio is **not** preserved. The background is placed at a depth
of 1.

Obviously this is expected to be used as the furthest background
against which everything else is drawn.

### Sky / Top

The image is scaled in width and placed flush to the top of the display area
with the aspect ratio preserved. It is placed at a depth of 100.

The expectation is that is perhaps a cloudscape?

### Ground / Bottom

The image is scaled in width and placed flush to the bottom of the
display area with the aspect ratio preserved. It is placed at a depth of
200, i.e. it will obscure parts of the sky.

The expectation is that this is the ground surface such as grass or
city streets or whatever.

### Left / Right

The image will be scaled in height and placed flush to the left or
right edge of the display area with the aspect ratio preserved. They are
placed at a depth of 300 and 400 respectively, i.e. they will
obscure the ground and sky.

The expectation is that these are nearby trees or buildings for example.

### Foreground

The image will be scaled in width and placed flush to the bottom
of the display area, with the aspect ratio preserved. It will be
placed at a depth of 500, i.e. it will be obscure the ground, sky
and anything to the left or right.

The expectation is that this might be used for fixed objects in the immediate
foreground.

### Frame

This is scaled to the fit the whole of the display without
preserving the aspect ratio. It is place at a depth of 1000 and thus
is drawn on top of everything else.

The expectation is that it can be used for an outer frame with a
transparent centre, like a theatre stage. Since it appears on top
of everything else it can also be used to display title cards
or speech like in silent movies. Just use the **show** command
to make it invisible once you are finished with it.

### Depth hints

If you choose to use the roles noted above then you will typically
place your own (moving) sprites at depths between 500 and 1000 so
that they are drawn above all of the other elements apart from
the frame.
