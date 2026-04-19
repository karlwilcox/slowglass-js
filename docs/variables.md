---
layout: page
sidebar: slow-glass
title               : "Slow Glass Variables"
subtitle         : ""
teaser              : ""
header:
   image_fullwidth  : "headers/slow-glass.jpg"
---

The Slow Glass scripting language supports the use of variables to
contain changing information.

Variables are included in scripts by prefixing the name with a dollar
sign ($). Names can be any combination of letters and underscore
characters. If you want to "isolate" the name from other content
on the line you can surround the name with curly braces { }.

`echo $my_var ${my_var}suffix`

## Creating Variables

You define variables with the let or make command

`(let | make) {variable-name} [be] {value...}`

This will create (or overwrite) a variable with the given
name and set the value to the remaining content of the line
(including any spaces).

You can also assign multiple variables at the same time with the command:

`assign {variable-name1} {variable-name2}... as {value1} {value2}...`

This is useful to save space for multiple assignments but can also be
combined with the built-in variable _*PARAMETERS*_ which can be passed
to a scene with the **start** command, for example:

`start traffic 50 medium`

Will cause the variable _*$PARAMETERS*_ within the scene named "traffic"
to have the value:

`50 medium`

You can assign these values to variables like this:

`assign density volume as $PARAMETERS`

and _*$density*_ will be 50 and _*$volume*_ will be 'medium'.

Finally, you can also randomly assign values from a list provided:

`choose {variable-name} [from] {list...}`

This will create (or overwrite) a variable with the given
name and set the value randomly to one of the items from
the space-separated list.

## Updating Variables

The same command will update variable values, but remember
that the $ symbol will cause the value to be used, NOT the
name, so to update a value use a structure like:

`let my_var be 1`

`let my_var be ($my_var + 10)`

The content in round brackets will be assumed to be an expression
and will be replaced by its evaluated result - see LINK NEEDED.

There are also convenience functions provided for common operations:

`(increment | decrement) {variable-name}`

Which will increase or decrease the variable provided it looks like a number.

## Variable Expansion

Variables are expanded (i.e. replaced by their value) when it
most makes "sense" to do so. In general:

- If the variable is included on a command / action line it will be expanded
  when the action is triggered.

- If the variable is included on a trigger line it will be expanded each
time that the trigger is tested.

- Do **NOT** use variables on directives, these are read once when the
script is created and so no variables will yet have been created.

## Built-in Variables

Slow Glass also includes some built-in variables that you do not need
to create (and you cannot overwrite). They are expanded exactly the
same way as variables that you define yourself, however I have
adopted the convention that built-in variables are all upper-case,

## Sprite Properties

