/*!
* WMPlayer v0.4.05 (http://WMPlayer.net)
* Copyright 2016-2017 Marcin Walczak
*This file is part of WMPlayer which is released under MIT license.
*See file LICENSE.txt or go to http://WMPlayer.net for full license details.
*/

/*
Klasa WMPlayerAudioTrack stanowi kontener dla danych ścieżki dźwiękowej
*/
//konstruktor
function AudioTrack($url, $title) {
    if (typeof($title) === 'undefined') $title = 'N/A';
    this.url = $url;            //adres URL utworu    
    this.title = $title;         //tytuł utworu
    this.duration = 'N/A';  //czas trwania utworu
    this.error = false;     //flaga błędu pliku audio
}

//funkcje
AudioTrack.prototype = {
    //wydanie adresu URL utworu
    getUrl: function() {
        return this.url;
    },
    
    //wydanie tytułu utworu
    getTitle: function() {
        return this.title;
    },
    
    //wydanie czasu trwania utworu
    getDuration: function() {
        return this.duration;
    },
    
    //wydanie flagi błędu pliku audio
    getError: function() {
        return this.error;
    },
    
    //ustawienie adresu URL utworu
    setURL: function($url) {
        this.url = $url;
    },
    
    //ustawienie tytułu utworu
    setTitle: function($title) {
        this.title = $title;
    },
    
    //ustawienie czasu twrania utworu
    setDuration: function($duration) {
        this.duration = $duration;
    },
    
    //ustawienie flagi błedu pliku audio
    setError: function($error) {
        this.error = $error;
    }
};