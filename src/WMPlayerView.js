/*!
* WMPlayer v1.0.0
* Copyright 2016-2024 Marcin Walczak
*This file is part of WMPlayer which is released under MIT license.
*See LICENSE for full license details.
*/

//WMPlayer view
WMPlayer.prototype._View = function($elements) {
    var self = this;
    var Event = WMPlayer.prototype._Event;
    this.elements = $elements;
    this.template = null;
    this.playlistPattern = '';
    this.playerClass = 'default';
    this.container = this.elements.container;
    this.mousedownFlag = false;
    this.showPlaylist = true;
    this.dragged = false;
    this.mouseOnVolumeBar = false;
    this.mouseOnProgressBar = false;
    
    
    //view events
    this.playButtonClicked = new Event(this);
    this.stopButtonClicked = new Event(this);
    this.fastForwardButtonPressed = new Event(this);
    this.rewindButtonPressed = new Event(this);
    this.progressBarClicked = new Event(this);
    this.volumeBarClicked = new Event(this);
    this.muteButtonClicked = new Event(this);
    this.playlistElementDoubleClicked = new Event(this);
    this.templateModified = new Event(this);
    this.playlistPatternModified = new Event(this);
    
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
