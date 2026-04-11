---
layout: page
sidebar: slow-glass
title               : "Slow Glass Animation System"
subtitle         : ""
teaser              : ""
header:
  image_fullwidth  : "headers/slow-glass.jpg"
---


Groups can be used to carry out actions on a set of images at the same time. Groups are considered to be a type of resource so can be treated very much like a single image.

## Creating Groups

Groups are named and share the same namespace as image resources, so make sure that they are different. To create a group use the command:

```
Create group named <group-name>
```

You can then add any number of sprites to the group with the command:

```
Add to group <group-name> <sprite-name-1> <sprite-name-2> …
```

Note that adding a sprite to a group means that it will not appear until the group is placed somewhere using the **place** command. Hence it is usually a good idea to put group creation, sprite creation and the adding of those sprites to the group, and its placement all under the same trigger.

## Using Groups

The group can now be used exactly the same as any other image. It can be placed in scene using the **place** command, it can be re-sized, moved, have its transparency changed etc. and the commands will apply to every sprite within the scene.

It is still possible to control individual sprites within a group, just use the sprite name as normal (so do not give your group the same name as a sprite, I suggest using -group as a suffix on group names).

## The Size of the Group “Image”

By default a group is treated as an image which is the same size as the whole window - this means that if it is placed at $CENTREX, $CENTREY it works as an “overlay” to your window. This is useful for example if you want to have various (transparent) lights at various locations in your scene. Put them all into the group “light-group”, place the group in the centre and then you can change the transparency of the whole group using the normal image commands to make them appear brighter (perhaps at the same time as darkening the background image.

An alternative use for groups is to gather together a set of objects that you want to move in lock-step. For this purpose you can specify an initial size for the group. When adding objects to the group make sure that they are “placed” inside the dimensions of this image size. For example:

```
Create group planes-group size 600 by 400
Place plane-1 at 200,100,100
Place plane-2 at 300,200,101
Place plane-3 at 400,300,102
```

You can now place and size the group as required, scaling will be done relative to the group size - so for example to make these planes appear to be flying across the screen getting gradually close you can use the following commands:

```
Place planes-group at 100,100,0 size 300 by 200
Move planes-group to 1000,500 in 60 seconds
Resize planes-group to 600,400 in the same time
```

## Groups and Layers

Recall that layers determine which sprites appear in front of which other sprite. Each sprite has a layer number, higher numbers appear further back.

A group is considered to be an image source for a sprite so it does have a layer assigned, however this has no impact - sprites within the group will be drawn with the layer numbered assigned to each individual sprite within the group.




