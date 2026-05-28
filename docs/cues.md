---
title               : "Slow Glass Animation System Cues"
---

Just like a stage play, a **cue** is a trigger for something to happen on the
stage. Cues are events that cause all the actions listed following the cue to
happen. Cues at the "top level" of the script (within the MAIN scene) will be
automatically enabled, those within scenes will only be active once the scene
performance has started.

At present, cues have a maximum resolution of 1 second, however this might
change to something smaller in the future.

The following types of cue are available.

## Setup / init

This cue is active once only, actions following this cue will be
executed when the scene is first loaded in memory. It can be used to load image
and other resources and any other preparatory work. Note that for this to be
most useful you need to use the **prepare** and **act out** commands, possibly
setting scene variables between the two.

Within an active scene this cue will never be activated again once it has
been run.

## Begin

This cue will be active once, when the scene starts from the **perform** or
**act out** actions and will not be activated again.

Typically start cues are used to place resources on the
canvas, and possibly also making them visible depending on need.

## After

`after {number} {duration}`

This cue is active once, at the given duration after the scene performane
starts.

## Every

`every {number} {duration}`

This cue is active at regular intervals, as given by the duration. It
repeats every interval until the scene is ended.≈

## At

`at hh:mm`

`at hh:mm:ss`

This cue activates once daily, at the specified time. If seconds
are not given it will activate at 0 seconds into the minute.

## Each

`each hh:mm`

`each hh:mm:ss`

This works similar to the **at** cue but allows for one or more
of the digits in the time to be replaced be an asterisk ('*') character.
This means "any value", so for example:

`each **:15:00` will cue at 15 minutes past each hour of the day
(so 24 times per day). Be careful with your asterisks, the pattern:

`each **:15:**` will cue 24 * 60 times - once for each second during
the 15th minute of each hour.

You can use multiple cues for the same actions, so for example:

```
each **:15
each **:30
each **:45
    play church-bells-quarter-hour
each **:00
    start church-bells $HOURS
```

How does `each **:*0` differ from `every 10 minutes`? The former happens
every tenth minute according to the clock time; the latter first happens
10 minutes after its scene is started, and every 10 minutes after that.

## When

`when {logic-expression}`

At least once per second the logic expression is tested and the cue
is activated if the expression evaluates to true. IMPORTANT - once the
cue has been activated the condition will not be checked for at least
one minute.

## OnKey

(To be added)

## AtEnd

This cue is activated when the current scene is stopped (either
by an action in the scene itself or from "outside"). It allows
you to do any clean up or final actions. (This cue will never be
active for the top level scene as it cannot be stopped).
