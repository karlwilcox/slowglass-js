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

## Source Images

Sprites are created from images and images can be re-used, or parts of them
used to create sprites so images are loaded as a separate snamee.

`load {url} [named {image-name}]`

The image file located at the given URL will be loaded into memory ready for
use in a sprite. If no name is given the basename of the file (i.e. without
the extension) will be used as the name.

**Important Note** for the purpose of command timing, the load command will complete immediately
however this is just a request to load the resource, which will be done
asynchronously. Hence there may be a delay before the image is actually
available. This is not a problem and you can still use the image to create
sprites and modify all of their properties they will just not appear until
the image has been loaded.

Similarly, if the URL does not exist or there is a server problem then sprites
can still be created but will never appear. Check console messages for loading
errors.

`(from | using | with) {URL-prefix}`

If you are loading several images from the same location you can use
this command to provide a prefix for the **load** command. It will
have a '/' placed between the prefix and the image URL that you
provide to the **load** command.

**Note** this prefix is local to the scene in which it appears so
you can use it freely in one scene without affecting the **load**
commands of other scenes.

This command completes immediately.

## Sprite Creation

`sprite create [named] [{sprite-name}] from {image-name} [area {x} {y} {w} {h}]`

`create sprite [named] [{sprite-name}] from {image-name} [area {x} {y} {w} {h}]`

This creates a sprite from the named image ready for use. It does **NOT**
cause the sprite to become visible. If no sprite name is provided then the
image-name is re-used as the sprite-name, although I don't recommend
this.

To use a rectangular subsection of the image use the area option and
specify the x and y coordinates of the top left corner and the width
and height of the required rectangle. There is little validation of
these inputs other than the width and height being greater than 0.

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

## Sprite Modification

There are many sprite modification commands which are listed separately.
(Add links...?)

## Text Creation and Modification

`text create {sprite-name} {content...}`

`create text {sprite-name} {content...}`

This creates a sprite containing the specified content in a basic font, size and colour.

**IMPORTANT** Unlike images, text sprites are created and automatically _hidden_. They will
not become visible until you use the **show** command. This is to allow you to add styling
or additional content before making it visible.

`text update {sprite-name} {content...}`

This changes the text (only) of the text item, leaving the font, position and
so on unchanged, however it will have a new height and width depending on the
length of the content.

`text add {sprite-name} {content...}`

Adds the content as an additional line to the existing content. The height and width
of the text sprite will be updated to take account of the new content.

`text replace {sprite-name} {content...}`

The existing text will be replaced with new content and the height and width
of the text sprite will be updated to match.

`text font {sprite-name} {font-family}`

The existing text will be re-drawn with the new font. At present there is
no check that the font-family exists so make sure that you get it right!

`text colour {sprite-name} {colour}`

The existing text will be re-drawn with the new colour, which should be
a name web colour or a hex colour code preceeded by a hash symbol (#).

`text size {sprite-name} {font-size}`

The existing text will be re-drawn at the given font-size. At present
there is no checking that this is a sensible value so please take
ccare to get this correct.

`text align {sprite-name} (left | right | center)`

The existing text is re-aligned to the specified alignment.The width and
height of the sprite should remain unchanged as the alignment should take
place all within the same bounds.

All text commands complete immediately.

## Future Intentions

I might think about some more sophisticated text formatting commands
but need to strike a balance between the simplicity and readability
which are the goals of Slow Glass and the extra functionality that
could be provided.

## Graphic Shape Creation

`(shape | graphic) (fill | colour | color) {colour}`

`(shape | graphic) stroke {colour}`

`(shape | graphic) stroke width {number}`

These commands set the stroke and fill colour options for subsequent shapes.
Colour can be a named web color or a hex string but there is no validation of
the name. Fill and stroke are local to the scene and remain in effect until
over-written with a new value.

`(shape | graphic) create {sprite-name} [as] (rect | rectangle) {width} {height} [{corner-radius}]`

`(shape | graphic) create {sprite-name} [as] circle {radius}`

`(shape | graphic) create {sprite-name} [as] ellipse {width-radius} {height-radius}`

`(shape | graphic) create {sprite-name} [as] star {number-of-points} {outer-radius} [{inner-radius}]`

`(shape | graphic) create {sprite-name} [as] line {length}`

These commands create graphic elements using the previously set fill and
stroke settings. There is some limited validation of the argument values.
Star creation does not include the rotation option as you can do this
after placement with the **rotate** command, similarly with the rotation
and position of the line, which will initially be drawn horizontally.

`(shape | graphic) create {sprite-name} [as] grid {x-spacing} {y-spacing}`

This creates a 2 pixel wide grid with the given spacing that will occupy the
whole of the drawing area if placed in the centre. The grid spacing must be
at least 10 pixels.

This graphic is not expected to be especially useful but may be helpful when
debugging placement issues.

All graphic commands complete immediately.
