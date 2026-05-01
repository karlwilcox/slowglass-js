---
layout: page
sidebar: slow-glass
title               : "Slow Glass Sprite Appearance Actions"
subtitle         : ""
teaser              : ""
header:
   image_fullwidth  : "headers/slow-glass.jpg"
---

These commands affect the visual appearane of a named sprite.

## Show / Hide

`(show | hide | toggle) {sprite-name}`

Makes the named sprite visible or not, or swaps the visibility state. If you want to fade a sprite in to or out of view use the **fade** action with a given duration.

## Resize

`resize {sprite-name} (to | by) {width} {height} [(in | at) {duration}]`

Changes the sprite size to an absolute value (**to**) or by the given
values (**by**), either immediately or over a given duration.

The width and height values are integers and can be negative if
the **by** option is used.

The command completes when the resizing has been accomplished.

## Scale

`scale {sprite-name} to {w%} {h%} [in {duration}]`

Changes the size of the named sprite by the given percentage width and height.
So a change of 50% will make the sprite half the size, a scale of 200%
will make it twice the size and a scale of 100% will not make any difference
at all.

If one of the sizes is zero or omitted then the scaling will be uniform
across both dimensions.

The command completes when the re-scaling has been accomplished.

## Flicker

`flicker {sprite-name} {size} [with chance {number}]`

`flicker {sprite-name} stop`

This randomly modifies the transparency of the sprite by up to plus or minus the size parameter. The modification happens 25 times per second, provided that a random percentage is smaller than the chance number, which can range from 0 to 100 and has a default value of 50.

You can also stop the sprite flickering.

The transparency value of the sprite remains fixed, (e.g. when using the variable ${sprite-name.trans}, the flicker amount is applied separately.

Both of these commands complete immediately.

## Flash

`flash {sprite-name} [{number} times]`

This action makes the sprite appear for a 10th of second then disappear. This can be repeated up to 10 times. It uses the visibility property, which will be set to false after the final flash.

This command completes immediately.

## Blink

`blink {sprite-name} [at] {rate} [per second] [with chance] {number}`

`blink {sprite-name} stop`

This action makes the sprite appear and disappear at the rate specified, but only if a random percentage is less than the chance specified which can range from 0 to 100 and has a default of 100, i.e. it will always blink.

This command completes immediately.

## Pulse

`pulse {sprite-name} at {number} [per second] [from] {min} [to] {max}`

`pulse stop`

This uses the transparency (fade) value of the sprite to make the sprite appear to pulse at the rate given. It will start at the minumum value, rise to maximum at the desired rate and then fall to the minimum. Values can range from 0 to 100, with the minumum defaulting to 0 and the maximum to 100.

The stop option will end the pulsing and reset the transparency value to 100, i.e. fully visible.

## Darken / Lighten / Tint

`(darken | lighten) {sprite-name} [to] {number} [in] [{duration}]`

`set (darkness | lightness) [of] {sprite-name} [to] {number} [in] [{duration}]`

`tint {sprite-name} [to] {colour}`

`[set] tint [of] {sprite-name} [to] {colour}`

`tint stop`

These commands are related so are dealt with together.

Darken and lighten affect the overall tone of the sprite, between 0 representing a normal tone and 100 which is completely black. Darken and lighten are effectively the same command but reverse the meaning of the number. You can also gradually darken or lighten by specifying a duration.

These commands complete when the tone change is finished.

The **tint** command allows you to give an overall colour cast to the sprite. The colour parameter can be any of the named web colors, or the word **stop** which will remove any colour tint or lightening or darkening, restoring the sprite to its original colours.

The tint command completes immediately.

## Flip

`flip {sprite-name} (horizontal | vertical | reset)`

Flips the named sprite around the horizontal or vertical axes, or puts the sprite
back into its original orientation. The argument can be abbreviated to the first letter.
The sprite does not change size or position.

This command completes immediately.

## Skew

`skew {sprite-name} (to | by) {x-angle} {y-angle} [in {duration}]`

A shear transform by the specified angle in the given time.

The command completes when the skew is accomplished.

## Warp

`warp {sprite-name} to {top-left-x} {top-left-y} {top-right-x} {top-right-y} {bottom-right-x} {bottom-right-y} {bottom-left-x} {bottom-left-y} [in {duration}]`

`warp {sprite-name} by {top-left-x} {top-left-y} {top-right-x} {top-right-y} {bottom-right-x} {bottom-right-y} {bottom-left-x} {bottom-left-y} [in {duration}]`

`warp {sprite-name} reset`

Warps a sprite onto the four named corner points, clockwise from top-left.
The `by` form moves each corner relative to its current position. This uses
PixiJS perspective mesh rendering, so the sprite texture is projected into the
four-corner shape rather than simply skewed.

The command completes when the warp is accomplished.

## Reset

`reset [sprite] {sprite-name}`

This command undoes almost all of the above changes to bring the sprite back to its
original state. It will also make the sprite invisible so use the **show** command
to make it visible, possibly after applying a different set of effects.

This command completes immediately.
