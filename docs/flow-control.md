---
title               : "Slow Glass Flow Control"
---

Within a trigger, actions will normally be carried out one after another in
sequence. Sometimes we might want to repeat things, or do things only
under certain conditions. Slow Glass provides several means of doing this
but they are deliberately kept quite simple.

## Conditional Execution

`if {condition}`

`endif`

This is quite straight forward, it the condition looks like something that
is "true" (see the section on [/docs/expressions.html](expressions) for full
details) then the lines between **if** and **endif** are excuted. If the
condition is false they are not.

Note that the lines beween these commands can only be other commands (not
triggers or directives), but it can include other if conditions, you can
next them to any depth that you like.

At the moment there is no **else** clause, you can just test the "other"
version of the condition in a separate statement.

## For Loops

`for {var-name} in {values...}`

`for {var-name} range {N..M}`

`endfor` / `next`

This command will run the actions between the **for** and **endfor* lines
several times, each time the named variable will take a new value. In
the first form the values are a list of space separated words (but you can
combine words by putting them within quotation marks).

In the second version the values will run from N to M where both are integers
and M is larger than N.

For loops can also be nested to any required depth but be sure to use
different variable names for each loop.

## Repeat loops

If you just want to do something a number of times or until a
particular you can use these commands.

`repeat`

`until {condition}`

`while {condition}`

This will run the actions between **repeat** and **until / while**
and then evaluate the condtion. With **until** the actions
will be repeated until the condition becomes true (i.e. as long
as the condition is false); with **while**
it will repeat as long as the condition is true.

Repeat loops can be nested as many times as you like.

## Combining Flow Control

As noted above, flow control commands cen be nested to any depth. They can
also be combined in any way that you need, however recall that one of the
design goals of Slow Glass is simplicity, so very complex, deeply nested
code is probably not helpful!

## A Note on Starting Scenes

If you start a scene within a loop this will try to start a new scene
so  you need to give it a new name each time (perhaps by using the 
loop counter in the name).
 
