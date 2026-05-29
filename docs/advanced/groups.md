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

Groups can be nested to any depth, using the construction:

`group create {group-name} (hidden) in (group) {parent-group-name}`

## Creating Sprites in Groups

You can also place a sprite directly in a group at the point you are creating it, so for an image sprite you can do:

`sprite create plane1 in group planes from plane`

Graphics and text sprites work the same way.

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

How "big" is a group? The dimensions of a group are considered to be those of
a rectangle just big enough to contain all of the group, wherever you have placed
them. This means that if you move or scale or change the size of a group member
the dimensions of the group _*may*_ change. As you **resize** or **scale** the
group the program will calculate a new size, and also try to maintain
the original size for the purpose of resize or scale **reset**.

So for example, if you scale a group down, then move one of its members "outside"
the existing group, then scale it back up again the group will actually be larger,
at least for simple scale / move / scale chains like this.

## Groups and Depth

The layering of sprites is determined first by their relative depth within the
group, the the group as a whole is positioned in accordance with its own depth.
This means that you cannot "interleave" different parts of a group within other
sprites, all group members share the same depth within the larger scene.
