/*!
* WMPlayer v1.0.0
* Copyright 2016-2024 Marcin Walczak
*This file is part of WMPlayer which is released under MIT license.
*See LICENSE for full license details.
*/

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
        if(type == 'audio' && $duration !== 'N/A') {
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
        else if(self.playlist[index].type == 'yt' && $duration !== 'N/A') {
            if(!self.YTApiKey) {
                self.playlist[index].status = 'error';
                console.log('YouTube API Key not found.');

                if(self.currentTrackIndex === null)
                    self.setAudioTrack();
                return;
            }
            
            var url = 'https://www.googleapis.com/youtube/v3/videos?key='+self.YTApiKey+'&part=contentDetails&id='+self.playlist[index].url;
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
                                if(item.id.indexOf(self.playlist[i].url) >= 0 && self.playlist[i].duration == 'N/A'){
                                    duration = self.convertYTDuration(item.contentDetails.duration);
                                    if(duration)
                                        self.playlist[i].duration = duration;
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
                else if(this.playlist[$index].type == 'yt' && this.YTApiKey != '') {
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
            if(!self.YTApiKey) {
                console.log('YouTube API Key not found.');
                self.canPause = true;
                self.audioTrackError.notify();
            }
             
            if(this.YTReady) {
                this.YTIframe.playVideo();
                this.canPause = true;
                this.audioTrackPlaying.notify();
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
                        'origin': window.location
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
