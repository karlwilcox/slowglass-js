---
layout: page
sidebar: slow-glass
title               : "Slow Glass System Commands"
subtitle         : ""
teaser              : ""
header:
   image_fullwidth  : "headers/slow-glass.jpg"
---

Slow Glass supports a number of system commands. Typically you won't need these but they may be
useful for debugging or for advanced use.

`wait {number} [{duration}]`

This command starts a timer running for the specified duration.

The command completes when the timer expires.

The purpose of this command is to work in conjunction with the **then** trigger to insert
specific delays between actions, for example consider the script:

```
begin
    load truck.png as truck
    place truck at 100 100
    move truck to 800 100 at 37 pixels per second
then
    wait 3 seconds
then
    play beep-horn
```

Hopefully this sequence of actions is fairly readable - drive the truck across the screen,
after it arrives wait 3 seconds, then beep the horn!

`(log | echo) {text}...`

The text is written to the JavaScript console.

This command completes immediately.

`Finish`

Rather abruptly just stop the app.

No further completion events happen.

## Future Intentions

I'd like to add the following commands:

`post [to] {URL} {variable-name}...`

Generates a POST command to the given URL where the form content is of the form:

variable-name: variable-value

and so on, for each given variable name

The intention of this command is to pass requests to external services, for example I'd like to set up a web service on a Raspberry PI to flash some LEDs or run some motors to accompany the animation.

This command completes immediately.

`send [to] {URL} {text}...`
