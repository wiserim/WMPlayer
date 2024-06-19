/*!
* WMPlayer v1.0.0
* Copyright 2016-2024 Marcin Walczak
*This file is part of WMPlayer which is released under MIT license.
*See LICENSE for full license details.
*/

//jquery plugin
if (window.jQuery) $.fn.WMPlayer = function(options) {
    var args = $.makeArray(arguments), after = args.slice(1);
    return this.each(function() {
        var instance = $.data(this, "wmplayer");
        if (instance) {
            if (instance[options]) {
                instance[options].apply(instance, after);
                if (options == "parent") {
                    if (options.length > 0) {
                        var parent = after[0];
                        if (parent.length > 0) parent = parent[0];
                        $.removeData(this, "wmplayer");
                        if ($.data(parent, "wmplayer") !== undefined) $.data(parent, "wmplayer").destroy();
                        $.data(parent, "wmplayer", instance);
                    }
                }
            } else {
                $.error("Method " + options + " does not exist on WMPlayer");
            }
        } else if (typeof options !== "string") {
            var config = options;
            if (config === undefined) config = {
                parent: this
            }; else if (config.parent === undefined) config.parent = this;
            var wmp = new WMPlayer(config);
            $.data(this, "wmplayer", wmp);
            return wmp;
        }
    });
};

