---
title: "Slow Glass Adjustable.js"
---

## Implementors Note

It is not intended that the functionality described here is exposed
to the script write directly, rather one or more modifiers are
created and applied to achieve a particular effect, such as
jiggling or waving, and this "package" of modifiers is wrapped
up in a script command like **jiggle** or **wave**.

In terms of responsibility, the parsing of the script command and
its parameters should be done as one of the cases in the
runAction method of the Scene object, and the implementation (i.e.
selection of modifiers) should be done in an appropriately
named method of the SgSprite class, called from runAction.

## Adjustable Class

The adjustable class is intended to hold a scalar value such as
a sprite coordinate or transparency. At its simplest the stored
value can be set and retrieved using the following methods:

`{object}.setValue(value)`

`{object}.value()`

### Reference and Offset

An important concept to understand with the Adjustable class is that
the returned value is in fact made up of two parts, the reference
value and the offset value which are added together to produce the
returned value.

The reference value is considered the definitive value, for example
if an Adjustable object is being used to store the X coordinate of
the centre a sprite then for most purposes the sprite can be
considered to be located at that coordinate. This is the value
that is returned by the variable invocation:

`{sprite-name}.locX`

The offset value can be considered as a "temporary" adjustment
applied in order to achieve some particular effect. For example
to give a "jiggling" motion to a character sprite we might arrange
for the offset to assume a small random value varying over time.
Hence the sprite will still be centered on its "reference" location
but the actual drawn sprite will then vary its position randomly
around that location, deteremined by the offset value.

Should it be necessary to distinguish between the reference and
offset values then the following variable naming convention is
used:

`{sprite-name}.locX.ref`

`{sprite-name}.locX.off`

Note that when you call the "setValue" method you are setting
the reference value **only**, the offset value is not affected.

### Modifiers

The second important concept is that of Modifiers - these are
classes that modify the value of either the reference or the
offset value by providing a delta value. When an adjustable
object is updated through its **update** method then the
reference and offset values may be changed due to the
presence of modifier objects.

Modifier objects are added to an Adjustable using the following
methods:

`{object}.addReferenceModifier(modifier)`

`{object}.addOffsetModifier(modifier)`

To remove all object modifiers use the **stop** method, to
remove a single modifier provide use the method:

`{object}.removeModifier(modifier)`

Note that you do not have to distinguish between reference
and offset modifiers as modifiers are compared for identity
and hence can be located and removed wherever they are.

Do NOT assign modifiers more than once as this will cause
them to interact in unexpected ways.

### Modifier Lists

You can apply any number of modifiers to the reference
and offset values of an Adjustable object, they are
stored in a list with the most recently added modifier
at the end.

Modifiers receive as one of their update arguments the
current value they are modifying, updates are applied
in list order and modifiers down the list receive the
value **after** it has been updated (or not) by earlier
modifiers in the list.

It is not possible to change the order of this list, other
than by removing all the members and recreating them in
a different order.

### What is a Modifier?

Modifiers can be thought of as small "function generators".
All modifiers are provided with the current value and the
current time in milliseconds when they are updated, and
can use this information, along with paramters they were
supplied with on creation to calculate the required function
output.

Note that this function output is applied as a delta (i.e.
a change) to the Adjustable value - the actual modification
of the Adjustable value is carried out outside the
Modifier object (it is part of the Adjustable object's
own update cycle).

### Available Modifiers

The following modifiers are currently available. Any
modifier can be applied to either the reference or the offset
value but obviously some are more useful for one purpose
than the other

#### Common Modifier Parameters

Most modifiers accept the following three parameters in their
constructor so these are described here.

The **target** parameter checks the current value of the object
against the target and if the target is exceeded then the
modifier will expire and no further changes will come from
this modifier. At some future update the modifier itself
will be automatically deleted and removed from the modifier
list. If a **callback** parameter is provided then this
will be invoked when the limit is reached.

