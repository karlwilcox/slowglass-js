---
title               : "Slow Glass Timing Commands"
---

Slow Glass supports a number of ways to link actions or to synchronise
their timings. The most straightforward is **then**, the other commands
should probably be considered as advanced.

## Then

This is quite straightforward, it just pauses the actions in this group until
ALL the previous actions have completed. As discussed in the overview, most
commands complete immediately, but some things, like loading images, moving
sprites in to a location at a particular speed and so on take an indeterminate
time to actually happen.

Using the **then** command will ensure that everything is finished before
the next command is executed. Consider the example:

```
begin
    load truck.png as truck
    place truck at 100 100
    move truck to 800 100 at 37 pixels per second
then
    play beep-horn
```

Hopefully this sequence of actions is fairly readable - drive the truck across the screen,
and once it arrives it beeps the horn!

Note that this command only stops the current action group (i.e. the set of
actions that belong to a particular trigger). All other action groups
and scenes will continue processing. You can use **then** as many times
as you like to string together a sequence of actions.

## Pause

`pause [for] {number} [{duration}]`

This command starts a timer running for the specified duration.

The command completes when the timer expires.

The purpose of this command is to insert
specific delays between actions, for example the structure here:

```
...do things...
pause 3 seconds
...do more things...
```

Will ensure that all the first set of things complete, wait for 3 seconds and then
start executing more things.

## Wait

This command is similar to **then** but instead of waiting for previous
commands to complete the conditions for restarting can be more
complex.

`wait (until | while) {logical-expression}`

With the **until** keyword this command pauses execution until the
logical expression evaluates to true. The **while** keyword does
something and pauses execution for as long as the expression
evaluates to true.

See the page on logic expressions for more examples of this.

Note that the built-in variable $FINISHED also provides information
about the status of previous tasks, hence the **then** command is
exactly equivalent (but much shorter) to:

`wait until $FINISHED`

## Timing Accuracy

At present suspended actions are checked for updating at a minimum
of every 500ms (twice per second), hence you should not assume
a granularity better than one second.

This may change in the future.
