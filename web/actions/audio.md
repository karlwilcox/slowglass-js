---
layout: page
sidebar: slow-glass
title               : "Slow Glass Audio Actions"
subtitle         : ""
teaser              : ""
header:
   image_fullwidth  : "headers/slow-glass.jpg"
---

Slow Glass can play sounds to imporove your animation. The available sound commands are as follows:

## Load

`load {filename} [as {name}]`

Slow Glass will identify the file type by its extension, at present .wav and
.mp3 are recognised as audio files. You can give the audio file a name to refer
to it by in later commands, if no name is given then the basename of the file
will be used.

If you have previously used the **from** command to provide a folder name then
this will be preprended to the filename.

Audio files can be re-used any number of times, they do not have to be reloaded.

This command completes immediately.

## Play

`play {name} [fade in {number} [{duration}]] [at volume {level}]`

This will start to play the audio track. You can specify an optional fade in
time, which will be in seconds unless you provide a specific duration. The
volume level can be set between 0 and 100, with a default value of 50.

This command completes either when the track reaches the end or it is stopped by
the user with the **stop** command.

## Stop

`stop (audio | sound | track) {name}...`

Stop playing any number of sounds. It is not an error if the sound isn't playing.

This command completes immediately.

## Volume

`[set] volume [of] {name} [to] {level} [[in] {number} [duration]]`

This sets the volume level of a named audio track to the level given, which takes values of 0 to 100. You can also fade the change over a given duration.

This command completes immediately.

## Future Intentions

I'd like to make the play command complete when the track finishes playing (or
perhaps make this optional?)

I'd also like to change the stop command to the following syntax:

`stop audio {name} [[fade out] [in] {number} [duration]]`

In which case the command will complete when the fade out finishes.
