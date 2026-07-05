---
title               : "Slow Glass Aspect Variation"
---

## Note

This is an advanced feature and hasn't been tested much, there is no
need to read or understand this section, Slow Glass works perfectly
well if you don't use tags at all.

## Varying Aspects of Sprites

It is hoped that the various actions described elsewhere provide a sufficient
range and flexibility for most simple animations, however there is a
mechanism to apply additional changes to sprite appearance or location
using the **vary** command.

`vary {sprite-name} {aspect} \[(by | with)\] {waveform} {limit} {period} \[{extra}\]`

`vary {sprite-name} {aspect} stop`

With this command we can change a particular aspect of a sprite (such as its location
in the y axis) by applying a waveform modifier to it. Not that while this has a
visual impact on the aspect (e.g. the location) it is in effect only temporary
and is applied after anything else that is happening with the sprite. So for
example if we are already moving in the y axis then applying the **vary**
command will add additional changes to the movement, for example making it
"jerky" or uneven. Or by moving smoothly in one axis and applying, say a
sinewave varitation in the other we can move with a smooth wave-like motion.

### Variable Aspects

At present the following aspects of a sprite can be varied:

* pos.x - the position on the x axis
* pos.y - the position on the y axis
* size.x - the width of the sprite
* size.y - the height of the sprite
* skew.x - the horizontal skew value
* skew.y - the vertical skew value
* transparency - sprite transparency

Other aspects (or synonyms for existing ones) may be added in future.

### Common Parameters

* limit - the maximum extent of the waveform
* period - time before the waveform repeats, e.g. "1 minute"
* extra - optional parameter that depends on the chosen waveform

### Available Waveforms

* random - TBD
* sinewave - smoothly varying wave to +/- limit over period, optional offset
* sawtooth - linear rise from 0 to limit and back again
* triangle - linear rise from o to limit then jump back to 0
* square - at limit for half the period, then 0 for a half the period

Other waveforms may be added in the future

## Combining Variations

You can add as many variations to an aspect as you wish, but can
only remove all of them at once, using the **vary ... stop**
command.

The command **stop {sprite-name}** will also cause all variations
to be removed.
