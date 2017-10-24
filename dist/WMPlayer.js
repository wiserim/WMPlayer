/*!
* WMPlayer v0.6.4
* Copyright 2016-2017 Marcin Walczak
*This file is part of WMPlayer which is released under MIT license.
*See LICENSE for full license details.
*/

//jquery plugin
if (window.jQuery)
    $.fn.WMPlayer = function(options) {
        //get the arguments 
        var args = $.makeArray(arguments),
        after = args.slice(1);
        
        return this.each(function () {
            //check if there is an existing instance related to element
            var instance = $.data(this, 'wmplayer');
            if(instance) {
                if(instance[options]) {
                    instance[options].apply(instance, after);
                    //if called "parent" method, change storing element
                    if(options == 'parent'){
                        if(options.length > 0){
                            var parent = after[0];
                            if(parent.length > 0)
                                parent = parent[0];
                            $.removeData(this, 'wmplayer');
                            if($.data(parent, 'wmplayer') !== undefined)
                                $.data(parent, 'wmplayer').destroy();
                            $.data(parent, 'wmplayer', instance);
                        }
                    }
                }
                else {
                    $.error('Method '+options+' does not exist on WMPlayer');
                }
            }
            else if(typeof options !== 'string'){
                //create the plugin
                var config = options;
                if(config === undefined)
                    config = {parent: this};
                else if(config.parent === undefined)
                    config.parent = this;
                var wmp = new WMPlayer(config);

                //store the plugin instance on the element
                $.data(this, 'wmplayer', wmp);
                return wmp;
            }
        });
    };

