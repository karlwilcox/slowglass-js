---
title               : "Slow Glass Expressions"
---

## Conditionals

Conditionals are used at very points in the Slow Glass scripting language,
for example with the **when** trigger, the **if** command and the **until**
/ **while** loops. In accordance with the design principles the conditional
evaluation method is very simple.

### Single Word Conditions

If the condition consists of a single word then it will be treated as a string.
The following string values are assumed to be false:

false, 0, no, 0.0, NONE

Every other string is assumed to be true.

Whilst this might appear rather limited it does tie in nicely with the built-in
variables, so you can do things like:

`if $MORNING`

And things will work as you expect.

### Three Word Conditions

If the condition contains three words then we assume that the first
and third are values and the second word is a comparison operator. The
following comparison oerators are supported:

is, equals, =, ==, !=, <>, >, >=, <, <=

The two values are treated as strings and evaluated against
the comparison using JavaScript evaluation. It most cases you don't
need to worry about data types it should just work as you expect,
strings of digits are compared as numbers, strings are compared
alphabetically and so on.

### Negating the condition

You can prefix one or three word conditions with the word _*not*_.
This simply inverts the result of the comparison.

## Expressions

Anything that is enclosed in round brackets is assumed to an expression
and is replaced by the result of evaluating that expression. Note that
Slow Glass variables are expanded **BEFORE** expression evaluation.

Note the expressions can appear anywhere, not just in conditional
commands, so the following is perfectly legal:

`move sprite_name to (12 * 12) (4 + 4)`

More usefully, since variables are expanded before expressions you 
can do things like:

`darken sprite-name by ($SUNANGLE * 0.5)`

You can also nest brackets to any required depth and they will
treated correctly within an expression.

Slow Glass provides two options for evaluating expressions. The
default is known as the "simple" evaluator.
