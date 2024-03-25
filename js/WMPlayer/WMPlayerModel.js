/*!
* WMPlayer v0.4.05 (http://WMPlayer.net)
* Copyright 2016-2017 Marcin Walczak
*This file is part of WMPlayer which is released under MIT license.
*See file LICENSE.txt or go to http://WMPlayer.net for full license details.
*/

/*
Klasa WMPlayerModel przechowuje, przetwarza i udostepnia dane dot. listy odtwarzania i aktualnej scieżki dźwiękowej.
Informuje również kontroler o wystepujących w nich zdarzeniach.
*/
//konstruktor
function WMPlayerModel() {
    this.audio = new Audio();                                   //obiekt Audio do odtwarzania plików dźwiękowych
    this.playlist = [];                                                //tablica listy odtwarzania
    this.currentTrackIndex = null;                            //indeks aktualnego utworu
    var self = this;                                                  //autoreferencja
    this.timeChangeRate = 5;                                   //wartość skoku w czasie przy przewijaniu (w sekundach)
    
    //zdarzenia wystepujace w modelu
    this.audioTrackAdded = new Event(this);            //dodanie utworu
    this.audioTrackRemoved = new Event(this);       //usunięcie utworu
    this.currentTrackChanged = new Event(this);     //zmiana aktualnego utworu
    this.audioTrackPlaying = new Event(this);          //odtwarzanie utworu
    this.audioTrackPaused = new Event(this);          //wstrzymanie odtwarzania utworu
    this.audioTrackStopped = new Event(this);         //zatrzymanie odtwarzania utworu
    this.audioTrackEnded = new Event(this);            //zakończenie odtwarzania utworu
    this.audioTrackError = new Event(this);             //błąd obiektu Audio
    this.durationChanged = new Event(this);           //zmiana czasu trwania utworu
    this.volumeChanged = new Event(this);            //zmiana poziomu głośności utworu
    
    //podpięcie standardowych zdarzeń
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

//funkcje
WMPlayerModel.prototype = {
    //wydanie listy odtwarzania
    getPlaylist: function() {
        return this.playlist;
    },
    
    //wydanie indeksu aktualnego utworu
    getCurrentTrackIndex: function() {
        return this.currentTrackIndex;
    },
    
    //wydanie tytułu aktualnego tytułu
    getCurrentTrackTitle: function() {
        if (this.currentTrackIndex == null) return '';
        else return this.playlist[this.currentTrackIndex].getTitle();
    },
    
    //wydanie czasu trwania aktualnego utworu
    getCurrentTrackDuration: function() {
        if (this.currentTrackIndex == null) return 0;
        var duration = this.playlist[this.currentTrackIndex].getDuration();
        //jeśli wartość nie jest liczbą wydaj 0
        if (isNaN(duration)) return 0;
        else return duration;
    },
    
    //wydanie czasu odtwarzania aktualnego utworu
    getCurrentTime: function() {
        return this.audio.currentTime;
    },
    
    //wydanie poziomu głośności
    getVolume: function() {
        return this.audio.volume;
    },
    
    //wydanie informacji czy aktualny utwór jest odtwarzany
    isPlaying: function() {
        return !(this.audio.paused);
    },
    
    //dodanie nowego utworu do listy odtwarzania
    addAudioTrack: function($url, $title) {
        if ($title == undefined) $title = 'N/A';
        this.playlist.push(new AudioTrack($url, $title));   //dodanie utworu do listy odtwarzania
        this.audioTrackAdded.notify();                           //poinformowanie o dodaniu utworu
        var self = this;                                                 //referencja do funkcji
        var index = this.playlist.length - 1;                    //indeks nowego utworu
        var audio = new Audio();                                  //utworzenie obiektu Audio do odczytu metadanych utworu
        //po załadowaniu metadanych utworu, odczytaj czas trwania utworu
        audio.onloadedmetadata = function($e) {
            var i = 0;
            //wyszukiwanie pozycji na liście odtwarzania
            if (self.playlist.length == 0) return;
            while ((!($e.target.src.indexOf(self.playlist[i].getUrl()) >= 0 || $e.target.src.indexOf(encodeURI(self.playlist[i].getUrl())) >= 0) || self.playlist[i].getDuration() != 'N/A') && i < self.playlist.length) {
                i++;
            }
            if (!($e.target.src.indexOf(self.playlist[i].getUrl()) >= 0 || $e.target.src.indexOf(encodeURI(self.playlist[i].getUrl())))) return;
            self.playlist[i].setDuration(audio.duration);   //ustawienie czasu trwania utworu
            self.audioTrackAdded.notify();                     //poinformowanie o dodaniu utworu
        };
        
        audio.src = self.playlist[index].getUrl();            //ustawienie adresu źródłowego pliku dźwiękowego
        audio.load();                                                  //wymuszenie załadowania pliku dźwiękowego
        //jeśli nie wybrano aktualnego utworu, wybierz pierwszą pozycję na liście odtwarzania
        if (self.currentTrackIndex == null) self.setAudioTrack();
    },
    
    //usunięcie utworu z listy odtwarzania
    delAudioTrack: function($index) {
        //jeśli lista odtwarzania jest pusta, nie rób nic
        if (this.playlist.length == 0) return;
        //jeśli nie podano indeksu, usuń ostatni utwór
        if ($index === undefined) $index = this.playlist.length - 1;
        this.playlist.splice($index, 1);
        //jeśli usunięto aktualny utwór, wybierz nowy w jego miejsce
        if ($index == this.currentTrackIndex) {
            var playing = this.isPlaying();
            this.stop();
            if (this.playlist.length == 0) this.setAudioTrack();
            else if (this.currentTrackIndex >= this.playlist.length) this.setAudioTrack($index - 1);
            else this.setAudioTrack($index);
            if (playing) this.play();
        } else if ($index < this.currentTrackIndex) {
            this.currentTrackIndex--;
        }
        this.audioTrackRemoved.notify();        //poinformowanie o usunięciu utworu
    },
    
    //wybrór aktualnego utworu
    setAudioTrack: function($index) {
        //jeśli nie podano indeksu, wybierz pierwszwy utwór na liście odtwarzania
        if ($index == undefined) $index = 0;
        //jeśli utwór o podanym indeksie istnieje, wybierz go
        if (this.playlist.length > $index && 0 <= $index) {
            this.audio.src = this.playlist[$index].getUrl();
            this.currentTrackIndex = $index;
            this.audio.load();
            this.currentTrackChanged.notify();      //poinformowanie o zmianie aktualnego utworu
        } else this.currentTrackIndex = null;
    },
    
    //ustawienie poziomu głośności
    setVolume: function($volume) {
        //jeśli nie podano poziomu głośności, lub podano niewłaściwą wartość, ustaw głośność na 1
        if ($volume == undefined) $volume = 1;
        if ($volume < 0 || $volume > 1) this.audio.volume = 1;
        else this.audio.volume = $volume;
    },
    
    //ustwaienie flagi błędu utworu
    setCurrentTrackError: function() {
        this.playlist[this.currentTrackIndex].setError(true);
    },
    
    //odtwarzanie aktualnego utworu
    play: function() {
        //jeśli lista odtwarzania jest pusta, nie rób nic
        if (this.playlist.length == 0) return;
        //jeśli nie wybrano utworu, wybierz pierwszą pozycję z listy odtwarzania
        if (!(this.audio.src) || this.audio.src == '') {
            this.setAudioTrack();
        }
        this.audio.play();
    },
    
    //wsztrymanie odtwarzania
    pause: function() {
        this.audio.pause();
    },
    
    //zatrzymanie odtwarzania
    stop: function() {
        if (this.audio.src) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audioTrackStopped.notify();    //poinformowanie o zatrzymaniu odtwarzania
        }
    },
    
    //nastepny utwór
    nextTrack: function() {
        var playlistEnd = false;
        //jeśli aktualny utwór nie jest ostatnią pozycją na liście odtwarzania, wybierz następny utwór
        if (this.currentTrackIndex < this.playlist.length - 1) this.setAudioTrack(this.currentTrackIndex + 1);
        //w przeciwnym wypadku, wybierz pierwszy utwór
        else {
            this.setAudioTrack();
            playlistEnd = true;
        }
        this.currentTrackChanged.notify();  //poinformowanie o zmianie aktualnego utworu
        return playlistEnd;                         //wydanie flagi, czy to był koniec listy odtwarzania
    },
    
    //poprzedni utwór
    previousTrack: function() {
        //jeśli aktualny utwór nie jest pierwszy, wybierz poprzedni utwór
        if (this.currentTrackIndex > 0) {
            this.setAudioTrack(this.currentTrackIndex - 1);
        } else this.setAudioTrack();            //w przeciwnym wypadku, wybierz pierszy utwór
        this.currentTrackChanged.notify();  //poinformowanie i zmianie aktualnego utworu
    },
    
    //ustawienie czasu odtwarzania aktualnego utworu
    setTime: function($time) {
        if (this.audio.src) this.audio.currentTime = $time;
    },
    
    //przewijanie utworu do przodu
    fastForward: function() {
        var time = this.getCurrentTime() + this.timeChangeRate;
        //jeśli przesunięcie nie przekracza czasu trwania utworu, a wybrany fragment utworu jest zbuforowany, ustaw czas odtwarzania aktualnego utworu
        if (time < this.audio.duration && time >= 0) {
            if (this.audio.buffered.start(0) <= time && this.audio.buffered.end(0) >= time) this.audio.currentTime = time;
        }
    },
    
    //przewijanie utworu wstecz
    rewind: function() {
        var time = this.getCurrentTime() - this.timeChangeRate;
        //jeśli przesunięcie nie jest mniejsze od 0, a wybrany fragment utworu jest zbuforowany, ustaw czas odtwarzania aktualnego utworu
        if (time < this.audio.duration && time >= 0) {
            if (this.audio.buffered.start(0) <= time && this.audio.buffered.end(0) >= time) this.audio.currentTime = time;
        }
    }
};