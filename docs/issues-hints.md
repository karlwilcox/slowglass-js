---
title               : "Slow Glass Issues and Hints"
---

## Known Issues

Slow Glass started simple but is starting to collapse under its own
complexity, especially as regards the main action processing loop
which is a mass of special cases and unexpected side effects and
really needs a complete rewrite.

Some of the issues that I have noticed (with any workarounds I have
found) are listed here.

### Creating and Placing a Group Within the Same Cue

If you create and then try to place it in the same list of
actions (i.e. under the same cue) then
takes on a wild size, thousands of times too big. Don't know why.

Create the group in one cue (e.g. under **setup**)
and place it in another (e.g. under **begin** or just use
**after 1 second**.

### Starting Scenes and Accessing Scene Variables

You cannot start a scene and access its variables _*unless*_ the
variable is created in either of the **setup** or **begin** cues of
the newly started scene.

Variables that are created, or have their values modified once
the new new scene is running may or may not be available to
external programs, depending on the relative timings. It is
best not to rely on side-effects using external variable access.
