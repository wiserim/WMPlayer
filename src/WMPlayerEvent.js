/*!
* WMPlayer v1.0.0
* Copyright 2016-2024 Marcin Walczak
*This file is part of WMPlayer which is released under MIT license.
*See LICENSE for full license details.
*/

//WMPlayer event container
WMPlayer.prototype._Event = function($sender) {
    this.sender = $sender;			
    this.listeners = [];
}

WMPlayer.prototype._Event.prototype = {
    attach: function($listener) {
        this.listeners.push($listener);
    },

    notify: function($args) {
        for (var i = 0; i < this.listeners.length; i++) {
            this.listeners[i](this.sender, $args);
        }
    }
};

