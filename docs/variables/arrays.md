---
title               : "Slow Glass Array Variables"
---

The Slow Glass scripting language includes support for associative arrays.
This is an advanced topic that is really aimed at programmers, who will
find much of the syntax and usage here familiar.

## Creating an Array Variable

Array variables are created just like normal variables but also include
a key value:

`(let | make) {variable-name}[{key-value}] be {value}`
 
You can then access the array element in the usual fashion:

`log ${my_var[key_string]}`

Key values can be anything, including numbers if you wish, and they do not
have to be contiguous.

You can also delete a single array value in a similar way:

`delete ${my_var[key_string]}`

## Array information

You can access information about an array by accessing its propertites:

`${variable-name}.length`

returns the number of items in the array (1 based).

`${variable-name}.keys`

returns the keys of the array as a single text, each key separated by spaces. There is no
guaranteed ordering for the keys. If you want to step through an array you can use something
like:

`for key in $my_array.keys`
`   log ${my_array[$key]}`
`endfor`

Similarly you can get a list of array elements with:

`