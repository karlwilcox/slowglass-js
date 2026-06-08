---
title               : "Slow Glass Animation System"
---

Groups can be used to, err, "group" sprites together. For most purposes you can
treat a group like a single sprite, you can scale it, move it, size it, tint it
and most other things.

## Creating Groups

Groups are named and share the same namespace as image resources, so it is best
to make sure that they are different. To create a group use the command:

`group create {group-name} (hidden)`

If you use the optional "hidden" then the group will need to make visible later with `show {group-name}`.

You can then add any number of existing sprites to the group with the command:

`group add {sprite-name}`

Note that the coordinates will be adjusted so that wherever the group is currently
located the sprite will appear to be in the same place as it currently is, but
is not part of the group and will move with the group.

## Placing Sprites in Groups

You can also place a sprite directly in a group. Note that the location you
provide will be relative to the location of the group, **NOT** the overall
stage.

`place {sprite-name} in {group-name} at {x} {y} {depth}`

If the group is hidden the sprite will also be hidden.

A group is itself just another type of sprite so you can nest them
to any depth using the same construction:

`place {group-name} in {super-group} at {x} {y} {depth}`

## Uses of Groups

I expect groups will be used in two, rather different ways, for which
different approaches might be appropriate.

### Grouping Sprites to Move Them as One

This is grouping several sprites so you can move them as a single unit (Or
scale them, skew them rotate them as one), like a formation of aircraft for
example.

For this type of group I suggest creating the group (which will initially be at
coordinates 0, 0) and then adding the sprites to the groups as you place them
around those coordinates. If you wanted four aircraft in a square formation
then use negative coordinates on some of them to centre them around the origin.
Then when you place the group itself in your scene at a particular location the
aircraft will be centered at that location.

### Grouping Sprites to Apply Effects to All of Them

This is for example if you want to have a number of windows in a city
scape and to tint or darken them all at once. In this case I suggest
that you create the group, place all your windows exactly where you
want them in the scene and then use `group add` to put them into the
group. You never need to place or move the group and apply your
**darken** or **tint** (or whatever) commands to the group, which
will affect all of the sprites at once.

To ensure the group is active in the scene just place it at
the origin, i.e.:

`place {group-sprite} at origin`

## Groups and Group Members

It is still possible to control individual sprites within a group, just use the
sprite name as normal (so do not give your group the same name as a sprite, I
suggest using g- as a prefix on group names perhaps).

Note that if you **scale** a group and then move one of the individual sprites
within the group, the movement will also be scaled. So for example if you scale
a group to 50% and then move one of its members 100 pixels, it will only move
50 pixels on the screen. The full size movement will be apparent if the
group scaling is later **reset**. Note that the program may not successfully
track a sequence of scaling and group member movements, see the discussion below
on dimensions.

## Group Dimensions

How "big" is a group? The dimensions of a group are considered to be those of a
rectangle just big enough to contain all of the members of the group, wherever
you have placed them. This means that if you add group members, or move or
scale or change the size of a group member the dimensions of the group _*may*_
change.

This is not a problem if you want to scale the group, or give it an absolute
size but it can be an issue if you want to size the group proportionally (i.e.
with a given height or width and the other dimension scaled to maintain the
proportions).

**Before** sizing a group proportionally, place and size all the group members,
how you want them to be arranged and then the run the command:

`group measure {group-name}`

This will calculate the surrounding rectangle so that we know for sure
that the "starting size" of the group is. This also sets the dimensions
for any subsequent `resize {group-name} reset` commands.

If you want to begin with a group resized proportionally then place it
**hidden**, measure it, resize it and then make it visible with `show`.

## Groups and Depth

The layering of sprites is determined first by their relative depth within the
group, the the group as a whole is positioned in accordance with its own depth.
This means that you cannot "interleave" different parts of a group within other
sprites, all group members share the same depth within the larger scene.
