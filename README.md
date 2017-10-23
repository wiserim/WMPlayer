# WMPlayer

Customizable HTML5 web music player.

WMPlayer features:
* **Dynamic playlist** - create and edit your playlist on the fly,
* **Full player control** - play, pause, stop, fast-forward/rewind, next/previous song, volume, autoplay, loop and more,
* **Easy, dynamic docking system** - WMPlayer can be dynamically placed anywhere on page, just designate it's parent node,
* **Simple UI** - WMPlayer goes with default 
* **Customizable appearence** - If you don't like default UI, you can easily change player's template with HTML,
* **JQuery support** - player can be used with JQuery 1.7+, or pure JavaScript,
* **Cross browser** - player is compatible with IE9+, Edge, Firefox, Chrome, Opera, and mobile browsers,


## Getting Started

**HTML**
```html
<!--Add if you want to use default template-->
<link rel="stylesheet" type="text/css" href="WMPlayer.css"/>
<script src="WMPlayer.min.js"></script>
<div id="player">Your player goes here</div>
```

**Plain JavaScript**
```javascript
var playersContainer = document.getElementById('player');
var WMPlayer = new WMPlayer({
  parent: playersContainer,
  playlist: [
    {
      title: 'Song 1',
      url: 'song1.mp3'
    },
    {
      title: 'Song 2',
      url: 'song2.mp3'
    }
  ],
  start: true
});
```

**JQuery**
```javascript
$('#player').WMPlayer({
  playlist: [
    {
      title: 'Song',
      url: 'song.mp3'
    }
  ],
  start: true
});
```

## Options

