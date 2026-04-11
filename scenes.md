---
layout: page
sidebar: slow-glass
title               : "Slow Glass Animation System"
subtitle         : ""
teaser              : ""
header:
   image_fullwidth  : "headers/slow-glass.jpg"
---


It is possible to group script actions into named “scenes”. Actions within the scene will only be carried out when the scene is started by another action.

## Creating Scenes

To create a new scene add the following to your script, on a new line:

`Scene <name>`

This can be followed by any number of triggers, conditions and a actions that will form part of the scene.

To end a scene, just start a new one, or put on a line on its own:

`Endscene`

(Any actions that are not within a named scene will be part of the “top level” set of actions and run automatically).

## Running Scenes

Any actions that are NOT in a scene will be run automatically at program start up, we refer to these as "top level" actions. 

Actions within a scene are not started until a specific command is given, for example, if we have a scene 'church-bells' which moves a bell image and plays a sound we can use the following code at the top level:

```
every 15 minutes
    start church-bells
```

Scenes can be stopped with the corresponding command:

`stop church-bells`

Or alternatively a scene can stop itself with actions such as:

```
after 30 seconds
    stop
```

If there are other actions needed at the end of the scene make sure that they are placed *before* the stop command, otherwise they will never be executed.

Any sprites created by the scene will automatically be removed when the scene is stopped, however any sounds currently playing will continue to do so until the normal end of the sound file.

## Loading Images and Sounds

You can safely repeat `load` commands inside scenes, a repeated load does NOT cause the resource to be re-opened. If the resource tag is already present then no action is taken.

If you want to override this behaviour (for example, if you have an infrequently used scene that uses large resource files) you can explicitly remove images and sound files using:

`unload resource-tag`

This should be placed under the same trigger that stops the scene, before the stop command. Next time the scene is run the resource will be reloaded.

## Resource Tags

It is safe to re-use resource tag names in different scenes as they will silently have the scene's own tag and a colon prefixed to them, hence the tag "cloud" within the scene "rainy-sky" can be safely used alongside the same tag in the "sunny-sky" scene, each reference to the tag will be restricted to that in the named scene.

It is also possible to refer to resources loaded at the top level within scenes, just use their usual tag names. The program will look first for local tags (within the scene), then top level tags. Hence local tags will "hide" top-level tags - if you really want to access a top-level tag that is hidden by a local one (not a recommended practice!) this can be done by putting a colon (:) in front of the tag name.

The pre-fixing of scene names means that it is also possible to refer to resource tags from other scenes, for example we can say:

`
hide sunny-sky:cloud
`

from within the rainy-sky scene; although I recommend only very careful use of this - if the other scene isn't running its resources will not be accessible.


