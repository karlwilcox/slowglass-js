---
title               : "Slow Glass Scripting Language Overview"
---

## Overall Structure

Slow Glass is fairly flexible in the organisation and structure of the text files 
containing the script, but I suggest the following guidelines for ease of use.

### Description

I suggest that you start each file with a **description** / **enddescription** pair
of directives, with a free-format explanation of the file between them.

### Options and Directives

This should be followed by any directives that affect the whole of the file, so
things like **display height** and **display width**, along with any **option**
directives.

### Main Scene

The main scene then follows, that is a sequence of triggers and actions that
constitute the "top level" of the script. These will be automatically enabled
when the script starts to run and the triggers will start being checked for
activation. For simple scripts this may all that is needed.

### Additional Scenes

You can now define as many addtional scenes as you need, starting each
scene with `scene {name}` and ending it with `end scene`. Scene names
should be unique (re-used names will overwrite existing scenes).

#### End File

The file can be finished with `end file`, which will cause all
subsequent content to be ignored, or you just end the file as
normal.

## Scene Structure

Each scene, including the top level main scene is structured in the
same way - as a set of grouped lines. Each group consists of
one or more triggers, followed by one or actions, each on a separate
line. It can be helpful to indent lines to show the hierarchy, for
example here are two groups, indicated by horizontal lines:

```
scene {name}
---------------
    trigger-1
        action-1 for trigger-1
        action-2 for trigger-1
---------------
    trigger-2
    trigger-3
        action-3 for trigger-2/3
        action-4 for trigger-2/3
---------------
end scene
```

To make things even more obvious you can use marker directives
like this:

```
scene {name}
    trigger
        trigger-1
    actions
        action-1
        action-2
    triggers
        trigger-2
        trigger-3
    action
        action-3
end scene
```

All of the actions in a group will be executed if a trigger is activated.

Note that in most cases the ordering of these groups doesn't matter. At
regular intervals the program will check all of the triggers and it any
of them are active it will execute the attached actions. You should
however be aware that this checking of triggers happens in the order
that they appear in the file, so take care if you are relying on
side effects (like setting the value of variable) to "communicate"
between groups of actions.

### Multiple Triggers

If there is more than one trigger in a group you can control whether
the actions are executed if **any** trigger is activated, or if they
will be executed only if **all** the triggers are activated. This
requires the presence of the marker directive for triggers:

```
scene {name}
---------------
    trigger on all 
        trigger-1
        trigger-2
    action-1
    action-2
---------------
    trigger on any 
        trigger-3
        trigger-4
    action-3
    action-4
---------------
end scene
```

The default behaviour is to execute the actions when **any**
trigger is activated.

Care should be taken with the **all** case to make sure that
the triggers are not mutually exclusive and will never happen
together!

## Command Completion

We also need to understand the concept of command completion.
Some actions complete as soon as they are executed, for example
the **place** command. Others commands start a process that may
end some time later, for example the commands that change
sprite location or appearance over time. This is an important
concept for the timing commands discussed elsewhere.

It should be noted that some actions start on-going activities that don't have
a defined "end", these actions are deemed to have completed as soon as they
start and don't contribute towards the various timing and synchronisation
commands. In the documentation for actions the completion event is shown for
each action.

## When