|Option|Type|Default|Description|
|---|---|---|---|
|parent|node/JQuery selector|Script's parent node|Sets player's parent.|
|parentAsTemplate|boolean|false|Take parent's content as player's template.|
|template|string/node/JQuery selector|Default template|Sets player's template. See [Custom templates](#custom-templates) for more informations.|
|playlistPattern|string|Default pattern|Sets playlist pattern. See [Custom templates](#custom-templates) for more informations.|
|controls|object|false|Sets classes of player's interactive elements. See [Custom templates](#custom-templates) for more informations.|
|autoplay|boolean|false|Sets autoplay.|
|loop|boolean|false|Sets playlist loop.|
|volume|float [0-1]|1|Sets player's volume.|
|mute|boolean|false|Sets player's mute.|
|playlist|array|[]|Sets player's playlist. Playlist has forem: [{title: 'Song title', url: 'Song URL'}, ...]|
|showPlaylist|boolean|true|Sets player's playlist visibility.|
|start|boolean|false|Run player.|

## Methods
Methods can be called depending on how you initialized WMPlayer:

**Plain JavaScript**
```javascript
    var player = new WMPlayer();
    player.addTrack('Song', 'song.mp3');

```

**JQuery**
```javascript
    $('player').WMPlayer();
    $('player').WMPlayer('addTrack', 'Song', 'song.mp3');
```

|Method|JQuery|Arguments|Description|
|---|---|---|---|
|WMPlayer(config)|$(element).WMPlayer([config])|config : object/node/JQuery selector|Initializes WMPlayer. If provided node/JQuery selector, sets players'parent. See [options](#options) for more information.|
|start()|$(element).WMPlayer('start')|none|Run player.|
|addTrack(url, [title = 'N/A'])|$(element).WMPlayer('addTrack', url, [title = 'N/A'])|url : string, title: string|Add audio track to playlist|
|removeTrack([index])|$(element).WMPlayer('removeTrack', [index = last playlist element])|index : int|Removes position from playlist. Last playlist element is removed by default.|
|track(index)|$(element).WMPlayer('track', [index])|index : int|Play playlist element. First playlist element is played by default.|
|nextTrack()|$(element).WMPlayer('nextTrack')||Set next track as current.|
|previousTrack()|$(element).WMPlayer('previousTrack')||Set previous track as current.|
|volume([volume = 1])|$(element).WMPlayer('volume', [volume = 1])|volume: float [0-1]|Set player's volume.|
|mute([mute])|$(element).WMPlayer('mute', [mute])|mute: boolean|Set/toggle player's mute.|
|autoplay([autoplay])|$(element).WMPlayer('auoplay', [autoplay])|autoplay: boolean|Set/toggle player's autoplay option.|
|loop([loop])|$(element).WMPlayer('loop', [loop])|loop: boolean|Set/toggle player's loop option.|
|showPlaylist([showPlaylist])|$(element).WMPlayer('showPlaylist', [showPlaylist])|showPlaylist: boolean|Set/toggle player's playlist display.|
|parent([parent], [setAsTemplate = false])|$(element).WMPlayer('parent', [parent], [setAsTemplate = false])| parent: node/JQuery, setAsTemplate: boolean|Set player's container and optionally set its content as a template.|
|template(template)|$(element).WMPlayer('template', template)|template: string/node/JQuery selector|Set player's template. See [Custom templates](#custom-templates) for more informations.|
|playlistPattern(pattern)|$(element).WMPlayer('playlistPattern', pattern)|pattern: string|Set playlist elements patterns. See [Custom templates](#custom-templates) for more informations.|
|controls(controls)|$(element).WMPlayer('controls', controls)|controls: object| Set player's controls classes. See [Custom templates](#custom-templates) for more informations.|

## Custom templates

WMPlayer's appearance can be easily customized with HTML and CSS.

### Setting template

WMPlayer's template can be changed by:
* setting player's parent content as template:

**Plain JavaScript**
```javascript
var player = new WMPlayer({
    parent: document.getElementbyId('player'),
    setAsTemplate: true
});
//or
player.parent(document.getElementbyId('player2'), true);
```
**JQuery**
```javascript
$('#player').WMPlayer({
    setAsTemplate: true
});
//or
$('#player').WMPlayer('parent', $('#player2'), true);
```

* setting template from string/node/JQuery selector:

**Plain JavaScript**
```javascript
//Get template
var template = '<div class="yourTemplate">Your template</div>';'
//or
template = document.getElementbyId('template'),

//Set template
var player = new WMPlayer({
    parent: document.getElementbyId('player'),
    template: template
});
//or
player.template(template);
```
**JQuery**
```javascript
//Get template
var template = '<div class="yourTemplate">Your template</div>';'
//or
template = $('#template'),

//Set template
$('#player').WMPlayer({
    template: template
});
//or
$('#player').WMPlayer('template', template);
```

### Playlist pattern

Playlist positions are generated based on pattern:
```
//pattern:
<div class="$status"><span>$index.</span><span>$title</span><span>$duration</span></div>

//generated playlist:
<div class="wmp-playlist-item wmp-current"><span>1.</span><span>Song 1</span><span>1:30</span></div>
<div class="wmp-playlist-item"><span>2.</span><span>Song 1</span><span>1:30</span></div>
<div class="wmp-playlist-item wmp-error"><span>3.</span><span>Song 1</span><span>1:30</span></div>
```
where:
* **$status** - status tag (required): signify playlist position's main container and placement of track's status (current track, error) (**WARNING**: $status tag must be inserted into class attribute, otherwise playlist won't respond properly),
* **$index** - index tag: placement of audio index number,
* **$title** - title tag: placement ot audiotrack's title,
* **$duration** - duration tag: placement of audiotrack's duration.

Playlist pattern can be also changed:

**Plain JavaScript**
```javascript
var player = new WMPlayer({
    playlistPattern: 'New pattern'
});
//or
player.playlistPattern('new pattern');
```
**JQuery**
```javascript
$('#player').WMPlayer({
    playlistPattern: 'New pattern'
});
//or
$('#player').WMPlayer('playlistPattern', 'New pattern');
```

### Controls

Coming soon