//WMPlayer controller
function WMPlayer($config) {
    var self = this;
    var mouseDown = -1;
    this.currentScript = document.currentScript || (function() {
        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();
    this.parentNode = (this.currentScript[this.currentScript.length - 1] || this.currentScript).parentNode;
    //WMPlayer container
    this.container = document.createElement('div');
    if(this.container.classList !== undefined)
        this.container.classList.add('wmplayer');
    else
        this.container.className += ' wmplayer';
    
    //default config
    this.started = false;
    this.model = new WMPlayerModel();
    this.view = new WMPlayerView({
        playlist: 'wmp-playlist',
        playButton: 'wmp-play',
        stopButton: 'wmp-stop',
        fastForwardButton: 'wmp-fast-forward',
        rewindButton: 'wmp-rewind',
        progressBar: 'wmp-progress-bar',
        volumeBar: 'wmp-volume-bar',
        muteButton: 'wmp-mute',
        currentTrackTime: 'wmp-current-track-time',
        currentTrackDuration: 'wmp-current-track-duration',
        currentTrackTitle: 'wmp-current-track-title',
        container: this.container
    });
    this.view.setTemplate('<div class="wmp-panel"><div class="wmp-current-track"><span class="wmp-current-track-title"></span><span class="wmp-timer"><span class="wmp-current-track-time">0:00</span><span class="wmp-current-track-duration">N/A</span></span></div><div class="wmp-controls"><div class="wmp-play wmp-button"><svg class="wmp-button-play" width="18" height="18"><polygon class="wmp-symbol-play" points="2,2 16,9 2,16"/><g class="wmp-symbol-pause"><rect x="2" y="2" width="4" height="14" /><rect x="11" y="2" width="4" height="14" /><rect x="2" y="2" width="14" height="14" fill="transparent" stroke="transparent"/></g></svg></div><div class="wmp-stop wmp-button"><svg class="wmp-button-stop" width="18" height="18"><rect class="wmp-symbol-stop" x="2" y="2" width="14" height="14"/></svg></div><div class="wmp-rewind wmp-button"><svg class="wmp-button-rewind" width="18" height="18"><polygon class="wmp-symbol-rewind" points="2,9 9,2 9,9 16,2 16,16 9,9 9,16"/></svg></div><div class="wmp-fast-forward wmp-button"><svg class="wmp-button-fast-forward" width="18" height="18"><polygon class="wmp-symbol-fast-forward" points="2,2 9,9 9,2 16,9 9,16 9,8 2,16"/></svg></div></div><div class="wmp-volume-bar-container"><div class="wmp-button wmp-mute"><svg width="18" height="18"><g class="wmp-button-volume"><polygon points="2,6 5,6 10,2 10,16 5,12 2,12 " /><g class="wmp-symbol-muted"><path d="M12,4 Q18,9 12,14" fill="transparent" /><path d="M12,7 Q14,9 12,11" fill="transparent" /></g></g></svg></div><div class="wmp-volume-bar"></div></div><div class="wmp-progress-bar-container"><div class="wmp-progress-bar"></div></div></div><div class="wmp-playlist-container"><div class="wmp-playlist"></div></div>');
    this.view.setPlaylistPattern('<div class="$status"><span>$index.</span><span>$title</span><span>$duration</span></div>');
    
    //config arguments
    if ($config !== undefined) {
         //if config is node or jquery object
        if(($config.nodeType !== undefined && $config.nodeType === 1) || $config instanceof jQuery)
            this.parent($config);
        else {
            if($config.parent !== undefined) this.parent($config.parent, $config.parentAsTemplate);
            if($config.template !== undefined) this.template($config.template);
            if($config.playlistPattern !== undefined) this.playlistPattern($config.playlistPattern);
            if($config.controls !== undefined) this.controls($config.controls);
            if($config.autoplay !== undefined) this.autoplay($config.autoplay);
            if($config.loop !== undefined) this.loop($config.loop);
            if($config.volume !== undefined) this.volume($config.volume);
            if($config.mute !== undefined) this.mute($config.mute);
            if($config.playlist !== undefined) {
                $config.playlist.forEach(function($audioTrack) {
                    self.addTrack($audioTrack.url, $audioTrack.title);
                });
            };
            if($config.showPlaylist !== undefined) this.showPlaylist($config.showPlaylist);
            if($config.start === true) this.start();
       }
    }

    //attaching event listeners
    //audio track added
    this.model.audioTrackAdded.attach(function() {
        if(self.started) {
            var playlist = self.model.getPlaylist();
            var currentTrackIndex = self.model.getCurrentTrackIndex();
            var currentTrackTitle = self.model.getCurrentTrackTitle();
            var currentTrackDuration = self.model.getCurrentTrackDuration();
            self.view.renderPlaylist(playlist, currentTrackIndex);
            self.view.setCurrentTrackData(currentTrackTitle, currentTrackDuration);
        }
    });
    
    //audio track removed
    this.model.audioTrackRemoved.attach(function() {
        if(self.started) {
            var playlist = self.model.getPlaylist();
            var currentTrackIndex = self.model.getCurrentTrackIndex();
            self.view.renderPlaylist(playlist, currentTrackIndex);
        }
    });
    
    //current track change
    this.model.currentTrackChanged.attach(function() {
        if(self.started) {
            var playlist = self.model.getPlaylist();
            var currentTrackIndex = self.model.getCurrentTrackIndex();
            var currentTrackTitle = self.model.getCurrentTrackTitle();
            var currentTrackDuration = self.model.getCurrentTrackDuration();
            self.view.renderPlaylist(playlist, currentTrackIndex);
            self.view.setCurrentTrackData(currentTrackTitle, currentTrackDuration);
        }
    });
    
    //volume change
    this.model.volumeChanged.attach(function() {
        if(self.started) {
            self.view.setVolumeBar(self.model.getVolume());
            if(self.model.getMute())
                self.view.addContainerClass('muted');
            else
                self.view.removeContainerClass('muted');
        }
    });
    
    //play
    this.model.audioTrackPlaying.attach(function() {
        self.view.removeContainerClass('paused');
        self.view.addContainerClass('playing');
    });
    
    //pause
    this.model.audioTrackPaused.attach(function() {
        self.view.removeContainerClass('playing');
        self.view.addContainerClass('paused');
    });
    
    //stop
    this.model.audioTrackStopped.attach(function() {
        self.view.removeContainerClass('playing');
        self.view.removeContainerClass('paused');
    });
    
    //audio track end
    this.model.audioTrackEnded.attach(function() {
        var playlistEnded = self.model.nextTrack();
        if (playlistEnded && !(self.playlistLoop)) self.model.stop();
        else self.model.play();
    });
    
    //current track time/duration change
    this.model.durationChanged.attach(function() {
        var currentTime = self.model.getCurrentTime();
        var duration = self.model.getCurrentTrackDuration();
        self.view.setProgressBar(currentTime, duration);
        self.view.setCurrentTime(currentTime);
    });
    
    //audio track error
    this.model.audioTrackError.attach(function() {
        self.model.setCurrentTrackError();
        self.nextTrack();
    });
    
    //play button click
    this.view.playButtonClicked.attach(function() {
        if(self.model.audio.paused)
            self.model.play();
        else
            self.model.pause();
    });
    
    //stop button click
    this.view.stopButtonClicked.attach(function() {
        self.model.stop();
    });
    
    //fast-forward button click/press
    this.view.fastForwardButtonPressed.attach(function() {
        setTimeout(function() {
            //if mouseDown flag is true (button pressed) fast-forward
            if(self.view.mousedownFlag) {
                self.mouseDown = setInterval(function() {
                    if(self.view.mousedownFlag)
                        self.model.fastForward();
                    else {
                        clearInterval(self.mouseDown);
                        self.mouseDown = -1;
                    }
                }, 500);
            }
            else
                self.nextTrack();
        }, 200);
    });
    
    //rewind button click/press
    this.view.rewindButtonPressed.attach(function() {
        setTimeout(function() {
            //if mouseDown flag is true (button pressed) rewind
            if(self.view.mousedownFlag) {
                self.mouseDown = setInterval(function() {
                    if(self.view.mousedownFlag)
                        self.model.rewind();
                    else {
                        clearInterval(self.mouseDown);
                        self.mouseDown = -1;
                    }
                }, 500);
            }
            else
                self.previousTrack();
        }, 200);
    });
    
    //progress bar click/press
    this.view.progressBarClicked.attach(function($sender, $args) {
        var duration = self.model.getCurrentTrackDuration();
        var time = Math.floor(($args.offsetX / $args.width) * duration);
        self.model.setTime(time);
    });
    
    //volume bar click/press
    this.view.volumeBarClicked.attach(function($sender, $args) {
        var volume = $args.offsetX / $args.width;
        self.model.setVolume(volume);
    });
    
    //mute button click
    this.view.muteButtonClicked.attach(function($sender, $args) {
        self.model.setMute();
    });
    
    //playlist item double click/touch
    this.view.playlistElementDoubleClicked.attach(function($sender, $args) {
        self.model.setAudioTrack($args.trackId);
        self.model.play();
    });
    
    //template change
    this.view.templateModified.attach(function() {
        if(self.started) {
            var currentTrackTitle = self.model.getCurrentTrackTitle();
            var currentTrackDuration = self.model.getCurrentTrackDuration();
            var playlist = self.model.getPlaylist();
            var currentTrackIndex = self.model.getCurrentTrackIndex();
            self.view.renderPlayer();
            self.view.setCurrentTrackData(currentTrackTitle, currentTrackDuration);
            self.view.renderPlaylist(playlist, currentTrackIndex);
        }
    });
    
    //playlist pattern change
    this.view.playlistPatternModified.attach(function() {
        if(self.started) {
            var playlist = self.model.getPlaylist();
            var currentTrackIndex = self.model.getCurrentTrackIndex();
            self.view.renderPlaylist(playlist, currentTrackIndex);
        }
    });
}

WMPlayer.prototype = {  
    //add new audio track
    addTrack: function($url, $title) {
        if($title === undefined) $title = 'N/A';
        this.model.addAudioTrack($url, $title);
    },
    
    //remove audio track
    removeTrack: function($index) {
        this.model.delAudioTrack($index);
    },
    
    //set current track
    track: function($index) {
        if($index === undefined) $index = 0;
        this.model.setAudioTrack($index);
        if (this.started) this.model.play();
    },
    
    //next track
    nextTrack: function() {
        var playing = this.model.isPlaying() || this.model.audio.ended;
        var playlistEnded = this.model.nextTrack();
        if(playlistEnded && !(this.model.getLoop()))
            this.model.stop();
        else if(playing)
            this.model.play();
    },
    
    //previous track
    previousTrack: function() {
        var playing = this.model.isPlaying();
        this.model.previousTrack();
        if(playing)
            this.model.play();
    },
    
    //set volume
    volume: function($volume) {
        this.model.setVolume($volume);
    },
    
    //set/toggle mute
    mute: function($mute) {
        this.model.setMute($mute);
    },
    
    //set template
    template: function($template) {
        if($template === undefined)
            $template = false;
        if($template.length > 0)
            $template = $template[0];
        this.view.setTemplate($template);
    },
    
    //set playlist pattern
    playlistPattern: function($pattern) {
        if($pattern !== undefined)
            this.view.setPlaylistPattern($pattern);
    },
    
    //set player parent node
    parent: function($parent, $setAsTemplate) {
        //if parent argument is not provided, set script parent node as parent
        if($parent === undefined)
            $parent = (document.currentScript || (function() {
                var scripts = document.getElementsByTagName("script");
                return scripts[scripts.length - 1];
            })()).parentNode;
        else if($parent.length > 0)
            $parent = $parent[0];
        this.parentNode = $parent;

        if($setAsTemplate == true){
            this.view.setTemplate($parent.innerHTML);
            $parent.innerHTML = '';
        }
        
        if(this.started)
            this.parentNode.appendChild(this.container);
    },
    
    //set/toggle loop
    loop: function($loop) {
         this.model.setLoop($loop);
    },
    
    //set/toogle autoplay
    autoplay: function($autoplay) {
        this.model.setAutoplay($autoplay);
    },
    
    //set controls classes
    controls: function($elements) {
       this.view.setControls($elements);
    },
    
    //set/toggle playlist display
    showPlaylist: function($show) {
        this.view.setShowPlaylist($show);
    },

    //destroy player
    destroy: function() {
        if(this.container.parentNode == this.parentNode)
            this.parentNode.removeChild(this.container);
        this.started = false;
    },
    
    //player start
    start: function() {
        if(!this.started) {
            this.started = true;
            this.parentNode.appendChild(this.container);
            var currentTrackTitle = this.model.getCurrentTrackTitle();
            var currentTrackDuration = this.model.getCurrentTrackDuration();
            var playlist = this.model.getPlaylist();
            var currentTrackIndex = this.model.getCurrentTrackIndex();
            var volume = this.model.getVolume();
            var mute = this.model.getMute();
            var autoplay = this.model.getAutoplay();
            this.view.renderPlayer();
            this.view.setProgressBar();
            this.view.setVolumeBar(volume);
            if(mute) this.view.addContainerClass('muted');
            this.view.setCurrentTrackData(currentTrackTitle, currentTrackDuration);
            this.view.renderPlaylist(playlist, currentTrackIndex);
            if(autoplay) this.model.play();
            else this.view.addContainerClass('paused');     
        }
    }
};

//WMPlayer event container
function WMPlayerEvent($sender) {
    this.sender = $sender;          
    this.listeners = [];
}

WMPlayerEvent.prototype = {
    attach: function($listener) {
        this.listeners.push($listener);
    },

    notify: function($args) {
        for (var i = 0; i < this.listeners.length; i++) {
            this.listeners[i](this.sender, $args);
        }
    }
};

//WMPlayer model
function WMPlayerModel() {
    var self = this;   
    this.audio = new Audio();
    this.playlist = [];
    this.currentTrackIndex = null;
    this.loop = false;
    this.autoplay = false;
    this.timeChangeRate = 5;
    this.volume = 1;
    this.mute = false;
    this.canPause = true;
    
    //model events
    this.audioTrackAdded = new WMPlayerEvent(this);
    this.audioTrackRemoved = new WMPlayerEvent(this);
    this.currentTrackChanged = new WMPlayerEvent(this);
    this.audioTrackPlaying = new WMPlayerEvent(this);
    this.audioTrackPaused = new WMPlayerEvent(this);
    this.audioTrackStopped = new WMPlayerEvent(this);
    this.audioTrackEnded = new WMPlayerEvent(this);
    this.audioTrackError = new WMPlayerEvent(this);
    this.durationChanged = new WMPlayerEvent(this);
    this.volumeChanged = new WMPlayerEvent(this);
    
    //attach event listeners
    this.audio.addEventListener('play', function() {
        self.audioTrackPlaying.notify();
    });
    this.audio.addEventListener('playing', function() {
        self.audioTrackPlaying.notify();
    });
    this.audio.addEventListener('pause', function() {
        self.audioTrackPaused.notify();
    });
    this.audio.addEventListener('ended', function() {
        self.audioTrackEnded.notify();
    });
    this.audio.addEventListener('error', function() {
        self.canPause = true;
        self.audioTrackError.notify();
    });
    this.audio.addEventListener('durationchange', function() {
        self.durationChanged.notify();
    });
    this.audio.addEventListener('timeupdate', function() {
        self.durationChanged.notify();
    });
    this.audio.addEventListener('volumechange', function() {
        self.volumeChanged.notify();
    });
}

WMPlayerModel.prototype = {
    //get playlist
    getPlaylist: function() {
        return this.playlist;
    },
    
    //get current track index
    getCurrentTrackIndex: function() {
        return this.currentTrackIndex;
    },
    
    //get current track title
    getCurrentTrackTitle: function() {
        if(this.currentTrackIndex === null)
            return '';
        else
            return this.playlist[this.currentTrackIndex].title;
    },
    
    //get current track duration
    getCurrentTrackDuration: function() {
        if(this.currentTrackIndex === null)
            return 0;
        var duration = this.playlist[this.currentTrackIndex].duration;
        if(isNaN(duration))
            return 0;
        else
            return duration;
    },
    
    //get current track time
    getCurrentTime: function() {
        return this.audio.currentTime;
    },
    
    //get volume
    getVolume: function() {
        return this.volume;
    },
    
    //get mute
    getMute: function() {
        return this.mute;
    },
    
    //get autoplay
    getAutoplay: function() {
        return this.autoplay;
    },
    
    //get playlist loop
    getLoop: function() {
        return this.loop;
    },
    
    //get if current track is playing
    isPlaying: function() {
        return !(this.audio.paused);
    },
    
    //add audio track
    addAudioTrack: function($url, $title) {
        if($title === undefined)
            $title = 'N/A';
        
        this.playlist.push({
            title: $title,
            url: $url,
            duration: 'N/A',
            error: false
        });
        
        this.audioTrackAdded.notify();
        var self = this;
        var index = this.playlist.length - 1;
        var audio = new Audio();
        //after loading audio track metadata, get track duration
        audio.onloadedmetadata = function($e) {
            var i = 0;
            //search track on playlist
            if(self.playlist.length == 0)
                return;
            while((!($e.target.src.indexOf(self.playlist[i].url) >= 0 || $e.target.src.indexOf(encodeURI(self.playlist[i].url)) >= 0) || self.playlist[i].duration != 'N/A') && i < self.playlist.length) {
                i++;
            }
            
            if(!($e.target.src.indexOf(self.playlist[i].url) >= 0 || $e.target.src.indexOf(encodeURI(self.playlist[i].url))))
                return;
            self.playlist[i].duration = audio.duration;
            self.audioTrackAdded.notify();
        };
        
        audio.src = self.playlist[index].url;
        audio.load();
        
        if(self.currentTrackIndex === null)
            self.setAudioTrack();
    },
    
    //remove audio track
    delAudioTrack: function($index) {
        if(this.playlist.length == 0)
            return;
        if($index === undefined)
            $index = this.playlist.length - 1;
        this.playlist.splice($index, 1);
        
        //if current track removed set new one
        if($index == this.currentTrackIndex) {
            var playing = this.isPlaying();
            this.stop();
            if(this.playlist.length == 0)
                this.setAudioTrack();
            else if(this.currentTrackIndex >= this.playlist.length)
                this.setAudioTrack($index - 1);
            else
                this.setAudioTrack($index);
            if(playing)
                this.play();
        }
        else if($index < this.currentTrackIndex)
            this.currentTrackIndex--;
        
        this.audioTrackRemoved.notify();
    },
    
    //set current track
    setAudioTrack: function($index) {
        var self = this;
        if($index === undefined)
            $index = 0;
        if(this.playlist.length > $index && 0 <= $index) {
            if(this.canPause){
                this.audio.src = this.playlist[$index].url;
                this.currentTrackIndex = $index;
                this.audio.load();
                this.currentTrackChanged.notify();
            }
            else {
                var interval = setInterval(function() {
                    if(self.canPause || self.playlist[self.currentTrackIndex].error) {
                        self.canPause = true;
                        self.audio.src = self.playlist[$index].url;
                        self.currentTrackIndex = $index;
                        self.audio.load();
                        self.currentTrackChanged.notify();
                        clearInterval(interval);
                    }
                }, 10);
            }
                
        }
        else
            this.currentTrackIndex = null;
    },
    
    //set volume
    setVolume: function($volume) {
        if($volume === undefined)
            $volume = 1;
        if($volume < 0)
            $volume = 0;
        else if($volume > 1)
            $volume = 1;
        this.volume = $volume;
        this.mute = false;
        this.audio.volume = this.volume;
    },
    
    //set mute
    setMute: function($mute) {
        if($mute === undefined)
            this.mute = !this.mute;
        else if($mute)
            this.mute = true;
        else
            this.mute = false;
        
        if(this.mute)
            this.audio.volume = 0;
        else
            this.audio.volume = this.volume;
    },
    
    //set autoplay
    setAutoplay: function($autoplay) {
        if($autoplay === undefined)
            this.autoplay = !this.autoplay;
        else if($autoplay)
            this.autoplay = true;
        else
            this.autoplay = false;
    },
    
    //set playlist loop
    setLoop: function($loop) {
        if($loop === undefined)
            this.loop = !this.loop;
        else if($loop)
            this.loop = true;
        else
            this.loop = false;
    },
    
    //set current track error
    setCurrentTrackError: function() {
        this.playlist[this.currentTrackIndex].error = true;
    },
    
    //play current track
    play: function() {
        self = this;
        this.canPause = false;
        if(this.playlist.length == 0)
            return;
        if(!(this.audio.src) || this.audio.src == '')
            this.setAudioTrack();
        
        //checking if you can pause/change track in chrome 50+
        var playPromise = this.audio.play();
        if(playPromise !== undefined && typeof Promise !== 'undefined' && Promise.toString().indexOf('[native code]') !== -1) {
            try {
                playPromise.then(function(){self.canPause = true;}).catch(function(){self.canPause = true;});
            }
            catch(error) {self.canPause = true;}
        }
        else
            this.canPause = true;
    },
    
    //pause
    pause: function() {
        this.audio.pause();
    },
    
    //stop
    stop: function() {
        if(this.audio.src) {
            this.audio.pause();
            try {
                this.audio.currentTime = 0;
            }
            catch(e) {}
            
            this.audioTrackStopped.notify();
        }
    },
    
    //next track
    nextTrack: function() {
        var playlistEnd = false;
        if(this.currentTrackIndex < this.playlist.length - 1)
            this.setAudioTrack(this.currentTrackIndex + 1);
        else {
            this.setAudioTrack();
            playlistEnd = true;
        }
        this.currentTrackChanged.notify();
        return playlistEnd;
    },
    
    //previous track
    previousTrack: function() {
        if(this.currentTrackIndex > 0) {
            this.setAudioTrack(this.currentTrackIndex - 1);
        }
        else
            this.setAudioTrack();
        this.currentTrackChanged.notify();
    },
    
    //set current track time
    setTime: function($time) {
        if(this.audio.src)
            this.audio.currentTime = $time;
    },
    
    //fast-forward
    fastForward: function() {
        var time = this.getCurrentTime() + this.timeChangeRate;
        if(time < this.audio.duration && time >= 0) {
            if(this.audio.buffered.start(0) <= time && this.audio.buffered.end(0) >= time)
                this.audio.currentTime = time;
        }
    },
    
    //rewind
    rewind: function() {
        var time = this.getCurrentTime() - this.timeChangeRate;
        if(time < this.audio.duration && time >= 0)
            if(this.audio.buffered.start(0) <= time && this.audio.buffered.end(0) >= time)
                this.audio.currentTime = time;
    }
};

//WMPlayer view
function WMPlayerView($elements) {
    var self = this;
    this.elements = $elements;
    this.template = null;
    this.playlistPattern = '';
    this.container = this.elements.container;
    this.mousedownFlag = false;
    this.showPlaylist = true;
    this.dragged = false;
    this.mouseOnVolumeBar = false;
    this.mouseOnProgressBar = false;
    
    
    //view events
    this.playButtonClicked = new WMPlayerEvent(this);
    this.stopButtonClicked = new WMPlayerEvent(this);
    this.fastForwardButtonPressed = new WMPlayerEvent(this);
    this.rewindButtonPressed = new WMPlayerEvent(this);
    this.progressBarClicked = new WMPlayerEvent(this);
    this.volumeBarClicked = new WMPlayerEvent(this);
    this.muteButtonClicked = new WMPlayerEvent(this);
    this.playlistElementDoubleClicked = new WMPlayerEvent(this);
    this.templateModified = new WMPlayerEvent(this);
    this.playlistPatternModified = new WMPlayerEvent(this);
    
    //attach event listeners
    //click inside WMPlayer container
    this.container.addEventListener("click", function($e) {
        //get event traget's ancestors
        var targetParents = self.getParentsNodes($e.target, self.elements.container);
        
        //play button clicked
        if(self.isParent(targetParents, self.elements.playButton))
            self.playButtonClicked.notify();
        
        //stop button clicked
        if(self.isParent(targetParents, self.elements.stopButton))
            self.stopButtonClicked.notify();
        
        //progress bar click
        var progressBarValue = self.isParent(targetParents, self.elements.progressBar, true);
        if(progressBarValue) {
            var progressBarParent = progressBarValue.parentNode;
            var width = 0;
            var rect = progressBarValue.getBoundingClientRect();
            var offsetX = $e.clientX - rect.left;
            //get parent width
            if(progressBarParent.hasAttribute('width'))
                width = progressBarParent.getAttribute('width');
            else
                width = progressBarParent.offsetWidth;

            self.progressBarClicked.notify({
                offsetX: offsetX,
                width: width
            });
        }
        
        //volume bar click
        var volumeBarValue = self.isParent(targetParents, self.elements.volumeBar, true);
        if(volumeBarValue) {
            var volumeBarWidth = volumeBarValue.parentNode;
            var width = 0;
            var rect = volumeBarValue.getBoundingClientRect();
            var offsetX = $e.clientX - rect.left;
            //get parent width
            if(volumeBarWidth.hasAttribute('width'))
                width = volumeBarWidth.getAttribute('width');
            else
                width = volumeBarWidth.offsetWidth;

            self.volumeBarClicked.notify({
                offsetX: offsetX,
                width: width
            });
        }
        
         //mute button click
        if(self.isParent(targetParents, self.elements.muteButton))
            self.muteButtonClicked.notify();
    });
    
    //double click inside WMPlayer container
    var doubleClick = function($e) {
        //get event traget's ancestors
        var targetParents = self.getParentsNodes($e.target, self.elements.container);
        
        //playlist item double click
        var playlistItem = self.isParent(targetParents, 'wmp-playlist-item');
        if(playlistItem) {
            var  i= 0;
            while((playlistItem=playlistItem.previousSibling) !== null)
                ++i;
            self.playlistElementDoubleClicked.notify({
                trackId: i
            });
        }
    };
    
    //mousedown inside WMPlayer container
    var mouseDown = function($e) {
        self.mouseOnVolumeBar = false;
        self.mouseOnProgressBar = false;
        
        //get event traget's ancestors
        var targetParents = self.getParentsNodes($e.target, self.elements.container);
        
        //fast-forward button press
        if(self.isParent(targetParents, self.elements.fastForwardButton)) {
            self.mousedownFlag = true;
            self.fastForwardButtonPressed.notify();
        }
         
         //rewind button press
        if(self.isParent(targetParents, self.elements.rewindButton)) {
            self.mousedownFlag = true;
            self.rewindButtonPressed.notify();
        }
        
        //volume bar press
        if(self.isParent(targetParents, self.elements.volumeBar, true)) {
            self.mouseOnVolumeBar = true;
        }
        
        //progress bar press
        if(self.isParent(targetParents, self.elements.progressBar, true)) {
            self.mouseOnProgressBar = true;
        }
    };
    
    //touchstart inside WMPlayer container
    var touchstart = function($e) {
        self.mouseOnVolumeBar = false;
        self.mouseOnProgressBar = false;
        self.dragged = false;
        
        //get event traget's ancestors
        var targetParents = self.getParentsNodes($e.target, self.elements.container);
        
        //volume bar touch
        if(self.isParent(targetParents, self.elements.volumeBar, true)) {
            self.mouseOnVolumeBar = true;
        }
        
        //progress bar touch
        if(self.isParent(targetParents, self.elements.progressBar, true)) {
            self.mouseOnProgressBar = true;
        } 
    };
    
    //mouseup/touchend inside WMPlayer container
    var mouseUp = function($e) {
        self.mousedownFlag = false;
        self.mouseOnVolumeBar = false;
        self.mouseOnProgressBar = false;
    };
    
    //mousemove/touchmove inside WMPlayer container
    var mouseMove = function($e) {
        //if left mouse button is pressed or screen toouched
        if($e.which == 1 || $e.touches !== undefined) {
            //get event traget's ancestors
            var targetParents = self.getParentsNodes($e.target, self.elements.container);
            
            //move on volume bar if it was pressed
            var volumeBarValue = self.isParent(targetParents, self.elements.volumeBar, true);
            if(volumeBarValue && self.mouseOnVolumeBar) {
                var volumeBarWidth = volumeBarValue.parentNode;
                var width = 0;
                var rect = volumeBarValue.getBoundingClientRect();
                var offsetX = ($e.clientX || $e.touches[0].clientX) - rect.left;

                //get parent width
                if(volumeBarWidth.hasAttribute('width'))
                    width = volumeBarWidth.getAttribute('width');
                else
                    width = volumeBarWidth.offsetWidth;

                self.volumeBarClicked.notify({
                    offsetX: offsetX,
                    width: width
                });
            }
            
            //move on progress bar if it was pressed
            var progressBarValue = self.isParent(targetParents, self.elements.progressBar, true);
            if(progressBarValue && self.mouseOnProgressBar) {
                var progressBarParent = progressBarValue.parentNode;
                var width = 0;
                var rect = progressBarValue.getBoundingClientRect();
                var offsetX = ($e.clientX || $e.touches[0].clientX) - rect.left;
                
                //get parent width
                if(progressBarParent.hasAttribute('width'))
                    width = progressBarParent.getAttribute('width');
                else
                    width = progressBarParent.offsetWidth;

                self.progressBarClicked.notify({
                    offsetX: offsetX,
                    width: width
                });
            }
        }
    };
    
    //attach event listeners
    this.container.addEventListener("dblclick", function($e) {
        doubleClick($e);
    });
    
    this.container.addEventListener("touchstart", function($e) {
        touchstart($e);
    });
    
    this.container.addEventListener("touchmove", function($e) {
        this.dragged = true;
        mouseMove($e);
    });
    
    this.container.addEventListener("touchend", function($e) {
        if(!this.dragged)
            doubleClick($e);
        this.dragged = false;
    });
    
    this.container.addEventListener("mousedown", function($e) {
        mouseDown($e);
    });
    
    this.container.addEventListener("mouseup", function($e) {
        mouseUp($e);
    });
    
    this.container.addEventListener("mousemove", function($e) {
        mouseMove($e);
    });
}

WMPlayerView.prototype = {
    //render player
    renderPlayer: function() {
        if(this.template !== null)
            this.elements.container.innerHTML = this.template;
    },
    
    //render playlist
    renderPlaylist: function($playlist, $currentTrackIndex) {
        var list = '';
        var status = '';
        var playlists = this.elements.container.getElementsByClassName(this.elements.playlist);
        
        if(this.showPlaylist) {
            if(playlists.length > 0) {
                for(var i = 0; i < $playlist.length; i++) {
                    status = 'wmp-playlist-item';
                    if(i == $currentTrackIndex)
                        status += ' wmp-current';
                    if($playlist[i].error)
                        status += ' wmp-error';
                    list = list+this.playlistPattern.replace('$index', (i+1)).replace('$title', $playlist[i].title).replace('$duration', this.formatTime($playlist[i].duration)).replace('$status', status);
                }
            }
        }
        
        //placing playlist in containers
        for(i = 0; playlists.length > i; i++) {
            playlists[i].innerHTML = list;
        }
    },
    
    //set template
    setTemplate: function($template) {
        if($template.nodeType === 1)
            this.template = $template.innerHTML;
        else this.template = $template;
        this.templateModified.notify();
    },
    
    //set playlist pattern
    setPlaylistPattern: function($pattern) {
        this.playlistPattern = $pattern;
        this.playlistPatternModified.notify();
    },
    
    //set playlist visibility
    setShowPlaylist: function($show) {
        if($show === undefined)
            this.showPlaylist = !this.showPlaylist;
        else if($show == true)
            this.showPlaylist = true;
        else
            this.showPlaylist = false;
        this.playlistPatternModified.notify();
    },
    
    //set volume bar value
    setVolumeBar: function($volume) {
        if($volume === undefined)
            $volume = 0;
        var volumeBar = this.elements.container.getElementsByClassName(this.elements.volumeBar);
        for(var i = 0; i < volumeBar.length; i++) {
            volumeBar[i].style.width = $volume * 100 + '%';
        };
    },
    
    //set progress bar value
    setProgressBar: function($currentTime, $duration) {
        var width = 0;
        var progressBar = this.elements.container.getElementsByClassName(this.elements.progressBar);
        if($currentTime !== undefined && $duration !== undefined)
            width = $currentTime / $duration * 100;
        for(var i = 0; i < progressBar.length; i++) {
            progressBar[i].style.width = width + '%';
        }
    },
    
    //format time
    formatTime: function($time) {
        var formatedTime = "N/A";
        if(!isNaN($time)) {
            var minutes = Math.floor($time / 60);
            var seconds = Math.floor($time - (minutes * 60));
            formatedTime = minutes + ':' + ((seconds < 10 ? '0' : '') + seconds);
        }
        return formatedTime;
    },
    
    //set current track time
    setCurrentTime: function($currentTime) {
        var timers = this.elements.container.getElementsByClassName(this.elements.currentTrackTime);
        var currentTime = this.formatTime($currentTime);
        for (var i = 0; i < timers.length; i++) {
            timers[i].innerHTML = currentTime;
        };
    },
    
    //get target's parents up to WMPlayer container
    getParentsNodes: function($target, $toParent) {
        var nodes = [];
        var element = $target;
        nodes.push(element);
        while(element.parentNode && element != $toParent) {
            nodes.unshift(element.parentNode);
            element = element.parentNode;
        };
        return nodes;
    },
    
    //check if in parents list is element with a certain class
    isParent: function($parents, $className, $child) {
        if($parents.length > 1) {
            for(var i = 0; i < $parents.length; i++) {
                if($parents[i].classList !== undefined) {
                    if($parents[i].classList.contains($className) || (' ' + $parents[i].getAttribute("class") + ' ').indexOf(' ' + $className + ' ') > -1)
                        return $parents[i];
                }
                else if ((' ' + $parents[i].getAttribute("class") + ' ').indexOf(' ' + $className + ' ') > -1)
                    return $parents[i];
            }
        }
        else {
            if($parents.classList.contains($className) || (' ' + $parents.className + ' ').indexOf(' ' + $className + ' ') > -1)
                return $parents;
        }
        //check if parent has child with certain class
        if($child) {
            var children = this.container.getElementsByClassName($className);
            for(var i = 0; i < (children.length); i++) {
                if(children[i].parentNode === $parents[$parents.length - 1])
                    return children[i];
            }
        }
        return false;
    },
    
    //set current track data
    setCurrentTrackData: function($currentTrackTitle, $currentTrackDuration) {
        var titles = this.elements.container.getElementsByClassName(this.elements.currentTrackTitle);
        var durations = this.elements.container.getElementsByClassName(this.elements.currentTrackDuration);

        for(var i = 0; i < titles.length; i++) {
            if(titles[i] !== null)
                titles[i].innerHTML = $currentTrackTitle;
        }
        
        var duration = this.formatTime($currentTrackDuration);
        for(var i = 0; i < durations.length; i++) {
            if(durations[i] !== null)
                durations[i].innerHTML = duration;
        }
    },
    
    //add class to WMPlayer container
    addContainerClass: function($newClassName) {
        if(this.elements.container.classList !== undefined)
            this.elements.container.classList.add($newClassName);
        else
            this.elements.container.className += ' '+$newClassName;
    },
    
    //remove class from WMPlayer container
    removeContainerClass: function($removedClassName) {
        if(this.elements.container.classList !== undefined)
            this.elements.container.classList.remove($removedClassName);
        else {
            var elClass = ' ' + this.elements.container.className + ' ';
            while(elClass.indexOf(' ' + $removedClassName + ' ') !== -1){
                 elClass = elClass.replace(' ' + $removedClassName + ' ', '');
            }
            this.elements.container.className = elClass.trim();
        }
    },
    
    //set controll classes
    setControls: function($elements) {
        if($elements.playlist !== undefined) this.elements.playlist = $elements.playlist;
        if($elements.playButton !== undefined) this.elements.playButton = $elements.playButton;
        if($elements.stopButton !== undefined) this.elements.stopButton = $elements.stopButton;
        if($elements.fastForwardButton !== undefined) this.elements.fastForwardButton = $elements.fastForwardButton;
        if($elements.rewindButton !== undefined) this.elements.rewindButton = $elements.rewindButton;
        if($elements.progressBar !== undefined) this.elements.progressBar = $elements.progressBar;
        if($elements.volumeBar !== undefined) this.elements.volumeBar = $elements.volumeBar;
        if($elements.muteButton !== undefined) this.elements.muteButton = $elements.muteButton;
        if($elements.currentTrackTime !== undefined) this.elements.currentTrackTime = $elements.currentTrackTime;
        if($elements.currentTrackDuration !== undefined) this.elements.currentTrackDuration = $elements.currentTrackDuration;
        if($elements.currentTrackTitle !== undefined) this.elements.currentTrackTitle = $elements.currentTrackTitle;
    }
};
