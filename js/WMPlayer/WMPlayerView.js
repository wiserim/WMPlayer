/*!
* WMPlayer v0.4.05 (http://WMPlayer.net)
* Copyright 2016-2017 Marcin Walczak
*This file is part of WMPlayer which is released under MIT license.
*See file LICENSE.txt or go to http://WMPlayer.net for full license details.
*/

/*
Klasa WMPlayerView tworzy wizualną reprezentację danych w formie czytelnej dla użytkownika.
Zapewnia również interfejs umożliwiający interakcję użytkownika z aplikacją.
*/
//konstruktor
function WMPlayerView($elements) {
    var self = this;                                                         //autoreferencja
    this.elements = $elements;                                        //obiekt klas elementów widoku
    this.template = null;                                                 //szablon
    this.container = this.elements.container;                    //referencja do kontenera odtwarzacza
    this.mousedownFlag = false;                                     //flaga wciśnięcia przycisku myszy
    
    //zdarzenia występujące w widoku
    this.playButtonClicked = new Event(this);                   //kliknięcie przycisku odtwarzania/wstrzymania odtwarzania
    this.stopButtonClicked = new Event(this);                   //kliknięcie przycisku zatrzymania odtwarzania
    this.fastForwardButtonPressed = new Event(this);        //wciśnięcie przycisku przewijania do przodu
    this.rewindButtonPressed = new Event(this);                //wciśnięcie przycisku przewijania wstecz
    this.progressBarClicked = new Event(this);                  //kliknięcie na pasek postepu
    this.volumeBarClicked = new Event(this);                    //klikniecie na pasek głośności
    this.playlistElementDoubleClicked = new Event(this);    //podwójne klikniecie na element
    this.templateModified = new Event(this);                      //zmiana szablonu
    
    //podpięcie standardowych zdarzeń
    //kliknięcie wewnątrz kontenera odtwarzacza
    this.container.addEventListener("click", function($e) {
        //pobranie rodziców celu zdarzenia aż do kontenera
        var targetParents = self.getParentsNodes($e.target, self.elements.container);
        
        //jeśli kliknięto przycisk odtwarzania/wstrzymania odtwarzania, poinformuj o jego kliknięciu
        if (self.isParent(targetParents, self.elements.playButton)) self.playButtonClicked.notify();
        
        //jeśli kliknięto przycisk zatrzymania odtwarzania, poinformuj o jego kliknięciu
        if (self.isParent(targetParents, self.elements.stopButton)) self.stopButtonClicked.notify();
        
        //jeśli kliknięto pasek postępu, poinformuj o jego kliknięciu
        var progressBarValue = self.isParent(targetParents, self.elements.progressBar, true);
        if (progressBarValue) {
            var progressBarParent = progressBarValue.parentNode;    //rodzic paska postepu
            var width = 0;                                                                //szerokość rodzica
            var rect = progressBarValue.getBoundingClientRect();      //prostokąt reprezentujący położenie i wymiary rodzica
            var offsetX = $e.clientX - rect.left;                                  //odległość myszki od lewego krańca rodzica
            //pobranie szerokości rodzica
            if (progressBarParent.hasAttribute('width')) width = progressBarParent.getAttribute('width');
            else width = progressBarParent.offsetWidth;
            //poinformowanie o kliknięciu na pasek postępu i przekazanie argumentów
            self.progressBarClicked.notify({
                offsetX: offsetX,
                width: width
            });
        }
        
        //jeśli kliknięto pasek głośności, poinformuj o jego kliknięciu
        var volumeBarValue = self.isParent(targetParents, self.elements.volumeBar, true);
        if (volumeBarValue) {
            var volumeBarWidth = volumeBarValue.parentNode;     //rodzic paska głośności
            var width = 0;                                                            //szerokość rodzica
            var rect = volumeBarValue.getBoundingClientRect();    //prostokąt reprezentujący położenie i wymiary rodzica
            var offsetX = $e.clientX - rect.left;                               //odległość myszki od lewego krańca rodzica
            //pobranie szerokości rodzica
            if (volumeBarWidth.hasAttribute('width')) width = volumeBarWidth.getAttribute('width');
            else width = volumeBarWidth.offsetWidth;
            //poinformowanie o kliknięciu na pasek głośności i przekazanie argumentów
            self.volumeBarClicked.notify({
                offsetX: offsetX,
                width: width
            });
        }
    });
    
    //reakcja na podwójne kliknięcie/dotknięcie ekranu
    var doubleClick = function($e) {
        //pobranie rodziców celu zdarzenia aż do kontenera
        var targetParents = self.getParentsNodes($e.target, self.elements.container);
        //jeśli podwójnie kliknięto wiersz z listy odtwarzania, poinformuj o jego wybraniu
        if (self.isParent(targetParents, self.elements.playlist)) {
            var element = $e.target;
            //wybranie elementu wiersza-rodzica
            while (element.tagName.toLowerCase() != 'tr' && !element.classList.contains(self.elements.playlist)) {
                element = element.parentNode;
            }
            //poinformowanie o podwójnym kliknięciu wiersza z listy odtwarzania i przekazanie argumentu
            if (element.tagName.toLowerCase() == 'tr') {
                self.playlistElementDoubleClicked.notify({
                    trackId: element.rowIndex
                });
            }
        }
    };
    
    //reakcja na wciśnięcie przycisku myszy
    var mouseDown = function($e) {
        var targetParents = self.getParentsNodes($e.target, self.elements.container);
        //jeśli wciśnięto przycisk przewijania do przodu/nastepnego utworu
        if (self.isParent(targetParents, self.elements.fastForwardButton)) {
            self.mousedownFlag = true;                  //ustawienie flagi wciśniecia przycisku myszy
            self.fastForwardButtonPressed.notify();   //poinformowanie o wciśnięciu przycisku przewijania do przodu
        }
         //jeśli wciśnięto przycisk przewijania wstecz/poprzedniego utworu
        if (self.isParent(targetParents, self.elements.rewindButton)) {
            self.mousedownFlag = true;          //ustawienie flagi wciśniecia przycisku myszy
            self.rewindButtonPressed.notify();  //poinformowanie o wciśnięciu przycisku przewijania wstecz
        }
    };
    
    //reakcja na puszczenie przycisku myszy
    var mouseUp = function($e) {
        var targetParents = self.getParentsNodes($e.target, self.elements.container);
        //jeśli puszczono przycisk przewijania do przodu/nastepnego utworu
        if (self.isParent(targetParents, self.elements.fastForwardButton)) {
            self.mousedownFlag = false; //ustawienie flagi wciśniecia przycisku myszy
        }
        //jeśli puszczono przycisk przewijania wstecz/poprzedniego utworu
        if (self.isParent(targetParents, self.elements.rewindButton)) {
            self.mousedownFlag = false; //ustawienie flagi wciśniecia przycisku myszy
        }
    };
    
    //przypisanie reakcji do zdarzeń
    this.container.addEventListener("dblclick", function($e) {
        doubleClick($e)
    });
    this.container.addEventListener("touchend", function($e) {
        doubleClick($e)
    });
    this.container.addEventListener("mousedown", function($e) {
        mouseDown($e)
    });
    this.container.addEventListener("mouseup", function($e) {
        mouseUp($e)
    });
}

