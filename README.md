Pebbos
======

A simple [Pebble.js](http://pebble.github.io/pebblejs) app that allows you to control your Sonos speakers with your Pebble.

Since getting a Pebble in Aug 14 and being a developer I wanted a little project to work on and especially with the introduction and ongoing work with the JS framework and my love of Sonos I thought it would be great little app to work on.

Main inspiration for this was [Sobble](https://github.com/owlandgiraffe/Sobble) which uses the old SimplyJS framework, not being a JS developer I wanted to really simplify the code and add in a settings page instead of sniffing the Sonos IP address via numerous HTTP calls. Their solution is really quite elegant and if my JS chops were upto scratch and more involved with AngularJs & EmberJs I would probably understand it a lot more than I do now!

### Features

- Lists all Sonos speakers
- Takes into account grouped speakers and only returns the main controller
- Play/Stop
- Next/Previous
- Volume Up/Down
- Enter IP address of a Sonos speaker on your network

### Installation

You should be able to install the app by cloning the repo and "building" the app via the sdk from the command line. Check out the [official docs](https://developer.getpebble.com/2/additional/pebble-tool/) on getting it setup on your system and building & installing the app on your watch.

### Links

Some great articles and existing solutions:

- https://github.com/owlandgiraffe/Sobble
- https://github.com/phil-lavin/sonos
- http://mattwel.ch/tag/sonos/
- https://github.com/rahims/SoCo
- http://nthn.me/posts/2014/sonos.html

### Improvements

Any ideas for improvements or you think it's missing something, let me know!

### Issues

Any issues feel free to comment or do a PR