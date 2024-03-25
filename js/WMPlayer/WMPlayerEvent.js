/*!
* WMPlayer v0.4.05 (http://WMPlayer.net)
* Copyright 2016-2017 Marcin Walczak
*This file is part of WMPlayer which is released under MIT license.
*See file LICENSE.txt or go to http://WMPlayer.net for full license details.
*/

/*
Klasa WMPlayerEvent zapewnia obsługę zdarzeń.
*/
//konstruktor
function Event($sender) {
    this.sender = $sender;  //referencja do obiektu do którego przypisane jest zdarzenie				
    this.listeners = [];        //tablica funkcji obsługi zdarzenia
}

//funkcje
Event.prototype = {
    //dodanie funkcji obsługi zdarzenia
    attach: function($listener) {
        this.listeners.push($listener);
    },
    
    //uruchomienie odpowiedzi na zdarzenie
    notify: function($args) {
        for (var i = 0; i < this.listeners.length; i++) {
            this.listeners[i](this.sender, $args);
        }
    }
};