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
