# WMPlayer (0.8)

Customizable HTML5 web music player.

WMPlayer features: 
* **Dynamic playlist** - create and edit your playlist on the fly,
* **YouTube support** - player support browser compatible audio formats and YouTube videos,
* **Full player control** - play, pause, stop, fast-forward/rewind, next/previous song, volume, autoplay, loop and more,
* **Easy, dynamic docking system** - WMPlayer can be dynamically placed anywhere on page, just designate it's parent node,
* **Simple UI** - WMPlayer goes by default with simple, functional and responsive customizable UI in two variants ("default" and "default dark").
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

**JavaScript**
```javascript
var playersContainer = document.getElementById('player');
var WMPlayer = new WMPlayer({
  parent: playersContainer, //Set player's container
  //Set playlist
  playlist: [
    {
      title: 'Song 1',
      url: 'song1.mp3'
    },
    {
      title: 'Song 2',
      url: 'https://www.youtube.com/watch?v=youtube_video'
    }
  ]
});
```

**JQuery**
```javascript
//Create player in all selected elements
$('#player').WMPlayer({
  //Set playlist
  playlist: [
    {
      title: 'Song',
      url: 'song.mp3'
    },
    {
      title: 'Song 2',
      url: 'https://www.youtube.com/watch?v=youtube_video'
    }
  ]
});
```

## Options