Note that if the current value is already beyond the target
nothing will be changed.

The **duration** parameter specifies a time in seconds during
which the changes will occur. At the end of the time the
modifier will expire and at some future time will be deleted
and removed from the modifier list.

It is possible to set both a limit and a duration in which
case whichever event occurs first will cause the modifier
to expire.

The **callback** parameter, if present, will be called
without arguments when the modifier expires.

Note that the callback may also be invoked if the sprite
goes "out of bounds", i.e. more than twice the stage
width or height beyond the visible area.

All three of these common parameters default to false and
hence have no effect if not provided.

#### Linear Change

`new Linear(now, rate, target, duration, callback)`

This modifier applies a constant rate of change to its value,
rate being given in the required change per second. So at its
simplest, we can for example move a sprite at a constant speed
along the positive x direction (i,e. left to right) with:

`sprite.logX.addRefefenceModifier(new Linear(Date.Now(), 10)`

This will cause the sprite to move 10 pixels per second to the
right indefinetely (including moving it off the stage completely).

#### Acceleration

`new Acceleration(now, rate, target, duration, callback)`

This will cause the returned value to increase at **rate** pixels
per second per second - e.g. a rate of 10 means that after 1 second
the delta value is 10, after 2 seconds it is 20 and so on.

Note that the **target** value in this case is tested against
the delta value (i.e. the speed), NOT the value as with the
linear modifier.

#### Random Walk

`new RandomWalk(now, limit, stepSize, percentage = 100)`

This modifier conducts a random walk to the plus and minus
**limit** taking steps no larger than **stepSize**. The step will occur
if a randomly chosen value from o to 100 is below **percentage**.

This modifier is continuous until it is removed.

#### Triangle Wave

`new TriangleWave(now, limit, period)`

Produces a triangular wave form that varies from plus **limit** to
minus **limit** over **period** seconds. The initial movement direction
is positive.

This modifier is continuous until it is removed.

#### Sawtooth Wave

`new SawtoothWave(now, limit, period)`

Produces a sawtooth wave form that rises smoothly from minus **limit**
to plus **limit** over **period** seconds and then return immediately
to the lower value. The initial movement direction is positive.

This modifier is continuous until it is removed.

#### Sine Wave

`new SineWave(now, limit, period, offset = 0)`

Produces a smoothly varying sine wave ranging in value from minus
**limit** to plus **limit** over **period** seconds. The initial
direction is rising towards the upper limit. If the optional
**offset** paramter is present the start of movement will be
delayed by that number of degrees, e.g. an offset of 90 will 
delay the start of movement by 1/4 of the period, and an offset
of 180 will delay the start of movement by half the period. So
for example setting one Adjustable to a plain sine wave and another
to the same period with an offset of 180 puts the two changes
in anti-phase.

This modifier is continuous until it is removed.

#### Square Wave

`new SquareWave(now, limit, period)`

Produces a square wave jumping from plus **limit** to minus
**limit** over **period**. The initial jump is to the upper
value.

This modifier is continuous until it is removed.

#### Constant

`new Constant(now, value)`

This simply returns the constructor **value** on each update. This
can be used to bias any of the other modifier, for example if you want
to have a sine wave that varies between, say 50 and 100 then set up
 a SineWave object with a limit of 25 and add a constant modifier
 of +50.

#### Random Wave

 `new RandomWave(now, valueLimit, timeLimit, shape = "step")`

 At initiation a random value is chosen between 0 and **limit**
 and a random time is chosen between 0 and
 **timeLimit** seconds. When the randomly chosen time has
 elapsed the supplied value will be equal to the randomly
 chosen value.

 The **shape** parameter determines how the values change
 over time - the default "step" makes a single step
 change in value (so the wave form would look a bit like
 a city skyline), the alternative "line" makes a smooth
 straight line transition to the new value (so the wave
 form would like a bit like a mountain range). Other
 options may be added in future.
