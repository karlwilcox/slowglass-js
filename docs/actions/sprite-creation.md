---
title               : "Slow Glass Sprite Creation Actions"
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

### Future Intentions

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

## A Note On Size and Scaling

All sprite types have a natural "size" which will be used if you don't
provide any other information - for image sprites it will be the size
of the source image (or the size of the view onto that image);
for text it depends on font size and the number
of characters and lines; for graphics it is determined by the sizes
that you provided for the item.

You can determine the actual number of pixels that a sprite will occupy
on the actual screen by adjusting its size, its scaling, or both.

Size is given in pixels of width and height. It can be set arbitrarily
and also adjusted, either instantly or over a given period. Commands
which operate on the sprite size or change it are:

**create**, **resize**, **view**

Sprites also have a scaling factor, separately in the x and y dimensions.
The scale is a pure number, acting as a multiplier. Scale can be
adjusted, again either instantaneously or over a give period.
For ease of use scaling is given in percentages, where 50 means half
the existing size and 200 means twice the size. The default
value for scaling is 100. Commands which modify the scale of the sprite are:

**scale**, **shrink**, **grow**

The actual number of pixels used to display the sprite is hence
the size multiplied by the scale.

You can use either size or scale to modify the sprite, or even both. Size is
best if you need to put a sprite into a specific place in relation to other
picture elements, scale is perhaps best used when you wan to make the sprite
a little larger or smaller to make it "look right" in a situation.
You can also use changing scale to make a sprite appear to come from
the depths of the scene and then adopt your intended size for sideways
or other movements. However none of these things are requirements,
your are free to use (or not use) size and scale however best suits
your needs.
