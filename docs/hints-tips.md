---
title               : "Hints and Tips"
---

## Seasonal Variation

If you want to do different things in your animation based on the local season
there are two methods.

The built-in variable $SEASON expands to the name of the current season, so can
be used, for example, in the filename for an image to be loaded:

```
load backdrop-${SEASON}.png as background
put background as background
```

Alternatively you can test the value of the four season variables, e.g.:

```
if $WINTER is true
    start snow-scene
```
