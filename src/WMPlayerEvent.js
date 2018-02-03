/*!
* WMPlayer v0.7.2
* Copyright 2016-2018 Marcin Walczak
*This file is part of WMPlayer which is released under MIT license.
*See LICENSE for full license details.
*/

//WMPlayer event container
function WMPlayerEvent($sender) {
    this.sender = $sender;			
    this.listeners = [];
}

WMPlayerEvent.prototype = {
    attach: function($listener) {
        this.listeners.push($listener);
    },

    notify: function($args) {
        for (var i = 0; i < this.listeners.length; i++) {
            this.listeners[i](this.sender, $args);
        }
    }
};