//funkcje
WMPlayerView.prototype = {
    //wyświetlenie odtwarzacza
    renderPlayer: function() {
        if (this.template !== null) this.elements.container.innerHTML = this.template;
    },
    
    //wyśiwietlenie listy odtwarzania
    renderPlaylist: function($playlist, $currentTrackIndex) {
        var list = "";
        var playlists = this.elements.container.getElementsByClassName(this.elements.playlist); //kontenery listy odtwarzania wewnątrz kontenera odtwarzacza
        //jeśli lista odtwarzania nie jest pusta, wygeneruj listę
        if (playlists.length > 0) {
            for (var i = 0; i < $playlist.length; i++) {
                list = list + '<tr class="';
                if (i == $currentTrackIndex) list = list + 'WMP-playlistCurrentTrack';
                if ($playlist[i].getError()) list = list + ' WMP-playlistError';
                list = list + '"><td class="WMP-playlistIndex">' + (i + 1) + '.</td><td class="WMP-playlistTitle">' + $playlist[i].getTitle() + '</td><td class="WMP-playlistDuration">' + this.formatTime($playlist[i].getDuration()) + '</td></tr>';
            }
            
            //wstawienie listy odtwarzania w kontenery
            for (i = 0; playlists.length > i; i++) {
                playlists[i].innerHTML = list;
            }
        }
    },
    
    //ustawienie szablonu
    setTemplate: function($template) {
        if ($template.nodeType) this.template = $template.innerHTML;
        else this.template = $template;
        this.templateModified.notify();     //poinformowanie o zmianie szablonu
    },
    
    //zmiana wartości pasków głośności
    setVolumeBar: function($volume) {
        if($volume === undefined) $volume = 0;
        var volumeBar = this.elements.container.getElementsByClassName(this.elements.volumeBar);
        for (var i = 0; i < volumeBar.length; i++) {
            volumeBar[i].style.width = $volume * 100 + '%';
        };
    },
    
    //zmiana wartości pasków postepu
    setProgressBar: function($currentTime, $duration) {
        var width = 0;
        var progressBar = this.elements.container.getElementsByClassName(this.elements.progressBar);
        if($currentTime !== undefined && $duration !== undefined) width = $currentTime / $duration * 100;
        for (var i = 0; i < progressBar.length; i++) {
            progressBar[i].style.width = width + '%';
        }
    },
    
    //formatowanie czasu na format mm:ss
    formatTime: function($time) {
        var formatedTime = "N/A";
        if (!isNaN($time)) {
            var minutes = Math.floor($time / 60);
            var seconds = Math.floor($time - (minutes * 60));
            formatedTime = minutes + ':' + ((seconds < 10 ? '0' : '') + seconds);
        }
        return formatedTime;
    },
    
    //ustawienie czasu odtwarzania utworu
    setCurrentTime: function($currentTime) {
        var timers = this.elements.container.getElementsByClassName(this.elements.currentTrackTime);
        var currentTime = this.formatTime($currentTime);
        for (var i = 0; i < timers.length; i++) {
            timers[i].innerHTML = currentTime;
        };
    },
    
    //wydanie tablicy rodziców od elementu do podanego rodzica
    getParentsNodes: function($target, $toParent) {
        var nodes = [];
        var element = $target;
        nodes.push(element);
        while (element.parentNode && element != $toParent) {
            nodes.unshift(element.parentNode);
            element = element.parentNode;
        };
        return nodes;
    },
    
    //sprawdzenie czy w tablicy rodziców znajduje sie element o podanej klasie
    isParent: function($parents, $className, $child) {
        //jeśli jest więcej niż 1 rodzic, sprawdź wszystkich po kolei
        if ($parents.length > 1) {
            for (var i = 0; i < $parents.length; i++) {
                if ($parents[i].classList !== undefined) {
                    if ($parents[i].classList.contains($className) || (' ' + $parents[i].getAttribute("class") + ' ').indexOf(' ' + $className + ' ') > -1) return $parents[i];
                } else if ((' ' + $parents[i].getAttribute("class") + ' ').indexOf(' ' + $className + ' ') > -1) return $parents[i];
            }
        } 
        //w przeciwnym wypadku sprawdź rodzica
        else {
            if ($parents.classList.contains($className) || (' ' + $parents.className + ' ').indexOf(' ' + $className + ' ') > -1) return $parents;
        }
        //opcjonalnie sprawdź dziecko najmłodzego rodzica
        if ($child) {
            var children = this.container.getElementsByClassName($className);
            for (var i = 0; i < (children.length); i++) {
                if (children[i].parentNode === $parents[$parents.length - 1]) return children[i];
            }
        }
        return false;
    },
    
    //ustwaienie danych aktualnego utworu
    setCurrentTrackData: function($currentTrackTitle, $currentTrackDuration) {
        var titles = this.elements.container.getElementsByClassName(this.elements.currentTrackTitle);               //kontenery tytułu aktualnego utworu
        var durations = this.elements.container.getElementsByClassName(this.elements.currentTrackDuration);  //kontenery czasu trwania aktualnego utworu
        //wypełnienie kontenerów
        for (var i = 0; i < titles.length; i++) {
            if (titles[i] != null) titles[i].innerHTML = $currentTrackTitle;
        }
        var duration = this.formatTime($currentTrackDuration);
        for (var i = 0; i < durations.length; i++) {
            if (durations[i] != null) durations[i].innerHTML = duration;
        }
    },
    
    //dodaj klasę do kontenera odtwarzacza
    addContainerClass: function($newClassName) {
        this.elements.container.classList.add($newClassName);
    },
    
    //usuń klasę z kontenera odtwarzacza
    removeContainerClass: function($removedClassName) {
        this.elements.container.classList.remove($removedClassName);
    }
};