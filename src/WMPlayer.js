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
    if (document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]').length == 0) {
        var yt = document.createElement("script");
        yt.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode.insertBefore(yt, firstScriptTag);
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
        container: this.container
    });
    this.view.setTemplate('<div class="wmp-panel"><div class="wmp-current-track"><span class="wmp-current-track-title"></span><span class="wmp-timer"><span class="wmp-current-track-time">0:00</span><span class="wmp-current-track-duration">N/A</span></span></div><div class="wmp-controls"><div class="wmp-play wmp-button"><svg class="wmp-button-play" width="18" height="18"><polygon class="wmp-symbol-play" points="2,2 16,9 2,16"/><g class="wmp-symbol-pause"><rect x="2" y="2" width="4" height="14" /><rect x="11" y="2" width="4" height="14" /><rect x="2" y="2" width="14" height="14" fill="transparent" stroke="transparent"/></g></svg></div><div class="wmp-stop wmp-button"><svg class="wmp-button-stop" width="18" height="18"><rect class="wmp-symbol-stop" x="2" y="2" width="14" height="14"/></svg></div><div class="wmp-rewind wmp-button"><svg class="wmp-button-rewind" width="18" height="18"><polygon class="wmp-symbol-rewind" points="2,9 9,2 9,9 16,2 16,16 9,9 9,16"/></svg></div><div class="wmp-fast-forward wmp-button"><svg class="wmp-button-fast-forward" width="18" height="18"><polygon class="wmp-symbol-fast-forward" points="2,2 9,9 9,2 16,9 9,16 9,8 2,16"/></svg></div></div><div class="wmp-volume-bar-container"><div class="wmp-button wmp-mute"><svg width="18" height="18"><g class="wmp-button-volume"><polygon points="2,6 5,6 10,2 10,16 5,12 2,12 " /><g class="wmp-symbol-muted"><path d="M12,4 Q18,9 12,14" fill="transparent" /><path d="M12,7 Q14,9 12,11" fill="transparent" /></g></g></svg></div><div class="wmp-volume-bar"></div></div><div class="wmp-progress-bar-container"><div class="wmp-progress-bar"></div></div></div><div class="wmp-playlist-container"><div class="wmp-playlist"></div><div class="wmp-footer">Powered by: <a href="https://github.com/wiserim/WMPlayer" target="_blank" rel="noopener noreferer">WMPlayer</a></div></div>');
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
        if (playlistEnded && !self.loop) self.model.stop(); else self.model.play();
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
            if (autoplay) this.model.play(); else this.view.addContainerClass("paused");
        }

        return this;
    }
};
