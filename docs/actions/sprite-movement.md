---
layout: page
sidebar: slow-glass
title               : "Slow Glass Sprite Movement Actions"
subtitle         : ""
teaser              : ""
header:
   image_fullwidth  : "headers/slow-glass.jpg"
---

These commands affect the position and movement of a named sprite.

## Move

`move {sprite-name}`(by | to) {x} {y} [(in | at) {duration}]`

Moves the sprite to the given location (**to**} or to a location relative
to the existing location (**by**). This can happen immediately or over a
given duration.

The locations, x and y are integers - they can be negative and can out outside
the currently visible area.

The command completes when the movement has been accomplished.

## Rotate

`rotate {sprite-name} (by | to | at) {angle} [in {duration}]`

Rotates the sprite arounds its centre by, or to the specified angle. The
angle is in degrees with zero pointing upwards and the angle increasing
clock wise.

The command completes when the rotation is accomplished.

## Throw / Drop

`(throw | launch) {sprite-name} [at] {angle} [with force {speed}]`

`throw {sprite-name} stop`

These commands work in conjunction with the directives "gravity" and
"geound". TODO Add link

This will cause the sprite to start moving as if under the influence
of gravity. **Angle** is in degrees, with zero upwards and increasing
clockwise. **Speed** is given in pixels per second in the scene
coordinates (and will be scaled to match the display coordinates scheme).

The sprite will travel until one of three conditions is met:

- it goes "out of bounds" (by default, more than twice the display size in any
  direction)
- it goes below the ground level as specified in the directive above
- It is explicitly stopped

Sprite location is measured at the centre of the sprite, not its bounds.

**Drop** is a convenience command equivalent to throw something at 180 degrees
with zero speed.

Although these commands involve moving sprites I think it makes more sense to
have the commands complete immediately.

## Jiggle

`(jiggle | jitter) {sprite-name} [by] {x} {y} {step} [with chance {percentage}]`

`(jiggle | jitter) stop`

This command makes the sprite move in a random walk around its actual
position. It will never go more than **x** or **y** pixels in either
direction, and each step will be no larger than **step** pixels. The
position is updated 25 times per second and will only happen if a
random percentage is less than **percentage**, default 100%, i.e.
jiggling every 25th of a second. A percentage of 50 or even lower
looks quite effective.

When the sprite position is used, for example in a variable or moving by a
relative amount then the intended position is used, the jigglyness is ignored
for these purposes. 

The command completes immediately although jiggling will continue until the **stop** command

## Sway / Wave

`(sway | wave) {sprite-name} [to] {degrees} [in] {duration} [with chance {percentage}]`

`(sway | wave) stop`

This makes a gradual adjustment to the skew angle, going up to the skew angle
in the given time, down to zero then to the negative angle in the given time,
and repeats. The difference between them is that sway operates in the x
axis and wave operates in the y axis. You can apply both at the same time.

The percentage chance determines whether a movement will be made at each
update (currently once every 25th of a second).

The sway and wave are calculated separately from any other skew value applied,
and if you skew a relative amount, or use the skew value in a variable any
extra amount of sway or wave will be ignored.

The command completes immediately although skewing will continue until the **stop** command

## Future Intentions

To have the ability to change the centre of rotation, e.g.

`rotate {sprite-name} to 45 around 50 50`

