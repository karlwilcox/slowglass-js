---
title               : "Slow Glass Tags"
---

## Note

This is an advanced feature and hasn't been tested much, there is no
need to read or understand this section, Slow Glass works perfectly
well if you don't use tags at all.

## Creating Tags

Tags can be applied images, scenes, variables and sprites. Each of these items
can have mulitple tags. Tags can be associated with these items in several
different ways:

### Using the Tag Command

`tag scene {scene-name} with {tag}`

`tag sprite {sprite-name} with {tag}`

`tag image {image-name} with {tag}`

`tag variable {variable-name} with {tag}`

The named item will be given the tag. Note that you can only
apply tags to user created variables, not the  built-in ones.

### Setting Default Tags

`with (tag | tags) {tag...}`

Everything that is created from this point in the file will have
the listed tags attached. You can end this with:

`endwith`

### Setting Tags on creation

`sprite create {sprite-name} from {image-name} with (tag | tags) {tags...}`

`sprite create {sprite-name} from {image-name} {#tags...}`

`load {image-name} from {url} with (tag | tags) {tags...}`

You can explicitly say that you are providing tags, or just provide them
with an initial '#' character. The same technique can be used when
creating other types of sprite such as graphics and text.

Additionally, when defining a scene you can just list tags after
the name, so:

`scene my_scene #tag1 #tag2...`

## Selecting By Tags

Tags can be used to select a subset of items based on whether they
have a particular tag.

### Tag Variables

There are built in variables that contain a list of all the names of scenes,
sprites, images and variables. You can restrict this list to items that
have a particular tag by appending the variable with a hash character and
the required tag. For example:

`log ${SPRITES#car}`

Will print to the console the names of all sprites with #car tag.

More usefully perhaps you can do something like:

`choose random_car from ${SPRITES#car}`

`place $random_car at 100 100`

To pick a random item from the tagged subset.

### The Select Command

This works rather rather like the **match** command but instead of a string
match against the name it selects based on a tag.

`select {variable-name} from (sprites | images | variables | scenes) with [(all | any)] (tag | tags) {tags..}`

Will set the content of the named variable to the list of item names which have
at least one of the listed tags (if **any** is used) or all the tags (if **all** is used). The
default behaviour is to select **any**.

## Using Tags

You are free to use (or not use) tags however you wish, and can also combine
them with name matching if you want to. For example you could tag sprites as
the vehicle type and use string matching to select the colour, such as:

`select cars from sprites with tag car`

`match blue-cars to blue from $cars`

Will get you a list of blue cars (assuming tags and naming conventions have been followed).
