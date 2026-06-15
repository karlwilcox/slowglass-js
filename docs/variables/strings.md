---
title               : "Slow Glass String Handling"
---

All Slow Glass variables are treated as strings (at least for the
purpose of substituting them into actions or expressions). The
language provides some basic string manipulation commands as
follows

## String Creation

`string \[create\] {variable-name} as {text...}`

This is exactly equivalent to the following:

`let {variable-name} be {text...}`

And is provided purely as a convenience function.

## Changing Case

`string \[create\] {variable-name} from (upper | lower | title) \[case\] {text...}`

The variable {variable-name} is created from the supplied text, converted
to all upper case, all lower case, or all title case (first letter of each
word capitalised).

## Selecting Characters from Text

`string \[create\] {variable-name} from character {position1} \[to {position2}] of {text...}`

The variable {variable-name} is created from either a single character of the text
at {position1} or from {position1} to {position2} inclusive. Both positions are one
based (i.e. the first character of the text is in position 1).

## Repeating Strings

`string \[create\] {variable-name} from repeat {text} {number} \[times\]`

The variable {variable-name} is created from the supplied text, by
repeating it {number} times.

## Substituting Text

`string \[create\] {variable-name} by replacing {text1} with {text2} in {text...}`

The variable {variable-name} is created from the supplied text, but each
occurence of {text1} is replaced by {text2}. Wildcards are not supported.
