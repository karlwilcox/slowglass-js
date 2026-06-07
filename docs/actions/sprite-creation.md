---
title               : "Slow Glass Sprite Creation Actions"
---

SlowGlass currently supports three types of sprite - image sprites, text
sprites and graphic sprites. (more may be added in the future). The process to
create them is slightly different so I will explain each separately.

## Image Sprites

### Simple Image Sprites

If you just have an image that you want to use as sprite you can create it
with a single, simple command:

`sprite create {sprite-name} load from {url}`

The sprite is then ready to be placed, scaled or whatever. The loaded image
is not cached and cannot be re-used elsewhere (but can be reloaded if required).

This is the simplest, but lease flexible way to create an image based sprite.

### Re-usable Image Sprites

Sprites are created from images and images can be re-used, or parts of them
used to create other sprites. To use images in this way we need to use a stage
process - loading the image and then creating a sprite from it. The image
loading is done by the command

`load  image \[from\] {url} [named {image-name}]`

The image file located at the given URL will be loaded into memory ready for
use in a sprite. If no name is given the basename of the file (i.e. without
the extension or any folder names) will be used as the name.

Loading of images is completed asychronously but we often need to know image
sizes in order to do scaling or placement calculations. For this reason
execution of the current scene (only) is suspended until the image has been
loaded. This is rather like every "load" command being followed by a "then".

If you don't want this behaviour (and you will take your own responsibilty
for making sure that the images are loaded) then you can append:

`no (delay | waiting)` to the command.

For example you can start the load of several large images, each followed
by "no delay" and put a "then" command after them - this will allow all the
images to be loaded in parallel before scene processing continues.

### Multi-frame Images

Sometimes animated sequences are provided as a single image containing
a rectangular grid of image "frames". To use these in Slow Glass just
provide the frame grid counts when you are loading the file:

`load  image \[from\] {url} [named {image-name}] (cells | frames) {cols} by {rows}`

When used as a sprite the first cell of the image only will be used. You can
use the **advance** and **reverse** commands to cycle through the other cells.

### Image File Loading Locations

Images are loaded from URLS - If you are loading several images from the same
location you can use this command to provide a prefix for the **load** command.
It will have a '/' placed between the prefix and the image URL that you provide
to the **load** command.

`(from | using | with) {URL-prefix}`

**Note** this prefix is local to the scene in which it appears so
you can use it freely in one scene without affecting the **load**
commands of other scenes.

This command completes immediately.

### Image Sprite Creation

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

## Text Sprites

Slow Glass supports a basic text creation system. The process is to first
set the desired text styles then to create the text sprite.

### Text Style Options

Select the text font. At present there is
no check that the font-family exists so make sure that you get it right!

`text font {font-family}`

Select the text font size. At present there is no checking that this is a
sensible value so please take care to get this correct.

`text size {font-size}`

Select the text colour, which should be
a named web colour or a hex colour code preceeded by a hash symbol (#).

`text colour {colour}`

Alternatively you can set the fill and stroke separately with these
commands.

`text fill {colour}`

`text stroke {colour}`

Select the desired text alignment. This only makes a big difference
to multi-line text.

`text align (left | right | center | centre)`

Finally, you can also choose to wrap the text after a number of
characters, for example to fit it within a speech bubble:

`text wrap {number}`

All text commands complete immediately.

### Text Sprite Creation

`text create {sprite-name} {content...}`

`create text {sprite-name} {content...}`

This creates a sprite containing the specified content in the previously
selected font, size and colour. When placing text be aware that you are
placing the _*centre*_ of the text

### Text Modification

`text add {sprite-name} {content...}`

Adds the content as an additional line to the existing content. The height and width
of the text sprite will be updated to take account of the new content.

### Future Intentions

I might think about some more sophisticated text formatting commands
but need to strike a balance between the simplicity and readability
which are the goals of Slow Glass and the extra functionality that
could be provided.

## Graphic Shape Sprites

Slow Glass supports some basic geometric shapes that can be drawn with
solid colours. The process of creating them is to first set the style
options then create the desired shape.

The style of a graphic shapes _*cannot*_ be altered after it is created,
you will need to delete it and create another in the new style.

### Graphic Style Options

These commands set the stroke and fill colour options for subsequent shapes.
Colour can be a named web color or a hex string but there is no validation of
the name. Fill and stroke are local to the scene and remain in effect until
over-written with a new value.

`(shape | graphic) (fill | colour | color) {colour}`

`(shape | graphic) stroke {colour}`

`(shape | graphic) stroke width {number}`

### Basic Graphic Creation Commands

`(shape | graphic) create {sprite-name} [as] (rect | rectangle) {width} {height} [{corner-radius}]`

`(shape | graphic) create {sprite-name} [as] circle {radius}`

`(shape | graphic) create {sprite-name} [as] polygon {radius} {sides}`

`(shape | graphic) create {sprite-name} [as] ellipse {width-radius} {height-radius}`

`(shape | graphic) create {sprite-name} [as] star {number-of-points} {outer-radius} [{inner-radius}]`

`(shape | graphic) create {sprite-name} [as] line {length}`

These commands create graphic elements using the previously set fill and
stroke settings. There is some limited validation of the argument values.
Graphic creation does not include the rotation option as you can do this
after placement with the **rotate** command, similarly with the rotation
and position of the line, which will initially be drawn horizontally.

All graphic commands complete immediately.

### Special Graphics Creation Commands

`(shape | graphic) create {sprite-name} [as] grid {x-spacing} {y-spacing}`

This creates a 2 pixel wide grid with the given spacing that will occupy the
whole of the drawing area if placed in the centre. The grid spacing must be
at least 10 pixels.

This graphic is not expected to be especially useful but may be helpful when
debugging placement issues.

`(shape | graphic) create {sprite-name} [as] bubble {width} {height} {corner-radius} {pointers...}`

This creates a rectangular speech bubble with rounded corners. You can also add
up to 8 "pointers" to show who is speaking, just list them at the end. They are
called(clockwise from the top) "top", "top right", "right", "bottom right",
"bottom", "bottom left" and "left". You can have as many of these as you wish,
and can use "and" to distinguish what might otherwise be ambiguous, e.g.
"bottom and left" gives you two pointers.


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
