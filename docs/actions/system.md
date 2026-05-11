---
title               : "Slow Glass System Commands"
---

Slow Glass supports a number of system commands. Typically you won't need these but they may be
useful for debugging or for advanced use.

## Console Messages

`(log | print) {text}...`

The text is written to the JavaScript console.

This command completes immediately.

## Finish

`Finish`

Rather abruptly just stop the app.

No further completion events happen.

## Get

`get {variable-name} from URL`

The value of the given variable name will be set to the content returned
by the HTTP GET method of the given URL, or to NONE if the URL is not
available. Each line of the content will be placed into an array
member of the variable, with the key being a numeric line number.

For example, this could be used to query a Raspberry Pi equipped
with sensors to get information such as the current temperature.

## Future Intentions

I'd like to add the following commands:

`post [to] {URL} {variable-name}...`

Generates a POST command to the given URL where the form content is of the form:

variable-name: variable-value

and so on, for each given variable name

The intention of this command is to pass requests to external services, for example I'd like to set up a web service on a Raspberry PI to flash some LEDs or run some motors to accompany the animation.

This command completes immediately.

`send [to] {URL} {text}...`
