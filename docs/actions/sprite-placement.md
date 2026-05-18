---
title               : "Slow Glass Sprite Placement Actions"
---

## Sprite Initial Placement

This command has a lot of flexibility so I will cover it several parts. The
simplest usage is:

`place {sprite-name} at {x} {y}`

This will place the name sprite centered on the given location at its
"native" size, i.e. the actual size of the image or the view on to the image.
The depth will be one layer higher than the highest existing object. Hence sprites
will be overlaid in the order that they are placed, so later
placements will be "on top" of earlier ones, excluding the **frame**
if present (see below). If you want to give the depth yourself use:

`place {sprite-name} at {x} {y} [depth] {z}`

Instead of giving absolute coordinates you can put the sprite in the
centre of the screen:

`place {sprite-name} at (centre | center) [depth] {z}`

If you want to make additional changes to the sprite (e.g. to
gradually fade it into view) you can place it on the canvas
without it being visible like this:

`place {sprite-name} hidden at {x} {y}`

If you want the sprite to be a different size to the original you
have several options. At the simplest, just give the size in pixels:

`place {sprite-name} at {x} {y} size {w} {h}`

Alternatively, if you know one of the dimensions and want the other to
be scaled to preserve the original proportions just give it and the other
will be calculated to match:

`place {sprite-name} at {x} {y} (width | height) {number}`

Finally, you can scale the image to a certain percentage of its
original size, either scaling both dimensions together or giving
seperate scaling factors for each:

`place {sprite-name} at {x} {y} scale {percentage}`

`place {sprite-name} at {x} {y} scale {width-percentage} {height-percentage}`

Most of the options can be combined where sensible, so for example you
can place a scaled sprite the centre and have it hidden by using the
appropriate options.

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
preserving the aspect ratio. It is placed at a depth of 1000 and thus
is drawn on top of everything else.

The expectation is that it can be used for an outer frame with a
transparent centre, like a theatre stage. Since it appears on top
of everything else it can also be used to display title cards
or speech like in silent movies. Just use the **hide** command
to make it invisible once you are finished with it.

### Depth hints

If you choose to use the roles noted above then you will typically
place your own (moving) sprites at depths between 500 and 1000 so
that they are drawn above all of the other elements apart from
the frame.
