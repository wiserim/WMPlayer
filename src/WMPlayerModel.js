/*!
* WMPlayer v0.6.4
* Copyright 2016-2017 Marcin Walczak
*This file is part of WMPlayer which is released under MIT license.
*See LICENSE for full license details.
*/

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
