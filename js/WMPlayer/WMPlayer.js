/*!
* WMPlayer v0.4.05 (http://WMPlayer.net)
* Copyright 2016-2017 Marcin Walczak
*This file is part of WMPlayer which is released under MIT license.
*See file LICENSE.txt or go to http://WMPlayer.net for full license details.
*/

/*
Klasa WMPlayer stanowi kontroler.
Obsługuje interakcje z użytkownikiem, aktualizuje model, oraz odświeża widok.
*/

//konstruktor
function WMPlayer($config) {
    var self = this;    //autoreferencja
    //aktualnie wykonywany element <script>
    this.currentScript = document.currentScript || (function() {
        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();
    //ustwanienie rodzica kontenera odtwarzacza
    this.parentNode = (this.currentScript[this.currentScript.length - 1] || this.currentScript).parentNode;
    //utworzenie kontenera odtwarzacza
    this.container = document.createElement('div');
    this.container.classList.add('WMPlayer');
    
    //konfiguracja
    this.playlistAutoplay = false;              //autoodtwarzanie
    this.playlistLoop = false;                    //odtwarzanie w pętli
    this.started = false;                           //flaga uruchomienia aplikacji
    this.mouseDown = -1;                        //kontener pętli używanej do przewijania utworu
    this.model = new WMPlayerModel();    //model
    //jeśli przekazano argumenty konfiguracyjne
    if ($config != undefined) {
        //jeśli podano w argumentach rodzica kontenera odtwarzacza, ustaw go
        if ($config.parent != undefined) this.parentNode = $config.parent;
        //jeśli podano pojedynczy argument, ustaw rodzica kontenera odtwarzacza
        else if ($config.nodeType > 0) this.parentNode = $config;
        if ($config.autoplay != undefined) this.playlistAutoplay = $config.autoplay;    //jeśli podano, ustaw autoodtwarzanie
        if ($config.loop != undefined) this.playlistLoop = $config.loop;                      //jeśli podano, ustaw odtwarzanie w pętli
        if ($config.volume != undefined) this.model.setVolume($config.volume);       //jeśli podano, ustaw głośność
        //jeśli podano, dodaj utwory do listy odtwarzania
        if ($config.playlist != undefined) {
            $config.playlist.forEach(function($audioTrack) {
                self.model.addAudioTrack($audioTrack.url, $audioTrack.title);
            });
        }
    };
    
    //widok
    this.view = new WMPlayerView({
        playlist: 'WMP-playlist',
        playButton: 'WMP-play',
        stopButton: 'WMP-stop',
        fastForwardButton: 'WMP-fastForward',
        rewindButton: 'WMP-rewind',
        progressBar: 'WMP-progressBar',
        volumeBar: 'WMP-volumeBar',
        currentTrackTime: 'WMP-currentTrackTime',
        currentTrackDuration: 'WMP-currentTrackDuration',
        currentTrackTitle: 'WMP-currentTrackTitle',
        container: this.container
    });
    //ustawienie domyślnego szablonu
    this.view.setTemplate('<div class="default"><a class="WMP-logo"href="http://wmplayer.net"target="_blank">WMPlayer</a><div class="currentTrackData"><span class="WMP-currentTrackTitle">N/A</span><div class="timer"><span class="WMP-currentTrackTime">0:00</span>/<span class="WMP-currentTrackDuration">0:00</span></div><div class="clear-fix"></div></div><div class="controlPanel"><div class="control-buttons"><svg class="WMP-play WMP-button"width="25"height="25"><defs><filter id="filter-blur"><feOffset result="offOut"in="SourceGraphic"dx="0"dy="0"/><feGaussianBlur result="blurOut"in="offOut"stdDeviation="1"/><feBlend in="SourceGraphic"in2="blurOut"mode="normal"/></filter></defs><g class="play"style="transform: translate(3px,3px);"><polygon class="shadow"points="0,0 20,10 0,20"filter="url(#filter-blur)"/><polygon class="symbol"points="0,0 20,10 0,20"/></g><g class="pause"style="transform: translate(3px,3px);"><rect class="shadow"x="0"y="0"width="7"height="20"filter="url(#filter-blur)"/><rect class="shadow"x="13"y="0"width="7"height="20"filter="url(#filter-blur)"/><rect class="symbol"x="0"y="0"width="7"height="20"/><rect class="symbol"x="13"y="0"width="7"height="20"/><rect x="0"y="0"width="20"height="20"fill="transparent"/></g></svg><svg class="WMP-stop WMP-button"width="25"height="25"><g style="transform: translate(3px,3px);"><rect class="shadow"x="0"y="0"width="20"height="20"filter="url(#filter-blur)"/><rect class="symbol"x="0"y="0"width="20"height="20"/></g></svg><svg class="WMP-rewind WMP-button"width="25"height="25"><g class="bwr"style="transform: translate(3px,3px);"><polygon class="shadow"points="0,10 10,0 10,10 20,0 20,20 10,10 10,20"filter="url(#filter-blur)"/><polygon class="symbol"points="0,10 10,0 10,10 20,0 20,20 10,10 10,20"/></g></svg><svg class="WMP-fastForward WMP-button"width="25"height="25"><g class="fwd"style="transform: translate(3px,3px);"><polygon class="shadow"points="0,0 10,10 10,0 20,10 10,20 10,10 0,20"filter="url(#filter-blur)"/><polygon class="symbol"points="0,0 10,10 10,0 20,10 10,20 10,10 0,20"/></g></svg></div><div class="volume"><svg width="25"height="25"><g style="transform: translate(3px,3px);"><polygon class="symbol"points="0,6 5,6 15,0 15,20 5,13 0,13 "/><path class="symbol"d="M17,2 Q25,10 17,18"fill="transparent"stroke-width="1"/><path class="symbol"d="M17,5 Q20,10 17,15"fill="transparent"stroke-width="1"/></g></svg><div class="volumeBarFrame"><div class="WMP-volumeBar"></div></div></div></div><div><div class="progressBarFrame"><div class="WMP-progressBar"></div></div></div><div class="playlistContainer"><div class="playlist-container"><table class="WMP-playlist"></table></div></div></div>');
    
    //podpinanie reakcji na zdarzenia
    //zdarzenia modelu
    //dodanie utworu
    this.model.audioTrackAdded.attach(function() {
        //jeśli uruchomiono aplikację
        if (self.started) {
            var playlist = self.model.getPlaylist();                                                        //lista odtwarzania
            var currentTrackIndex = self.model.getCurrentTrackIndex();                      //indeks aktualnego utworu
            var currentTrackTitle = self.model.getCurrentTrackTitle();                          //tytuł aktualnego utworu
            var currentTrackDuration = self.model.getCurrentTrackDuration();             //czas trwania aktualnego utworu
            self.view.renderPlaylist(playlist, currentTrackIndex);                                  //odśwież listę odtwarzania
            self.view.setCurrentTrackData(currentTrackTitle, currentTrackDuration);     //odśwież dane aktualnego utworu
        }
    });
    
    //usunięcie utworu
    this.model.audioTrackRemoved.attach(function() {
        //jeśli uruchomiono aplikację
        if (self.started) {
            var playlist = self.model.getPlaylist();                                        //lista odtwarzania
            var currentTrackIndex = self.model.getCurrentTrackIndex();      //indeks aktualnego utworu
            self.view.renderPlaylist(playlist, currentTrackIndex);                   //odśwież listę odtwarzania
        }
    });
    
    //zmiana aktualnego utworu
    this.model.currentTrackChanged.attach(function() {
        //jeśli uruchomiono aplikację
        if (self.started) {
            var playlist = self.model.getPlaylist();                                                        //lista odtwarzania
            var currentTrackIndex = self.model.getCurrentTrackIndex();                      //indeks aktualnego utworu
            var currentTrackTitle = self.model.getCurrentTrackTitle();                          //tytuł aktualnego utworu
            var currentTrackDuration = self.model.getCurrentTrackDuration();             //czas trwania aktualnego utworu
            self.view.renderPlaylist(playlist, currentTrackIndex);                                  //odśwież listę odtwarzania
            self.view.setCurrentTrackData(currentTrackTitle, currentTrackDuration);     //odśwież dane aktualnego utworu
        }
    });
    
    //zmiana poziomu głośności
    this.model.volumeChanged.attach(function() {
         //jeśli uruchomiono aplikację, ustaw paski głośności
        if (self.started) {
            var volume = self.model.getVolume();
            self.view.setVolumeBar(volume);
        }
    });
    
    //odtwarzanie utworu - zmiana klasy kontenera odtwarzacza
    this.model.audioTrackPlaying.attach(function() {
        self.view.removeContainerClass('paused');
        self.view.addContainerClass('playing');
    });
    
    //wstrzymanie odtwarzania utworu - zmiana klasy kontenera odtwarzacza
    this.model.audioTrackPaused.attach(function() {
        self.view.removeContainerClass('playing');
        self.view.addContainerClass('paused');
    });
    
    //zatrzymanie odtwarzania utworu - zmiana klasy kontenera odtwarzacza
    this.model.audioTrackStopped.attach(function() {
        self.view.removeContainerClass('playing');
        self.view.removeContainerClass('paused');
    });
    
    //zakończenie odtwarzania utworu
    this.model.audioTrackEnded.attach(function() {
        var playlistEnded = self.model.nextTrack();                         //nastepny utwór
        if (playlistEnded && !(self.playlistLoop)) self.model.stop();     //jeśli lista odtwarzania się skończyła i nie włączono odtwarzania w pętli, zatrzymaj odtwarzanie
        else self.model.play();                                                       //w przeciwnym wypadku, kontynuuj odtwarzanie
    });
    
    //zmiana czasu odtwarzania utworu
    this.model.durationChanged.attach(function() {
        var currentTime = self.model.getCurrentTime();            //czas odtwarzania aktualnego utworu
        var duration = self.model.getCurrentTrackDuration();    //czas trwania aktualnego utworu
        self.view.setProgressBar(currentTime, duration);            //ustawienie pasków postepu
        self.view.setCurrentTime(currentTime);                         //ustawienie czasu odtwarzania aktualnego utworu
    });
    
    //bład elementu Audio
    this.model.audioTrackError.attach(function() {
        self.model.setCurrentTrackError();  //ustawienie flagi błędu dla aktualnego utworu
        self.nextTrack();                            //nastepny utwór
    });
    
    //zdarzenia widoku
    //klikniecie przycisku odtwarzania/wsztrzymania odtwarzania
    this.view.playButtonClicked.attach(function() {
        if (self.model.audio.paused) self.model.play();     //jeśli utwór  nie jest odtwarzany, odtwarzaj go
        else self.model.pause();                                    //w przeciwnym wypadku, wstrzymaj odtwarzanie
    });
    
    //kliknięcie przycisku zatrzymania odtwarzania
    this.view.stopButtonClicked.attach(function() {
        self.model.stop();  //zatrzymaj odtwarzanie
    });
    
    //wciśnięcie przycisku przewijania do przodu/następnego utworu
    this.view.fastForwardButtonPressed.attach(function() {
        //opóźnienie pętli
        setTimeout(function() {
            //jeśli jest ustawiona flaga wciśnięcia przycisku myszy, przwijaj do przodu
            if (self.view.mousedownFlag) {
                self.mouseDown = setInterval(function() {
                    if (self.view.mousedownFlag) self.model.fastForward();
                    else {
                        clearInterval(self.mouseDown);
                        self.mouseDown = -1;
                    }
                }, 500);
            } else self.nextTrack();    //w przeciwnym wypadku, ustaw następny utwór
        }, 200);
    });
    
    //wciśnięcie przycisku przewijania wstecz/poprzedniego utworu
    this.view.rewindButtonPressed.attach(function() {
        //opóźnienie pętli
        setTimeout(function() {
            //jeśli jest ustawiona flaga wciśnięcia przycisku myszy, przwijaj do przodu
            if (self.view.mousedownFlag) {
                self.mouseDown = setInterval(function() {
                    if (self.view.mousedownFlag) self.model.rewind();
                    else {
                        clearInterval(self.mouseDown);
                        self.mouseDown = -1;
                    }
                }, 500);
            } else self.previousTrack();    //w przeciwnym wypadku, ustaw poprzedni utwór
        }, 200);
    });
    
    //kliknięcie paska postepu
    this.view.progressBarClicked.attach(function($sender, $args) {
        var duration = self.model.getCurrentTrackDuration();                  //czas trwania aktualnego utworu
        var time = Math.floor(($args.offsetX / $args.width) * duration);    //nowy czas odtwarzania
        self.model.setTime(time);                                                           //ustwienie czasu odtwarzania
    });
    
    //kliknięcie paska głośności
    this.view.volumeBarClicked.attach(function($sender, $args) {
        var volume = $args.offsetX / $args.width;   //nowy poziom głośności
        self.model.setVolume(volume);                   //ustwanienie poziomu głośności
    });
    
    //podwójne klikniecie na liste odtwarzania
    this.view.playlistElementDoubleClicked.attach(function($sender, $args) {
        self.model.setAudioTrack($args.trackId);    //wybranie aktualnego utworu
        self.model.play();                                      //odtwarzanie utworu
    });
    
    //zmiana szablonu
    this.view.templateModified.attach(function() {
        //jeśli uruchomiono aplikację
        if (self.started) {
            var currentTrackTitle = self.model.getCurrentTrackTitle();                        //tytuł aktualnego utworu
            var currentTrackDuration = self.model.getCurrentTrackDuration();            //czas trwania aktualnego utworu
            var playlist = self.model.getPlaylist();                                                      //lista odtwarzania
            var currentTrackIndex = self.model.getCurrentTrackIndex();                    //indeks aktualnego utworu
            self.view.renderPlayer();                                                                         //odświeżenie widoku odtwarzacza
            self.view.setCurrentTrackData(currentTrackTitle, currentTrackDuration);     //ustawienie danych aktualnego utworu
            self.view.renderPlaylist(playlist, currentTrackIndex);                                  //odświeżenie listy odtwarzania
        }
    });
}

//funkcje
WMPlayer.prototype = {
    
    //dodanie nowego utworu
    addAudioTrack: function($url, $title) {
        if ($title == undefined) $title = 'N/A';
        this.model.addAudioTrack($url, $title);
    },
    
    //usunięcie utworu
    removeAudioTrack: function($index) {
        this.model.delAudioTrack($index);
    },
    
    //wybór aktualnego utworu
    track: function($index) {
        if ($index == undefined) $index = 0;
        this.model.setAudioTrack($index);
        if (this.started) this.model.play();
    },
    
    //nastepny utwór
    nextTrack: function() {
        var playing = this.model.isPlaying() || this.model.audio.ended;
        var playlistEnded = this.model.nextTrack();
        if (playlistEnded && !(this.playlistLoop)) this.model.stop();
        else if (playing) this.model.play();
    },
    
    //poprzedni utwór
    previousTrack: function() {
        var playing = this.model.isPlaying();
        this.model.previousTrack();
        if (playing) this.model.play();
    },
    
    //ustawienie poziomu głośności
    volume: function($volume) {
        if ($volume == undefined) return this.model.getVolume();
        this.model.setVolume($volume);
    },
    
    //ustawienie szablonu
    template: function($template) {
        if ($template == undefined) $template = false;
        this.view.setTemplate($template);
    },
    
    //ustawienie rodzica kontenera odtwarzacza
    parent: function($parent) {
        if ($parent === undefined) $parent = (document.currentScript || (function() {
            var scripts = document.getElementsByTagName("script");
            return scripts[scripts.length - 1];
        })()).parentNode;
        this.parentNode = $parent;
        if (this.started) this.parentNode.appendChild(this.container);
    },
    
    //odtwarzanie w pętli
    loop: function($loop) {
        if ($loop) this.playlistLoop = true;
        else this.playlistLoop = false;
    },
    
    //auoodtwarzanie
    autoplay: function($autoplay) {
        if ($autoplay) this.playlistAutoplay = true;
        else this.playlistAutoplay = false;
    },
    
    //uruchomienie aplikacji
    start: function() {
        //jeśli jeszcze nie uruchomiono aplikacji
        if (!this.started) {
            this.started = true;                                                                                //ustawienie flagi uruchomienia aplikacji
            this.parentNode.appendChild(this.container);                                           //wstawienie kontenera odtwarzacza do rodzica
            var currentTrackTitle = this.model.getCurrentTrackTitle();                        //tytuł aktualnego utworu
            var currentTrackDuration = this.model.getCurrentTrackDuration();            //czas trwania aktualnego utworu
            var playlist = this.model.getPlaylist();                                                      //lista odtwarzania
            var currentTrackIndex = this.model.getCurrentTrackIndex();                    //indeks aktualnego utworu
            var volume = this.model.getVolume();                                                    //poziom głośności
            this.view.renderPlayer();                                                                         //wyświetlenie odtwarzacza
            this.view.setProgressBar();                                                                       //ustawienie paska postepu
            this.view.setVolumeBar(volume);                                                             //ustawienie paska głośnosci
            this.view.setCurrentTrackData(currentTrackTitle, currentTrackDuration);     //ustawienie danych aktualnego utworu
            this.view.renderPlaylist(playlist, currentTrackIndex);                                  //wyświetlenie listy odtwarzania
            if (this.playlistAutoplay) this.model.play();                                               //jeśli właczono autoodtwarzanie, odtwarzaj
        }
    }
}