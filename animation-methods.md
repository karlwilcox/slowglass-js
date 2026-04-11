---
layout: page
sidebar: slow-glass
title               : "Slow Glass Animation System"
subtitle         : ""
teaser              : ""
header:
   image_fullwidth  : "headers/slow-glass.jpg"
---


# Introduction

The aim of slow glass is to show actions on the screen, albeit at a slow pace. Several different methods can be used to animate things on the screen, which can be combined for greater effect. The methods here are described from simple to complex.

All of the examples below assume a screen with dimensions 1920 x 1080 pixels and a plain grey background

# Static Objects Moving on the Screen

(By "static" here we mean that the object itself is unchanging but its position, size and orientation on the screen can change).

The process for static objects is quite simple:

1. Load the source image resource
1. Place a sprite in the start location at the desired size
1. Issues commands to change the position, size or rotation, over a certain period of time
1. Optionally, the sprite can then either be hidden (if it might be re-used) or removed completely

The "change" commands can use any trigger event, such as **begin** (to run when the scene starts) or **on key** to run when a key is pressed.

## Static Object Example

Let use consider a simple example:

```
scene plane-fly
    begin
        load plane1.png as plane
        place plane at 150,950,0 size 300,150

    after 3 seconds
        move plane to 2070,300 in 15 seconds
        resize plane to 200,100 in the same time

    after 20 seconds
        stop        
end scene
```

Hopefully the actions in this scene are fairly clear. When the scene is started a plane image appears in the lower left of the screen; after a few seconds it moves upwards and to the right, getting smaller.

(And yes, we could do this better, running along horizontally first, and no, it doesn't accelerate (which is possible) but this is intended to be a simple example.)

# Single Image Frame Animation

So our plane moved across the screen but the plane image itself never changed. What if we wanted the same motion but with a bird, flapping its wings as it moves? For this we can animate several frames all taken from the same image.

For this purpose we need a series of related images. Often images of this type are described as "sprites" and a single image contains two or more sprites, each in an equally sized "cell" in the main image.

# Single Image Frame Animation Example

We can load images into Slow-glass using the following command:

```
load bird-sprite.png as bird size <rows> by <columns>
place bird at <wherever...>
```
Where rows and columns are the number of cells within the image. (At present, all cells in the grid need to be filled)

And we can set the animation rate as follows:

```
set animation rate of bird to <num>
```

Where num is the number of seconds between frame changes - this number is a float value so a value of 0.1 means 10 frames per second. (Remember that Slow-glass is not a gaming platform, slow updates are typically perfectly reasonable). The sprite can then be moved using the command sequence shown above.

Note that a multi-frame sprite does not *have* to move, a stationary sprite will still update at the set animation rate (for example, water flowing from a fountain).

(There are advanced techniques to advance frames manually but as before, we wish to keep this example simple.)

# Multi-image Frame Animation

Instead of putting all our sprite frames into a single file as cells, we can just provide each frame as a separate file. To manage these, all the image files are placed into single folder and will be displayed in increasing alpha-numerical order (e.g. use names of the form "sprite.0001.png", "sprite.0002.png" etc, NOT sprite1.png, sprite2.png... as numbers above 10 will not be sorted correctly).

To load a set of images as sprite frames we use the following syntax:

```
load <sprite-folder> as <image-name>
```

After this, it can be used exactly the same was as the single file frame animation described above.

# Movie Frame Animation

In a similar fashion to the collection of image files method described above, we can load
a movie file and display that frame by frame. The command is very similar to the above:

```
load sky-movie.mp4 as sky
place sky at <wherever...>
set animation rate of sky to 1
```

Note that we do NOT show the movie at its "native" frame rate, that is set independently using the animation command, usually to a *much* lower rate than the native movie. We are not showing a movie, just using it as a convenient container for a number of closely related images.

# Moveable Window Animation

Instead of moving an image across the screen we can alternatively define an area of the screen which represents a "window" on to another image. We can then move or zoom that window as desired. Note that this is a generalisation of the cell based animation described above, instead of showing a single cell of a larger image we can choose any arbitrary area of the image to show. We define the sprite as usual way but then define the window area on to the underlying image.

Say we have a long image of a train that is 2000 pixels long and 300 pixels high that we want to appear moving in a 400 pixel gap between buildings centered at 900,500:

```
load long-train.png as train
place train at 900,500,0 size 400,300
window train at 2200,150 400,300
scroll train to -200,150 in 20 seconds
```

Initially, nothing is visible in the display area but gradually the whole length of the train will pass through the display area, appearing to move from the left to the right. We can also change the size of the window onto the source image using the zoom command - this can be used to make this appear to advance or recede.

## Advanced Use

At the same time as scrolling and zooming the display area of the source image, we can actually move our sprite on the display at the same time. This probably needs judicious use but can provide some powerful animation effects.

And, the source image itself can be a multi-frame animation, advanced either automatically or manually. So, with just a few lines of script we can define a moving, resizing sprite that shows a moveable, zoomable window on to a source image that is itself animated! Do not try this without the aid of a safety net...


