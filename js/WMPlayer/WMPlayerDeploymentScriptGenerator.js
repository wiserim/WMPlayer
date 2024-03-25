//Generator skryptu publikującego

//konstruktor
function WMPlayerDSG(){
    this.deployerUrl = 'http://WMPlayer.net/WMPlayerDeployer/v1';    //adres skryptu publikujacego
}

WMPlayerDSG.prototype = {
    //generowanie skryptu publikującego
    generate: function($args){
        var script = "<script src='"+this.deployerUrl+"'";   //żródło skryptu
        script += " data-template='"+$args.template+"'";
        script += " data-playlist='"+JSON.stringify($args.playlist)+"'";
        script += " data-config='"+JSON.stringify({autoplay: $args.autoplay, loop: $args.loop, volume: $args.volume})+"'";
        script += "></script>";
        return script;
    },

    //walidacja/escape-owanie nazwy szablonu
    template: function($template){
        if($template == '') return false;
        return $template.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    },

    //escape-owanie tytułu utworu
    title: function($title){
        return $title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    },

    //walidacja adresu url
    url: function($url){
        //Regular Expression for URL Validation
        //Author: Diego Perini
        //License: MIT
        //Copyright (c) 2010 - 2013 Diego Perini (http://www.iport.it)
        var pattern = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
        return pattern.test($url);
    },

    //walidacja głośności
    volume: function($volume){
        if(isNaN($volume)) return false;
        if($volume < 0 || $volume > 100) return false;
        return $volume/100;
    },
    
    //konwersja opcji autoodtwarzania na typ bool
    autoplay: function($autoplay){
        if($autoplay) return true;
        else return false;
    },
    
    //konwersja opcji odtwarzania w pętli na typ bool
    loop: function($loop){
        if($loop) return true;
        else return false;
    }
}