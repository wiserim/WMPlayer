/*!
* WMPlayer Deployer v0.3.02 (http://WMPlayer.net)
* Copyright 2016-2017 Marcin Walczak
* Licensed under the MIT license
*/

//jeśli nie istnieje obiekt WMPlayerDeployer utwórz go
if(WMPlayerDeployer == undefined) {
    var WMPlayerDeployer = {
        targetOrigin : "http://wmplayer.net",     //zaufana domena z której przyjmowane są komunikaty
        players: [],                                //tablica odtwarzaczy
        
        //sprawdzenie czy element jest widozny
        isHidden: function ($element) {
            return ($element.offsetParent === null)
        },
        
        //wysłanie danych do ramki iframe zawierającej aplikację
        sendData: function ($index, $data) {
            WMPlayerDeployer.players[$index].iframe.contentWindow.postMessage(JSON.stringify($data), WMPlayerDeployer.targetOrigin);
        },
        
        //odebranie danych z ramki iframe aplikacji
        receiveData: function ($event) {
            var origin = $event.origin || $event.originalEvent.origin;  //źródło wiadomości

            if (origin != WMPlayerDeployer.targetOrigin) return;        //jeśli wiadomość nie pochodzi z zaufanej domeny, zignoruj ją

            var data = JSON.parse($event.data);                           //parsowanie odebranych danych
            //jeśli przessłano komunikat gotowości, prześlij dane konfiguracyjne
            if(data.type == "ready"){
                WMPlayerDeployer.sendData(data.index, WMPlayerDeployer.players[data.index].data);
            }
            
            //jeśli przesłano dane o rozmiarze zawartości ramki, ustaw jej rozmiar
            if (data.type == "size") {
                WMPlayerDeployer.setIframeSize(data.index, data.height);
            }
        },
        
        //ustawienie rozmiaru ramki iframe aplikacji
        setIframeSize: function ($index, $height) {
            this.players[$index].iframe.height = $height + "px";
        },
        
        //dodanie nowej ramki iframe aplikacji
        add: function ($args) {
            //dodanie nowej raki iframe aplikacji do listy odtwarzaczy
            this.players.push({
                iframe: document.createElement('iframe'),
                data: {
                    type: 'playerData',
                    template: $args['template'],
                    config: $args['config'],
                    playlist: $args['playlist']
                }
            });
            var index = this.players.length - 1;                                                                           //indeks ramki iframe odtwarzacza
            this.players[index].iframe.frameBorder = 0;                                                                 //wyłączenie obramowania
            this.players[index].iframe.width = '100%';                                                                  //dopasowanie szerokości ramki do rodzica
            this.players[index].iframe.style.border = "none";                                                         //wyłączenie obramowania
            this.players[index].iframe.scrolling = "no";                                                                  //wyłączenie przewijania okna ramki ifrrame
            this.players[index].iframe.style.overflow = "hidden";                                                     //ukrycie elementów wychodzących poza widoczną część ramki iframe
            this.players[index].iframe.src = "http://WMPlayer.net/deployer/deployer.html?id="+index;    //źródło strony
            args['parent'].appendChild(this.players[index].iframe);                                                   //dodanie ramkiiframe do rodzica
        }
    };
    
    //podpięcie zdarzenia odbioru wiadomości
    window.addEventListener("message", WMPlayerDeployer.receiveData, false);
}

//aktualnie uruchomiony skrypt
var currentScript = document.currentScript || (function() {var scripts = document.getElementsByTagName("script"); return scripts[scripts.length - 1];})();
var args = [];                                                                              //tablica argumentów
args['parent'] = currentScript.parentNode;                                        //rodzic aktualnie uruchomionego skryptu
args['playlist'] = JSON.parse(currentScript.getAttribute("data-playlist")); //lista odtwarzania
args['template'] = currentScript.getAttribute("data-template");             //szablon
args['config']  = JSON.parse(currentScript.getAttribute("data-config"));  //dane konfiguracyjne

WMPlayerDeployer.add(args);                                                         //dodanie nowego odtwarzacza

