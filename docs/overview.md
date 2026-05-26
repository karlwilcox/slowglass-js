---
title               : "Slow Glass Scripting Language Overview"
---

## Overall Structure

A Slow Glass file is just plain text - it is fairly flexible in the
organisation and structure of the files containing the script, but I suggest
the following guidelines for ease of use.

### Description

I suggest that you start each file with a **notes** / **endnotes** pair
of directives, with a free-format explanation of the file between them.

### Options and Stage Directions

Following that I would group together all the options that affect the whole
file, so things like **stage height** and **stage width**, along with any
**option** directives.

### Main Scene

The main scene then follows, that is a sequence of cues and actions that
constitute the "top level" of the script. These will be automatically enabled
when the script starts to run and the cues will start being checked for
activation. For simple scripts this may all that is needed, in which case
you don't need to name the scene, just provide the cues and actions.

### Additional Scenes

However, for more complex scripts you will likely benefit from breaking things
down into individual scenes, you can define as many addtional scenes as you
need, starting each scene with `scene {name}` and ending it with `end scene`.
Scene names should be unique and must contain at least one letter (re-used
names will overwrite existing scenes).

#### End File

The file can be finished with `end file`, which will cause all
subsequent content to be ignored, or you just end the file as
normal.

## Scene Structure

Each scene, including the top level main scene is structured in the
same way - as a set of grouped lines. Each group consists of
one or more cues, followed by one or actions, each on a separate
line. It can be helpful to indent lines to show the hierarchy, for
example here are two groups, indicated by horizontal lines:

```
scene {name}
---------------
    cue-1
        action-1 for cue-1
        action-2 for cue-1
---------------
    cue-2
    cue-3
        action-3 for cue-2/3
        action-4 for cue-2/3
---------------
end scene
```

To make things even more obvious you can use marker directives
like this:

```
scene {name}
    cues
        cue-1
    actions
        action-1
        action-2
    cues
        cue-2
        cue-3
    action
        action-3
end scene
```

All of the actions in a group will be executed if a cue is activated.

Note that in most cases the ordering of these groups doesn't matter. At
regular intervals the program will check all of the cues and it any
of cue conditions are met it will execute the attached actions. You should
however be aware that this checking of cues happens in the order
that they appear in the file, so take care if you are relying on
side effects (like setting the value of variable) to "communicate"
between groups of actions.

### Multiple Cues

If there is more than one cue in a group you can control whether
the actions are executed if **any** cue condition is met, or if they
will be executed only if **all** the cues conditions are met. This
requires the presence of the marker directive for cues:

```
scene {name}
---------------
    cue on all 
        cue-1
        cue-2
    action-1
    action-2
---------------
    cue on any 
        cue-3
        cue-4
    action-3
    action-4
---------------
end scene
```

The default behaviour is to execute the actions when **any**
cue is activated.

Care should be taken with the **all** case to make sure that
the cues are not mutually exclusive and will never happen
together!

## Action Completion

We also need to understand the concept of action completion.
Some actions complete as soon as they are executed, for example
the **place** action. Others actions start a process that may
end some time later, for example the actions that change
sprite location or appearance over time. This is an important
concept for the timing actions discussed elsewhere.

It should be noted that some actions start on-going activities that don't have
a defined "end", these actions are deemed to have completed as soon as they
start and don't contribute towards the various timing and synchronisation
actions. In the documentation for actions the completion event is shown for
each action.
