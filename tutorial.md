---
layout: page
sidebar: slow-glass
title               : "Slow Glass Animation System"
subtitle         : ""
teaser              : ""
header:
   image_fullwidth  : "headers/slow-glass.jpg"
---


# Getting Started

It is convenient to keep all slow glass resources in a folder for each project so lets do that now and create a folder called "tutorial".

In the folder create a file "script.txt" and open it in your favourite text editor. Let's start creating an animation!

## Comments

Lets add a comment first, so we can keep notes and remind ourselves what we are doing. The simplest comments are introduced by the hash character. Any line with a hash as the first non-space character is ignored, so lets add the line:

```
# This is a slow glass script file
```

## Setting up the display

Slow glass has defaults for most things but let's set the dimensions of our window ourselves. In this case lets have something in landscape (after all, we are going to do a landscape!), so enter the lines:

```
display width 1024
display height 768
```

Lines are significant in slow glass, every thing must be on a line of its own, but blank lines and any line that only contains punctuation characters is ignored (so you can use lines of dashes to separate things for example).

## Creating a background

Adding resources to our slow glass animation is a two stage process, we need to load the resource, then place it somewhere. (This is helpful, since it means we can place the same resource in more than one place).

 Actions only happen in slow glass when they are triggered. In this case we want to load our background resource at program start up, so we need to use a "begin" trigger. Add the following lines:

```
begin
    load fields.png as fields
    place fields at $CENTERX,$CENTREY,1000 size $WIDTH,$HEIGHT
```




