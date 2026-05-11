---
title               : "Slow Glass Animation System"
---


Triggers are events that cause all the actions following the trigger to happen.
Triggers at the "top level" of the script will be automatically enabled, those
within scenes will only be active once the scene has started.

At present, triggers have a maximum resolution of 1 second, however this might
change to something smaller in the future.

The following types of trigger are available.

## Begin

This takes no arguments. The actions following this trigger will be carried out
as soon as the trigger is encountered. So for triggers at the top level this
means as soon as the program starts to run; for triggers within scenes it means
as soon as the scene is enabled through the use of the "start" command.
(Strictly speaking, as per the note on resolution above, they will start
sometime within the next second, as it ticks over on the clock).

Typically start triggers are used to load resources and place them in the
scene, and possibly also making them visible depending on need.

## After

`after {number} {duration}`

## Every

`every {number} {duration}`

## At

`at hh:mm`

`at hh:mm:ss`

This trigger activates once daily, at the specified time. If seconds
are not given it will activate at 0 seconds into the minute.

## Each

`each hh:mm`

`each hh:mm:ss`

This works similar to the **at** trigger but allows for one or more
of the digits in the time to be replaced be an asterisk ('*') character.
This means "any value", so for example:

`each **:15:00` will trigger at 15 minutes past each hour of the day
(so 24 times per day). Be careful with your asterisks, the pattern:

`each **:15:**` will trigger 24 * 60 times - once for each second during
the 15th minute of each hour.

You can use multiple triggers for the same actions, so for example:

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

At least once per second the logic expression is tested and the trigger
is activated if the expression evaluates to true. IMPORTANT - once the
trigger has been activated the condition will not be checked for at least
one minute.

## OnKey

(To be added)

## AtEnd

This trigger is activated when the current scene is stopped (either
by an action in the scene itself or from "outside"). It allows
you to do any clean up or final actions. (This trigger will never be
active for the top level scene as it cannot be stopped).
