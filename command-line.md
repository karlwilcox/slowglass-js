---
layout: page
sidebar: slow-glass
title               : "Slow Glass Animation System"
subtitle         : ""
teaser              : ""
header:
   image_fullwidth  : "headers/slow-glass.jpg"
---


Slow Glass is currently invoked from the command line, e.g.

```
python3 src/main.py
```

## Command Line Options

The following arguments are supported:

```
-h num
--height=<num>
-w <num>
--width=num
```

These set the window size for the display

```
-f
--fullscreen
```

These cause the window size options (if any) to be ignored and the full area screen is used


```
-d <dir>
--dir==<dir>
```

Causes the program to look for the script file in the named directory. The default location is "data" in the current directory. The default name for the script file is `script.txt`. (Hence, with no arguments the program will try to execute the script `data/script.txt').

## Additional arguments

If there are any arguments remaining (i.e. without an initial '-') the program applies the following logic:

1. If the argument matches an existing directory it behaves as if the -d dir option had been used
2. If the argument matches a text file then:
  * that file is used as the script file source
  * If no directory has been given then the containing folder is used as the data directory
3. Otherwise an error is generated

Hence if you want to use a script file from one place with data from another you need to use the following command line options:

```
python3 main.py --dir=/path/to/data /path/to/script-file
```

## Planned options

Things that might be usefully implemented are listed here as placeholders

```
-t <time>
--time=<time>
```

Pretend that the time is actually <time> instead of the actual clock time (i.e. apply an offset from the current time)

```
-s <num>
--speed=<num>
```

Adjust the rate at which the program plays...? Might be useful for debugging but very fast speedups might not be possible due to the processing needed between frames (or perhaps speed is actually the factor "frames per framerate"...?)

Further suggestions are welcome.


