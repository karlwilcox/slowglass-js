---
title               : "Slow Glass Sprite Variables"
---

The Slow Glass scripting language includes variables that provide information
about sprite properties. The variable name is the name of the sprite (hence
do **NOT** use the same naming scheme for your variables and sprites!)

## Size and Position

- ${sprite-name}.x - current x coordinate of the centre of the named sprite
- ${sprite-name}.y - current y coordinate of the centre of the named sprite
- ${sprite-name}.loc.x / ${sprite-name}.pos.x etc. - variations of the above
- ${sprite-name}.z - current depth of the named sprite
- ${sprite-name}.depth - variation of the above
- ${sprite-name}.sx - width (size in x) of the named sprite
- ${sprite-name}.size.x / ${sprite-name}.width - variations of the above
- ${sprite-name}.sy - height (size in y) of the named sprite
- ${sprite-name}.size.y / ${sprite-name}.height - variations of the above
- ${sprite-name}.angle - rotation angle of the named sprite

Note that all of the above (except the depth) may be in the process of
changing so the value is not guaranteed to be consistent outside of the
current group of triggered actions.

## Appearance

- ${sprite-name}.visible - "yes" / "no" string if visible 
- Others TBD

## Other

- ${sprite-name}.role - if the sprite has been **put** in a particular role this\
variable will contain the name of that role, e.g. "background"

## More

TBD...