|Option|Type|Default|Description|
|---|---|---|---|
|parent|node/JQuery selector|Script's parent node|Sets player's parent.|
|parentAsTemplate|boolean|false|Take parent's content as player's template.|
|theme|string|'default'|Sets player's theme class. See [Custom templates](#custom-templates) for more informations.|
|template|string/node/JQuery selector|Default template|Sets player's template. See [Custom templates](#custom-templates) for more informations.|
|playlistPattern|string|Default pattern|Sets playlist pattern. See [Custom templates](#custom-templates) for more informations.|
|controls|object|false|Sets classes of player's interactive elements. See [Custom templates](#custom-templates) for more informations.|
|autoplay|boolean|false|Sets autoplay.|
|loop|boolean|false|Sets playlist loop.|
|volume|float [0-1]|1|Sets player's volume.|
|mute|boolean|false|Sets player's mute.|
|playlist|array|[]|Sets player's playlist. Playlist has forem: [{title: 'Song title', url: 'Song URL'}, ...]|
|showPlaylist|boolean|true|Sets player's playlist visibility.|
|start|boolean|true|Run player.|

## Methods
Methods can be called and chained depending on how you initialized WMPlayer:

**JavaScript**
```javascript
    var player = new WMPlayer();
    player
    .addTrack('Song', 'song.mp3')
    .addTrack('Song 2', 'song2.mp3')
    .autoplay();

```

**JQuery**
```javascript
    $('player').WMPlayer();
    $('player')
    .WMPlayer('addTrack', 'Song', 'song.mp3')
    .WMPlayer('addTrack', 'Song 2', 'song2.mp3')
    .WMPlayer('autoplay');
```

|Method|Arguments|Description|
|---|---|---|
|start()|none|Run player.|
|addTrack(url, [title = 'N/A'])|url : string, title: string|Add audio track to playlist|
|removeTrack([index])|index : int|Removes position from playlist. Last playlist element is removed by default.|
|track([index])|index : int|Play playlist element. First playlist element is played by default.|
|nextTrack()|none|Set next track as current.|
|previousTrack()|none|Set previous track as current.|
|volume([volume = 1])|volume: float [0-1]|Set player's volume.|
|mute([mute])|mute: boolean|Set/toggle player's mute.|
|autoplay([autoplay])|autoplay: boolean|Set/toggle player's autoplay option.|
|loop([loop])|loop: boolean|Set/toggle player's loop option.|
|showPlaylist([showPlaylist])|showPlaylist: boolean|Set/toggle player's playlist display.|
|parent([parent], [setAsTemplate = false])|parent: string/node/JQuery, setAsTemplate: boolean|Set player's container and optionally set its content as a template.|
|theme(class)|class: string|Set player's theme class. See [Custom templates](#custom-templates) for more informations.|
|template(template)|template: string/node/JQuery selector|Set player's template. See [Custom templates](#custom-templates) for more informations.|
|playlistPattern(pattern)|pattern: string|Set playlist elements patterns. See [Custom templates](#custom-templates) for more informations.|
|controls(controls)|$(element).WMPlayer('controls', controls)|controls: object| Set player's controls classes. See [Custom templates](#custom-templates) for more informations.|
|destroy()|$(element).WMPlayer('destroy')|none|Destroy player.|

## Custom templates

WMPlayer's appearance can be easily customized with HTML and CSS.

### Setting template

WMPlayer's template can be changed by:
* changing player's theme class (player goes with two themes: default and default dark)

**JavaScript**
```javascript
var player = new WMPlayer().theme('default dark');
```
**JQuery**
```javascript
$('#player').WMPlayer().WMPlayer('theme', 'default dark');
```

* setting player's parent content as template:

**JavaScript**
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

**JavaScript**
```javascript
//Get template
var template = '<div class="yourTemplate">Your template</div>';
//or
template = document.getElementbyId('template');

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
var template = '<div class="yourTemplate">Your template</div>';
//or
template = $('#template');

//Set template
$('#player').WMPlayer({
    template: template
});
//or
$('#player').WMPlayer('template', template);
```

### Playlist pattern

Playlist positions are generated based on pattern:
```html
<!--Pattern-->
<div class="$status"><span>$index.</span><span>$title</span><span>$duration</span></div>

<!--generated playlist-->
<div class="wmp-playlist-item wmp-current"><span>1.</span><span>Song 1</span><span>1:30</span></div>
<div class="wmp-playlist-item"><span>2.</span><span>Song 2</span><span>1:30</span></div>
<div class="wmp-playlist-item wmp-error"><span>3.</span><span>Song 3</span><span>N/A</span></div>
```
Playlist pattern contain tags which are replaced with playlist items data like:
* **$status** - status tag: signify playlist position's main container and placement of track's status (current track, error) (**WARNING**: $status tag must be inserted into class attribute, otherwise playlist won't show playlist item status),
* **$index** - index tag: placement of audio index number,
* **$title** - title tag: placement ot audiotrack's title,
* **$duration** - duration tag: placement of audiotrack's duration.

Playlist pattern can also be changed:

**JavaScript**
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

WMPlayer's interactive elements like play button, progress bar, playlist container, etc. are identified by assigned classes.

**Example**
```html
<div class="wmplayer">
    <!--play button-->
    <button class="wmp-play">Play/Pause</button>
    <!--stop button-->
    <button class="wmp-stop">Stop</button>
    <!--rewind/prevous track button-->
    <button class="wmp-rewind">Rewind/Previous track</button>
    <!--fast forward/next track button-->
    <button class="wmp-fast-forward">Fast forward/Next track</button>
    <!--Current track title-->
    <p class="wmp-current-track-title"><!--Here goes current track title--></p>
    <!--Current track time and duration-->
    <p>
        <span class="wmp-current-track-time"><!--Here goes current track time--></span>
        <span class="wmp-current-track-duration"><!--Here goes current track duration--></span>
    </p>
    <div>
        <!--progress bar-->
        <div class="wmp-progress-bar"></div>
    </div>
    <!--playlist-->
    <div class="wmp-playlist">
        <!--Here goes playlist content-->
    </div>
</div>
```

|Control class|Default|Description|
|---|---|---|
|playButton|wmp-play|Play/pause button class.|
|stopButton|wmp-stop|Stop button class.|
|fastForwardButton|wmp-fast-forward|Fast forward/next track button class.|
|rewindButton|wmp-rewind|Rewind/previous track button class.|
|currentTrackTitle|wmp-current-track-title|Current track title container class.|
|currentTrackTime|wmp-current-track-time|Current track time container class.|
|currentTrackDuration|wmp-current-track-duration|Current track duration container class.|
|progressBar|wmp-progress-bar|Current track's progress bar class.|
|volumeBar|wmp-volume-bar|Volume bar class.|
|muteButton|wmp-mute|Mute button class.|
|playlist|wmp-playlist|Playlist container class|

Player's control classes can be changed:

**Plain JavaScript**
```javascript
var player = new WMPlayer({
    controls: {
        playButton: 'playButtonClass',
        stopButton: 'stopButtonClass',
        ...
    }
});
//or
player.controls({
    playButton: 'playButtonClass',
    stopButton: 'stopButtonClass',
    ...
});
```
**JQuery**
```javascript
$('#player').WMPlayer({
    playButton: 'playButtonClass',
    stopButton: 'stopButtonClass',
    ...
});
//or
$('#player').WMPlayer('controls', {
    playButton: 'playButtonClass',
    stopButton: 'stopButtonClass',
    ...
});
```
