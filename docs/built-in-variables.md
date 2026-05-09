---
title               : "Slow Glass Built-in Variables"
---

The Slow Glass scripting language includes variables that are created
automatically - you do not have to use **make** to create them, and their
value may be different each time you use them.

I have adopted the convention that built-in variables are all
upper-case and suggest that you use lower case for all other names.

The following built in variables are supported:

## Current Time Information

- $SECONDS - number of seconds in the current minute (zero padded)
- $MINUTES - number of minutes in the current hour (zero padded)
- $HOURS - number of hours in the current day (24 hour, zero padded)

The following variables conatin a string either "yes" or "no" (this can
be used directly in an IF statement, e.g. `IF $MORNING`.

- $MORNING - between 7 and 12 AM
- $AFTERNOON - between 12 and 5 PM
- $EVENING - between 6 and 9 PM
- $NIGHT - between 10 and 6 AM

(See also $SUNANGLE below)

## Current Date Information

- $DAY - number of the day in the month (zero padded)
- $DAYOFMONTH - same as above
- $MONTH - number of the month (zero padded)
- $YEAR - $ digit year
- $DAYOFWEEK - number of day of the week, Sunday = 1
- $DAYOFYEAR - number of the current day in the year
- $DAYNAME - Name of the day as a string
- $MONTHNAME - Name of the month as a string
- $TIMEZONE - current timezone as a string
- $SEASON - season name for the current hemisphere as a string

Note that the season variable will be set to "autumn", NOT "fall".

Further "yes" / "no" variables:

- $WEEKDAY - Monday to Friday
- $WEEKEND - Saturday or Sunday
- $WINTER - calendar winter for the current hemisphere
- $SPRING - calendar spring for the current hemisphere
- $SUMMER - calendar summer for the current hemisphere
- $AUTUMN - calendar autumn for the current hemisphere
- $FALL - synonym for the above

## Location Information

- $LATITUDE - current latitude, -180 to 180, East positive
- $LONGITUDE - current longitude, -90 to 90 North positive
- $LAT / $LON / $LONG - abbreviations for the above
- $SUNANGLE - a crude approximation of the angle of the sun above\
or below the horizon at this location on this date

The $SUNANGLE built-in variable can be used
for instance to drive the
brightness of the screen. Note that the calculation
only has a resolution of 1 hour so testing it more frequently
is not helpful. Instead, you can use a duration to interpolate
changes over the hour, for example:

`every 1 hour`
`   DARKEN background to ($SUNANGLE * some_factor) in 60 minutes` 

## Timing Information

- $ELAPSED - Number of seconds since the main scene was started
- $MILLIS - number of milliseconds since the main scene was started \
(also effectively, a unique id)

## Randomness

- $CHANCE - a random value between 0 and 1, different every time
- $PERCENT - a random value between 0 and 100, different every time
- $RANDOMX - a random location across the canvas, different every time
- $RANDOMY - a random location down the canvas, different every time

## Drawing Canvas Information

(All of this is subject to change as I'm figuring out how to best
manage scaling for screen and canvas)

- $SCALEX
- $SCALEY
- $CENTREX
- $CENTREY
- $WIDTH
- $HEIGHT

## Scene Information

- $SCENENAME - name of the current scene as a string
- $PARAMETERS - space separated list of words passed to the scene\
in the **start** command
- $PARAMS - abbreviated version of the above

## System Information

- $KEY - the key currently being pressed, or NONE if no key is in use
- $LASTKEY - the last key that was pressed by the user
- $CLICKX - coordinate of the last time the mouse was clicked (TBD)
- $CLICKY - coordinate of the last time the mouse was clicked (TBD)
- $MOUSEX - current coordinate of the pointer, or NONE
- $MOUSEY - current coordinate of the pointer, or NONE

## Resource Information

All of the following contain a space separated list of resource names.

- $VARIABLES - list of all variable names in the current scene
- ${scene-name}:VARIABLES - list of all variables names in the named scene
- $VARIABLES#{tag-name} - list of all variables in the current scene with the named tag
- $SPRITES - list of all sprite names in the current scene
- ${scene-name}:SPRITES - list of all sprite names in the named scene
- $SPRITES#{tag-name} - list of all sprite in the current scene with the named tag
- $IMAGES - list of all image names in the current scene
- ${scene-name}:IMAGES - list of all image names in the named scene
- $IMAGES#{tag-name} - list of all image in the current scene with the named tag
- $SCENES - list of all scene names
- $SCENES#{tag-name} - list of all scene names with the given tag
