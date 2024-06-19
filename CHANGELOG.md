## Version 1.0.0 - 2024.006.19

### Updates
* removed default YouTube API key
* `WMPlayer.addTrack` method now accepts duration argument
* YouTube tracks can now fetch title by YouTube Data API (if API key is provided)
* optimized YouTube Data API query
* if YouTube track has not set track duration it'll be set on play
* not having set YouTube API key doesn't set YouTube tracks status to 'error' anymore
* added `playlistDoubleClickSelect` option.
* added `YTAutoload` option.
* YouTube Iframe API is no longer loaded on player creation by default, unless `YTAutoload` is set true.

### Bug fixes

* YouTube track not starting if YouTube Data API key is not defined
* plalist loop is not working properly when YouTube track is the last

---

## Version 0.8.1 - 2019.05.23

### Updates
* you can now pass your own YouTube API key

---

## Version 0.8.0 - 2019.05.22

### Updates
* slight changes to default template and theme
* `WMPlayerEvent` is now WMPlayer's internal class and is renamed to `_Event`
* `WMPlayerModel` is now WMPlayer's internal class and is renamed to `_Model`
* `WMPlayerView` is now WMPlayer's internal class and is renamed to `_View`
* `parent` method accept now string selectors
* `playerClass` method is renamed to `theme`
* theme (player's container class) can be defined in config options

### Bug fixes

* IE9: changing player's theme class sometimes merge player's main class and status class

---

## Version 0.7.3 - 2018.02.05

### New features

* added playerClass method
* added dark theme

### Bug fixes

* problems with assigning duration to playlist item, when url is a relative path to parent directory

---

## Version 0.7.2 - 2018.02.04

### New features

* added method chaining

---

## Version 0.7.1 - 2018.02.03

### Bug fixes

* IE9: class can be added multiple times to player's body
* IE9: if className contains multiple identical classes, only first one will be removed

---

## Version 0.7.0 - 2018.02.03

### New features

* added support for YouTube videos

---

## Version 0.6.4 - 2017.10.24

### New features

* added `destroy` method

### Bug fixes

* after using `parent` method with JQuery, player hasn't changed storing element

---

## Version 0.6.3 - 2017.10.17

Initial distributed version
