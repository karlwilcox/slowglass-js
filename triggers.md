---
layout: page
sidebar: slow-glass
title               : "Slow Glass Animation System"
subtitle         : ""
teaser              : ""
header:
   image_fullwidth  : "headers/slow-glass.jpg"
---


Triggers are events that cause all the actions following the trigger to happen. Triggers at the "top level" of the script will be automatically enabled, those within scenes will only be active once the scene has started.

At present, triggers have a maximum resolution of 1 second, however this might change to something smaller in the future.

The following types of trigger are available.

## Start

This takes no arguments. The actions following this trigger will be carried out as soon as the trigger is encountered. So for triggers at the top level this means as soon as the program starts to run; for triggers within scenes it means as soon as the scene is enabled through the use of the "start" command. (Strictly speaking, as per the note on resolution above, they will start sometime within the next second, as it ticks over on the clock).

Typically start triggers are used to load resources and place in the scene, and possibly also making them visible depending on need.

## After

## Every

## AtTime

## OnKey

(To be added)

## OnGpio

## OnIR

## OnI2C


