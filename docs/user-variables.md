---
title               : "Slow Glass Variables"
---

The Slow Glass scripting language supports the use of variables to
contain changing information.

Variables are included in scripts by prefixing the name with a dollar
sign ($). Names can be any combination of letters and underscore
characters. If you want to "isolate" the name from other content
on the line you can surround the name with curly braces { }.

`echo $my_var ${my_var}suffix`

## Understanding Variables

It is best not to think of variables as just "something to hold a value"
(which is what most programming languages require). In  Slow Glass a
variable acts more like a "macro" in that the text content of the
variable is inserted into the command, which will then be executed.

Hence variables don't have "types" as such, they just hold text that will be
inserted into the current command and the command processor itself will
interpret the text as a number, variable name or whatever.

Indeed you can put an entire command into a variable (if you seriously
want to confuse yourself). Consider:

`make command be echo hello world`

`$command`

These two lines are a roundabout way of printing "hello world" to the
console.

Finally note that variables are expanded into text **before** any expressions
are evaluated, variables are NOT handled by the expression evaluator,
which will just see the text content of the variable.

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

You can randomly assign values from a list provided:

`choose {variable-name} [from] {list...}`

This will create (or overwrite) a variable with the given
name and set the value randomly to one of the items from
the space-separated list.

You can also select all items from a list that contain a given word:

`match {variable-name} to {search-word} [at (start|end)] from {list...}`

This will create (or overwrite) a variable with the given
name and set the value to the matching items from the
space-separated list, joined back together with spaces. If
there are no matches then the value will be set to the
default "not found" value.

You can set a variable to the result of an HTTP GET request:

`get {variable-name} from URL {url}`

The variable will be set to the text content returned by the URL. If the
request fails the variable is set to the default "not found" value.

This command completes when the request has finished, so use a **then** trigger
for actions that need the fetched value.

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