function WMPlayer($config) {
    var self = this;
    var mouseDown = -1;
    this.currentScript = document.currentScript || function() {
        var scripts = document.getElementsByTagName("script");
        return scripts[scripts.length - 1];
    }();
    this.parentNode = (this.currentScript[this.currentScript.length - 1] || this.currentScript).parentNode;
    //WMPlayer container
    this.container = document.createElement("div");
    if (this.container.classList !== undefined) {
        this.container.classList.add("wmplayer");
        this.container.classList.add("default");
    } else {
        this.container.className += " wmplayer default";
    }

    var playerBody = document.createElement("div");
    if (playerBody.classList !== undefined) playerBody.classList.add("wmplayer-body"); else playerBody.className += " wmplayer-body";
    this.container.appendChild(playerBody);

    //media container
    var mediaContainer = document.createElement("div");
    mediaContainer.className += "wmplayer-media";
    this.container.appendChild(mediaContainer);
    var yt = document.createElement("div");
    yt.className += "wmplayer-yt";
    mediaContainer.appendChild(yt);
    mediaContainer.setAttribute("style", "width: 0; height: 0; overflow: hidden; opacity: 0;");

    //load You Tube iframe api
    /*
    if (document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]').length == 0) {
        var yt = document.createElement("script");
        yt.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode.insertBefore(yt, firstScriptTag);
    }
    */

    var $playlistDoubleClickSelect = false;

    if ($config !== undefined) {
        if ($config.playlistDoubleClickSelect !== undefined) $playlistDoubleClickSelect = $config.playlistDoubleClickSelect;
    }

    //default config
    this.started = false;
    this.model = new this._Model();
    this.view = new this._View({
        playlist: "wmp-playlist",
        playButton: "wmp-play",
        stopButton: "wmp-stop",
        fastForwardButton: "wmp-fast-forward",
        rewindButton: "wmp-rewind",
        progressBar: "wmp-progress-bar",
        volumeBar: "wmp-volume-bar",
        muteButton: "wmp-mute",
        currentTrackTime: "wmp-current-track-time",
        currentTrackDuration: "wmp-current-track-duration",
        currentTrackTitle: "wmp-current-track-title",
        container: this.container,
        playlistDoubleClickSelect: $playlistDoubleClickSelect
    });
    this.view.setTemplate('<div class="wmp-panel"><div class="wmp-current-track"><span class="wmp-current-track-title"></span><span class="wmp-timer"><span class="wmp-current-track-time">0:00</span><span class="wmp-current-track-duration">N/A</span></span></div><div class="wmp-controls"><div class="wmp-play wmp-button"><svg class="wmp-button-play" width="18" height="18"><polygon class="wmp-symbol-play" points="2,2 16,9 2,16"/><g class="wmp-symbol-pause"><rect x="2" y="2" width="4" height="14" /><rect x="11" y="2" width="4" height="14" /><rect x="2" y="2" width="14" height="14" fill="transparent" stroke="transparent"/></g></svg></div><div class="wmp-stop wmp-button"><svg class="wmp-button-stop" width="18" height="18"><rect class="wmp-symbol-stop" x="2" y="2" width="14" height="14"/></svg></div><div class="wmp-rewind wmp-button"><svg class="wmp-button-rewind" width="18" height="18"><polygon class="wmp-symbol-rewind" points="2,9 9,2 9,9 16,2 16,16 9,9 9,16"/></svg></div><div class="wmp-fast-forward wmp-button"><svg class="wmp-button-fast-forward" width="18" height="18"><polygon class="wmp-symbol-fast-forward" points="2,2 9,9 9,2 16,9 9,16 9,8 2,16"/></svg></div></div><div class="wmp-volume-bar-container"><div class="wmp-button wmp-mute"><svg width="18" height="18"><g class="wmp-button-volume"><polygon points="2,6 5,6 10,2 10,16 5,12 2,12 " /><g class="wmp-symbol-muted"><path d="M12,4 Q18,9 12,14" fill="transparent" /><path d="M12,7 Q14,9 12,11" fill="transparent" /></g></g></svg></div><div class="wmp-volume-bar"></div></div><div class="wmp-progress-bar-container"><div class="wmp-progress-bar"></div></div></div><div class="wmp-playlist-container"><div class="wmp-playlist"></div><div class="wmp-footer">Powered by: <a href="https://wiserim.github.io/WMPlayer" target="_blank" rel="noopener noreferrer">WMPlayer</a></div></div>');
    this.view.setPlaylistPattern('<div class="$status"><span>$index.</span><span>$title</span><span>$duration</span></div>');
    
    //config arguments
    if ($config !== undefined) {
        //if config is string, node or jquery object
        if (typeof $config == 'string' || $config instanceof String || $config.nodeType !== undefined && $config.nodeType === 1 || window.jQuery && $config instanceof jQuery)
            this.parent($config);
        else {
            if ($config.parent !== undefined) this.parent($config.parent, $config.parentAsTemplate);
            if ($config.template !== undefined) this.template($config.template);
            if ($config.theme !== undefined) this.theme($config.theme);
            if ($config.playlistPattern !== undefined) this.playlistPattern($config.playlistPattern);
            if ($config.controls !== undefined) this.controls($config.controls);
            if ($config.autoplay !== undefined) this.autoplay($config.autoplay);
            if ($config.loop !== undefined) this.loop($config.loop);
            if ($config.volume !== undefined) this.volume($config.volume);
            if ($config.mute !== undefined) this.mute($config.mute);
            if ($config.YTApiKey !== undefined) this.model.setYTApiKey($config.YTApiKey);
            if ($config.YTAutoload !== undefined && $config.YTAutoload) {
                //add YT Iframe API
                if (document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]').length == 0) {
                    var yt = document.createElement("script");
                    yt.src = "https://www.youtube.com/iframe_api";
                    var firstScriptTag = document.getElementsByTagName("script")[0];
                    firstScriptTag.parentNode.insertBefore(yt, firstScriptTag);
                }
            }
            if ($config.playlist !== undefined) {
                $config.playlist.forEach(function($audioTrack) {
                    self.addTrack($audioTrack.url, $audioTrack.title, $audioTrack.duration);
                });
            }
            if ($config.showPlaylist !== undefined) this.showPlaylist($config.showPlaylist);
            if (!($config.start === false)) this.start();
        }
    }

    //attaching event listeners
    //audio track added
    this.model.audioTrackAdded.attach(function() {
        if (self.started) {
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
        if (self.started) {
            var playlist = self.model.getPlaylist();
            var currentTrackIndex = self.model.getCurrentTrackIndex();
            self.view.renderPlaylist(playlist, currentTrackIndex);
        }
    });

    //current track change
    this.model.currentTrackChanged.attach(function() {
        if (self.started) {
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
        if (self.started) {
            self.view.setVolumeBar(self.model.getVolume());
            if (self.model.getMute()) self.view.addContainerClass("muted"); else self.view.removeContainerClass("muted");
        }
    });

    //play
    this.model.audioTrackPlaying.attach(function() {
        self.view.removeContainerClass("paused");
        self.view.addContainerClass("playing");
    });

    //pause
    this.model.audioTrackPaused.attach(function() {
        self.view.removeContainerClass("playing");
        self.view.addContainerClass("paused");
    });

    //stop
    this.model.audioTrackStopped.attach(function() {
        self.view.removeContainerClass("playing");
        self.view.removeContainerClass("paused");
    });

    //audio track end
    this.model.audioTrackEnded.attach(function() {
        var playlistEnded = self.model.nextTrack();
        if (playlistEnded && !self.model.getLoop()) self.model.stop(); else self.model.play();
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
        if (self.model.playing) self.model.pause(); else self.model.play();
    });

    //stop button click
    this.view.stopButtonClicked.attach(function() {
        self.model.stop();
    });

    //fast-forward button click/press
    this.view.fastForwardButtonPressed.attach(function() {
        setTimeout(function() {
            if (self.view.mousedownFlag) {
                self.mouseDown = setInterval(function() {
                    if (self.view.mousedownFlag) self.model.fastForward(); else {
                        clearInterval(self.mouseDown);
                        self.mouseDown = -1;
                    }
                }, 500);
            } else self.nextTrack();
        }, 200);
    });

    //rewind button click/press
    this.view.rewindButtonPressed.attach(function() {
        setTimeout(function() {
            if (self.view.mousedownFlag) {
                self.mouseDown = setInterval(function() {
                    if (self.view.mousedownFlag) self.model.rewind(); else {
                        clearInterval(self.mouseDown);
                        self.mouseDown = -1;
                    }
                }, 500);
            } else self.previousTrack();
        }, 200);
    });

    //progress bar click/press
    this.view.progressBarClicked.attach(function($sender, $args) {
        var duration = self.model.getCurrentTrackDuration();
        var time = Math.floor($args.offsetX / $args.width * duration);
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
        if (self.started) {
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
        if (self.started) {
            var playlist = self.model.getPlaylist();
            var currentTrackIndex = self.model.getCurrentTrackIndex();
            self.view.renderPlaylist(playlist, currentTrackIndex);
        }
    });

    return this;
}

WMPlayer.prototype = {
    //add new audio track
    addTrack: function($url, $title, $duration) {
        if ($title === undefined) $title = "N/A";
        if ($duration === undefined) $duration = "N/A";
        this.model.addAudioTrack($url, $title, $duration);
        return this;
    },

    //remove audio track
    removeTrack: function($index) {
        this.model.delAudioTrack($index);
        return this;
    },

    //set current track
    track: function($index) {
        if ($index === undefined) $index = 0;
        this.model.setAudioTrack($index);
        if (this.started) this.model.play();
        return this;
    },

    //next track
    nextTrack: function() {
        var playlistEnded = this.model.nextTrack();
        if (playlistEnded && !this.model.getLoop()) this.model.stop(); else if (this.model.playing) this.model.play();
        return this;
    },

    //previous track
    previousTrack: function() {
        this.model.previousTrack();
        if (this.model.playing) this.model.play();
        return this;
    },

    //set volume
    volume: function($volume) {
        this.model.setVolume($volume);
        return this;
    },

    //set/toggle mute
    mute: function($mute) {
        this.model.setMute($mute);
        return this;
    },

    //set template
    template: function($template) {
        if ($template === undefined) $template = false;
        if ($template.length > 0) $template = $template[0];
        this.view.setTemplate($template);
        return this;
    },

    //set playlist pattern
    playlistPattern: function($pattern) {
        if ($pattern !== undefined) this.view.setPlaylistPattern($pattern);
        return this;
    },

    //set player parent node
    parent: function($parent, $setAsTemplate) {
        //if parent argument is not provided, set script parent node as parent
        if ($parent === undefined) {
            $parent = (document.currentScript || function() {
                var scripts = document.getElementsByTagName("script");
                return scripts[scripts.length - 1];
            }()).parentNode;
        }

        if (typeof $parent === 'string' || $parent instanceof String)
            $parent = document.querySelector($parent);

        if($parent === null) {
            console.log('DOM element not found.');
            return this;
        }
        
        if ($parent.length > 0)
            $parent = $parent[0];

        this.parentNode = $parent;

        if ($setAsTemplate == true) {
            this.view.setTemplate($parent.innerHTML);
            $parent.innerHTML = "";
        }

        if (this.started)
            this.parentNode.appendChild(this.container);

        return this;
    },

    //set/toggle loop
    loop: function($loop) {
        this.model.setLoop($loop);
        return this;
    },

    //set/toogle autoplay
    autoplay: function($autoplay) {
        this.model.setAutoplay($autoplay);
        return this;
    },

    //set controls classes
    controls: function($elements) {
        this.view.setControls($elements);
        return this;
    },

    //set/toggle playlist display
    showPlaylist: function($show) {
        this.view.setShowPlaylist($show);
        return this;
    },

    //set theme - player's container class
    theme: function($class) {
        this.view.setPlayerClass($class);
        return this;
    },

    //destroy player
    destroy: function() {
        if (this.container.parentNode == this.parentNode) this.parentNode.removeChild(this.container);
        this.started = false;
        return this;
    },

    //start player
    start: function() {
        if (!this.started) {
            this.started = true;
            this.parentNode.appendChild(this.container);

            var mediaContainer = this.container.querySelector(".wmplayer-media");
            mediaContainer.appendChild(this.model.audio);

            //yt iframe
            var yt = mediaContainer.querySelector(".wmplayer-yt");
            yt.id = "wmplayer-yt-" + document.querySelectorAll(".wmplayer .wmplayer-yt").length;
            this.model.YTIframeId = yt.id;

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
            if (mute) this.view.addContainerClass("muted");
            this.view.setCurrentTrackData(currentTrackTitle, currentTrackDuration);
            this.view.renderPlaylist(playlist, currentTrackIndex);
            if (autoplay) {
                this.model.play();
            } else {
                this.view.addContainerClass("paused");
            }
        }

        return this;
    }
};

//WMPlayer event container
WMPlayer.prototype._Event = function($sender) {
    this.sender = $sender;            
    this.listeners = [];
}

WMPlayer.prototype._Event.prototype = {
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
WMPlayer.prototype._Model = function() {
    var self = this;
    var Event = WMPlayer.prototype._Event;
    this.audio = new Audio();
    this.YTApiKey = '';
    this.YTIframeId = '';
    this.YTIframe = false;
    this.playlist = [];
    this.currentTrackIndex = null;
    this.currentTrackType = '';
    this.loop = false;
    this.autoplay = false;
    this.timeChangeRate = 5;
    this.volume = 1;
    this.mute = false;
    this.canPause = true;
    this.playing = false;
    this.YTReady = false;
    this.YTState = -1; // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 video cued
    this.YTQuene = false; //quened command to YouTube Iframe
    this.YTCTInterval = -1; //interval for YoTube video current time updates 
    
    //model events
    this.audioTrackAdded = new Event(this);
    this.audioTrackRemoved = new Event(this);
    this.currentTrackChanged = new Event(this);
    this.audioTrackPlaying = new Event(this);
    this.audioTrackPaused = new Event(this);
    this.audioTrackStopped = new Event(this);
    this.audioTrackEnded = new Event(this);
    this.audioTrackError = new Event(this);
    this.durationChanged = new Event(this);
    this.volumeChanged = new Event(this);
    this.volumeChanged = new Event(this);

    //attach event listeners
    this.audio.addEventListener('play', function() {
        self.audioTrackPlaying.notify();
    });
    this.audio.addEventListener('playing', function() {
        self.audioTrackPlaying.notify();
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

WMPlayer.prototype._Model.prototype = {
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
        //if current track is audio file
        if(this.playlist[this.currentTrackIndex].type == 'audio')
            return this.audio.currentTime;
        //if current track is a YouTube video
        else if(this.YTReady)
            return this.YTIframe.getCurrentTime();
        else return 0;
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
        //if current track is audio file
        if(this.playlist[this.currentTrackIndex].type == 'audio')
            return !(this.audio.paused);
        //if current track is a YouTube video
        else if(this.YTReady && this.YTIframe.getPlayerState() == 1)
            return true;
        else return false;
    },
    
    //add audio track
    addAudioTrack: function($url, $title, $duration) {
        if($title === undefined)
            $title = 'N/A';

        if($duration === undefined)
            $duration = 'N/A';

        var status = 'ready';
        var type = 'audio';
        var parseYT = this.parseYTURL($url);
        if(parseYT) {
            $url = parseYT;
            type = 'yt';
            status = 'ready';
        }

        //if duration is passed
        if($duration !== 'N/A') {
            //if it's integer
            if(typeof $duration === 'number' && isFinite($duration) && Math.floor($duration) === $duration) {
                //do nothing
            }
            //if it's time format: hh:mm:ss
            else if(/^[0-9:]+$/.test($duration)) {
                var hms = $duration.split(':');
                
                if(hms.length === 3) {
                    $duration = (+hms[0]) * 60 * 60 + (+hms[1]) * 60 + (+hms[2]);
                }
                else if(hms.length === 2) {
                    $duration = (+hms[0]) * 60 + (+hms[1]);
                }
                else if(hms.length === 1) {
                    $duration = (+hms[0]);
                }
                else {
                    $duration = 'N/A';
                }
            }
            else {
                $duration = 'N/A';
            }
        }
        
        this.playlist.push({
            title: $title,
            url: $url,
            duration: $duration,
            type: type,
            status: status
        });
        
        this.audioTrackAdded.notify();
        var self = this;
        var index = this.playlist.length - 1;
        //get track metadata
        //if track is audio file
        if(type == 'audio' && $duration === 'N/A') {
            var audio = new Audio();
            //after loading audio track metadata, get track duration
            audio.onloadedmetadata = function($e) {
                var url = '';
                //search track on playlist
                if(self.playlist.length == 0)
                    return;

                for(i=0; i < self.playlist.length; i++){
                    url = self.playlist[i].url.replace('../', '');
                    if(($e.target.src.indexOf(url) >= 0 || $e.target.src.indexOf(encodeURI(url)) >= 0) && self.playlist[i].duration == 'N/A'){
                        self.playlist[i].duration = audio.duration;
                        self.audioTrackAdded.notify();
                        break;
                    }
                }
            };
            
            audio.src = self.playlist[index].url;
            audio.load();
        }
        //if track is YouTube video
        else if(self.playlist[index].type == 'yt' && ($duration === 'N/A' || $title === 'N/A' || !$title)) {
            if(!self.YTApiKey) {
                console.log('YouTube API Key not found.');

                if(self.currentTrackIndex === null)
                    self.setAudioTrack();
                return;
            }
            
            var url = 'https://www.googleapis.com/youtube/v3/videos?key='+self.YTApiKey+'&part=snippet,contentDetails&fields=kind,pageInfo,items(id,snippet(title),contentDetails(duration))&id='+self.playlist[index].url;
            var xhr = new XMLHttpRequest();
            // XHR for Chrome/Firefox/Opera/Safari.
            if('withCredentials' in xhr) {
                xhr.open('GET', url, true);
            }
            //XDomainRequest for IE.
            else if(typeof XDomainRequest !== undefined) {
                try{
                    xhr = new XDomainRequest();
                    xhr.open('GET', url);
                }
                catch(error) {xhr = false; console.log('Error: '+error.message);}
            }
            //CORS not supported.
            else {
                xhr = false;
                console.log('Error: CORS not supported');
            }

            if(xhr) {
                xhr.onload = function() {
                    var response = JSON.parse(xhr.responseText);
                    if(response.kind == 'youtube#videoListResponse')
                        if(response.pageInfo.totalResults > 0) {
                            var item = response.items[0];
                            var i = 0;
                            //search track on playlist
                            if(self.playlist.length == 0)
                                return;

                            for(size = self.playlist.length; i < size; i++)
                            {
                                if(item.id.indexOf(self.playlist[i].url) >= 0) {
                                    if(self.playlist[i].duration == 'N/A'){
                                        duration = self.convertYTDuration(item.contentDetails.duration);
                                        if(duration)
                                            self.playlist[i].duration = duration;
                                    }

                                    if(self.playlist[i].title == 'N/A' || !self.playlist[i].title) {
                                        self.playlist[i].title = item.snippet.title;
                                    }

                                    self.audioTrackAdded.notify();
                                }
                            }
                        }
                }

                xhr.onerror = function() {
                    console.log('Error: Unable to retrieve data from You Tube');
                };
            xhr.send();
            }
        }
        
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
        this.YTQuene = false;
        clearInterval(this.YTCTInterval);
        if($index === undefined)
            $index = 0;

        if(this.currentTrackIndex !== null) {
            if(this.playlist[this.currentTrackIndex].type == 'audio')
                this.audio.pause();
            else if(this.playlist[this.currentTrackIndex].type == 'yt' && this.YTReady)
                this.YTIframe.pauseVideo();
            this.audioTrackPaused.notify();
        }

        if(this.playlist.length > $index && 0 <= $index) {
            if(this.canPause){
                //if current track is audio file
                if(this.playlist[$index].type == 'audio') {
                    this.audio.src = this.playlist[$index].url;
                    this.audio.load();
                }
                //if current track is a YouTube video
                else if(this.playlist[$index].type == 'yt') {
                    if(this.YTIframe) {
                        this.YTIframe.loadVideoById({
                            'videoId': this.playlist[$index].url,
                            'startSeconds': 0,
                            'volume': this.volume,
                            'suggestedQuality': 'small'
                        });
                    }
                    else {
                        this.initYTIframe(this.playlist[$index].url)
                    }
                    this.YTCTInterval = setInterval(function() {self.durationChanged.notify();}, 100);
                }

                this.currentTrackIndex = $index;
                this.currentTrackChanged.notify();
            }
            //wait until you can pause current track
            else {
                var interval = setInterval(function() {
                    if(self.canPause || self.playlist[self.currentTrackIndex].status == 'error') {
                        self.canPause = true;
                        //if current track is audio file
                        if(self.playlist[$index].type == 'audio') {
                            self.audio.src = self.playlist[$index].url;
                            self.audio.load();
                        }
                        //if current track is a YouTube video
                        else {
                            if(self.YTIframe) {
                                self.YTIframe.loadVideoById({
                                    'videoId': self.playlist[$index].url,
                                    'startSeconds': 0,
                                    'suggestedQuality': 'small'
                                });
                            }
                            else {
                                self.initYTIframe(self.playlist[$index].url)
                            }
                            self.YTCTInterval = setInterval(function() {self.durationChanged.notify();}, 100);
                        }
                        self.currentTrackIndex = $index;
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
        if(this.YTIframe) {
            this.YTIframe.setVolume($volume*100);
            this.YTIframe.unMute();
        }
    },
    
    //set mute
    setMute: function($mute) {
        if($mute === undefined)
            this.mute = !this.mute;
        else if($mute)
            this.mute = true;
        else
            this.mute = false;
        
        if(this.mute) {
            this.audio.volume = 0;
            if(this.YTIframe)
                this.YTIframe.mute();
        }
        else {
            this.audio.volume = this.volume;
            if(this.YTIframe)
                this.YTIframe.unMute();
        }
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
        this.playlist[this.currentTrackIndex].status = 'error';
    },
    
    //play current track
    play: function() {
        self = this;
        this.canPause = false;
        if(this.playlist.length == 0)
            return;
        if(this.currentTrackIndex === null)
            this.setAudioTrack();
        
        if(this.currentTrackIndex === null)
            return;

        //if current track is audio file
        if(this.playlist[this.currentTrackIndex].type == 'audio') {
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
        }
        //if current track is a YouTube video
        else if(this.playlist[this.currentTrackIndex].type == 'yt') {
            if(this.YTReady) {
                this.YTIframe.playVideo();
                this.canPause = true;
                this.audioTrackPlaying.notify();

                if(this.playlist[this.currentTrackIndex].duration == 'N/A') {
                    this.playlist[this.currentTrackIndex].duration = this.YTIframe.getDuration();
                    self.playlist[this.currentTrackIndex].status = 'ready';
                    this.durationChanged.notify();
                    this.currentTrackChanged.notify();
                }
            }
            else
                this.YTQuene = 'play';
        }

        this.playing = true;
    },
    
    //pause
    pause: function() {
        //if current track is audio file
        if(this.playlist[this.currentTrackIndex].type == 'audio')
            this.audio.pause();
        //if current track is a YouTube video
        else if(this.YTReady){
            this.YTIframe.pauseVideo();
        }
        else
            this.YTQuene = 'pause';

        this.audioTrackPaused.notify();
        this.playing = false;
    },
    
    //stop
    stop: function() {
        //if current track is audio file
        if(this.playlist[this.currentTrackIndex].type == 'audio') {
            if(this.audio.src) {
                this.audio.pause();
                try {
                    this.audio.currentTime = 0;
                }
                catch(e) {}
                this.audioTrackStopped.notify();
            }
        }
        //if current track is a YouTube video
        else if(this.YTReady) {
            this.YTIframe.pauseVideo();
            this.YTIframe.seekTo(0);
            this.audioTrackStopped.notify();
        }
        else
            this.YTQuene = 'stop';
        this.playing = false;
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
        //if current track is audio file
        if(this.playlist[this.currentTrackIndex].type == 'audio') {
            if(this.audio.src)
                this.audio.currentTime = $time;
        }
        //if current track is a YouTube video
        else if(this.YTReady) {
            this.YTIframe.seekTo($time);
        }
    },
    
    //fast-forward
    fastForward: function() {
        var time = this.getCurrentTime() + this.timeChangeRate;
        //if current track is audio file
        if(this.playlist[this.currentTrackIndex].type == 'audio') {
            if(time < this.audio.duration && time >= 0) {
                if(this.audio.buffered.start(0) <= time && this.audio.buffered.end(0) >= time)
                    this.audio.currentTime = time;
            }
        }
        //if current track is a YouTube video
        else if(this.YTReady) {
                if(time < this.YTIframe.getDuration() && time >= 0) {
                    this.YTIframe.seekTo(time);
                }
        }
    },
    
    //rewind
    rewind: function() {
        var time = this.getCurrentTime() - this.timeChangeRate;
        //if current track is audio file
        if(this.playlist[this.currentTrackIndex].type == 'audio') {
            if(time < this.audio.duration && time >= 0)
                if(this.audio.buffered.start(0) <= time && this.audio.buffered.end(0) >= time)
                    this.audio.currentTime = time;
        }
        //if current track is a YouTube video
        else if(this.YTReady) {
            this.YTIframe.seekTo(time);
        }
    },

    //setYouTube API key
    setYTApiKey: function($key) {
        this.YTApiKey = $key;
    },

    //parse YouTube url
    parseYTURL: function($url) {
        var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
        var match = $url.match(regExp);
        return (match&&match[7].length==11)? match[7] : false;
    },

    //ISO8601 to seconds
    convertYTDuration: function(ISO8601) {
        var regExp = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
          var h = 0, m = 0, s = 0, duration = false;

          if (regExp.test(ISO8601)) {
            var matches = regExp.exec(ISO8601);
            if (matches[1]) h = Number(matches[1]);
            if (matches[2]) m = Number(matches[2]);
            if (matches[3]) s = Number(matches[3]);
            duration = h * 3600  + m * 60 + s;
          }
          return duration;
    },

    //initialize You Tube iframe
    initYTIframe: function($videoId) {
        if(this.YTIframe)
            return;

        //add YT Iframe API
        if (document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]').length == 0) {
            var yt = document.createElement("script");
            yt.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName("script")[0];
            firstScriptTag.parentNode.insertBefore(yt, firstScriptTag);
        }

        var self = this;
        
        var interval = setInterval(function() {
            if(self.YTIframe)
                clearInterval(interval);
            
            else if(typeof YT !== 'undefined' && YT.loaded) {
                self.YTIframe = new YT.Player(self.YTIframeId, {
                    videoId: $videoId,
                    playerVars: {
                        'autoplay': 0,
                        'controls': 0,
                        //'origin': window.location
                    },
                    events: {
                        'onReady': function(e){
                            self.YTReady = true;
                            e.target.setVolume(self.volume*100);
                            if(self.mute)
                                e.target.mute();

                            if(self.YTQuene) {
                                switch(self.YTQuene) {
                                    case 'play':
                                        self.play();
                                        break;
                                    case 'pause':
                                        self.pause();
                                        break;
                                    case 'stop':
                                        self.stop();
                                        break;
                                }
                                self.YTquene = false;
                            }
                        },
                        'onStateChange': function(e){
                            self.YTState = self.YTIframe.getPlayerState()
                            if(self.YTState === 0)
                                self.audioTrackEnded.notify();
                        },
                        'onError': function() {self.audioTrackError.notify()}
                    }
                });

                clearInterval(interval);
            }
        }, 10);  
        
    }
};

//WMPlayer view
WMPlayer.prototype._View = function($elements) {
    var self = this;
    var Event = WMPlayer.prototype._Event;
    this.elements = $elements;
    this.template = null;
    this.playlistPattern = '';
    this.playerClass = 'default';
    this.playlistDoubleClickSelect = false;
    this.container = this.elements.container;
    this.mousedownFlag = false;
    this.showPlaylist = true;
    this.dragged = false;
    this.mouseOnVolumeBar = false;
    this.mouseOnProgressBar = false;

    //config arguments
    if (this.elements.playlistDoubleClickSelect !== undefined) this.playlistDoubleClickSelect = this.elements.playlistDoubleClickSelect;
    
    
    //view events
    this.playButtonClicked = new Event(this);
    this.stopButtonClicked = new Event(this);
    this.fastForwardButtonPressed = new Event(this);
    this.rewindButtonPressed = new Event(this);
    this.progressBarClicked = new Event(this);
    this.volumeBarClicked = new Event(this);
    this.muteButtonClicked = new Event(this);
    this.playlistElementClicked = new Event(this);
    this.playlistElementDoubleClicked = new Event(this);
    this.templateModified = new Event(this);
    this.playlistPatternModified = new Event(this);
    
    //attach event listeners
    //click inside WMPlayer container
    this.container.addEventListener("click", function($e) {
        //get event traget's ancestors
        var targetParents = self.getParentsNodes($e.target, self.elements.container);

        //if playlist double click mode is disabled
        if(!self.playlistDoubleClickSelect) {
            //playlist item click
            var playlistItem = self.isParent(targetParents, 'wmp-playlist-item');
            if(playlistItem) {
                var  i= 0;
                while((playlistItem=playlistItem.previousSibling) !== null)
                    ++i;
                self.playlistElementDoubleClicked.notify({
                    trackId: i
                });
            }
        }
        
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
        //if playlist double click mode is disabled
        if(!self.playlistDoubleClickSelect)
            return;
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

WMPlayer.prototype._View.prototype = {
    //render player
    renderPlayer: function() {
        if(this.template !== null)
            this.elements.container.getElementsByClassName('wmplayer-body')[0].innerHTML = this.template;
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
                    if($playlist[i].status == 'error')
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
        var self = this;
        var $classes = $newClassName.split(' ');
        if(this.elements.container.classList !== undefined)
            $classes.forEach(function ($class) {
                self.elements.container.classList.add($class);
            }); 
        else {
            var elClass = ' ' + this.elements.container.className + ' ';
            $classes.forEach(function ($class) {
                if(elClass.indexOf(' ' + $class + ' ') == -1)
                    self.elements.container.className += ' '+$class;
            });
        }
    },
    
    //remove class from WMPlayer container
    removeContainerClass: function($removedClassName) {
        var self = this;
        var $classes = $removedClassName.split(' ');

        if(this.elements.container.classList !== undefined)
            $classes.forEach(function ($class) {
                self.elements.container.classList.remove($class);
            });
        else {
            var elClass = ' ' + this.elements.container.className + ' ';
            $classes.forEach(function ($class) {
                var reg = new RegExp(' '+$class+' ', 'g');
                elClass = elClass.replace(reg, ' ');
                self.elements.container.className = elClass.trim();
            });
        }
    },

    //sets WMPlayer container's style class
    setPlayerClass: function($newClass) {
        this.removeContainerClass(this.playerClass);
        this.addContainerClass($newClass);
        this.playerClass = $newClass;
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
