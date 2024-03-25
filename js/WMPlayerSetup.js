$(document).ready(function(){
    //wybór szablonu
    //ukrycie miniaturek
    $('#setupTemplate img[data-template]').hide();
    //pokazanie miniaturki wybranej opcji
    $('#setupTemplate img[data-template='+$('input:radio[name=setupTemplate]:checked').val()+']').show();
    //zmiana widocznej minaturki odtwarzacza
    $('input:radio[name=setupTemplate]').change(function(){
        var template = this.value;
        $('#setupTemplate img').hide();
        $('#setupTemplate img[data-template='+template+']').show();
    });

    //dodawanie pozycji listy odtwarzania
    $('.setup-add').click(function(){
        var playlistPosition = '<div class="row setup-playlist-position"><div class="col-sm-5"><div class="input-group input-group-xs no-addon-xs form-group"><input type="text" name="setupPlaylistTitle" placeholder="Track title" class="form-control" /><div class="input-group-btn visible-xs"><button class="btn btn-primary glyphicon glyphicon-play setup-play" ></button></div></div></div><div class="col-sm-5"><div class="input-group input-group-xs no-addon-xs form-group"><input type="url" name="setupPlaylistUrl" placeholder="Track URL" class="form-control" /><div class="input-group-btn visible-xs"><button class="btn btn-danger glyphicon glyphicon-trash setup-remove"></button></div></div></div><div class="col-sm-2 hidden-xs text-right"><button class="btn btn-primary glyphicon glyphicon-play setup-play"></button> <button class="btn btn-danger glyphicon glyphicon-trash setup-remove"></button> </div></div>';
        $('.setup-playlist').append(playlistPosition)
    });

    //przycisku w dodawanych pozycjach listy odtwarzania
    $('.setup-playlist').click(function(e){
        var target = $(e.target);
        var playlistPosition = target.closest('.setup-playlist-position');

        //usuwanie pozycji listy odtwarzania
        if(target.hasClass('setup-remove')) playlistPosition.remove();

        //odtwarzanie pliku audio spod podanego adresu url
        if(target.hasClass('setup-play') && target.hasClass('glyphicon-play')){
            var url = playlistPosition.find('[name=setupPlaylistUrl]').val();
            if(url != ''){
                var audio = $('#setupAudio')[0];
                audio.src = url;
                audio.currentTime = 0;
                audio.play();

                $('.setup-play.glyphicon-stop').removeClass('glyphicon-stop').addClass('glyphicon-play');

                playlistPosition.find('.setup-play').removeClass('glyphicon-play').addClass('glyphicon-stop');
            }
        }
        //zatrzymanie odtwarzania pliku
        else if(target.hasClass('setup-play') && target.hasClass('glyphicon-stop')){
            var audio = $('#setupAudio')[0];
            audio.pause();
            audio.currentTime = 0;
            $('.setup-play.glyphicon-stop').removeClass('glyphicon-stop').addClass('glyphicon-play');
        }
    });

    //ustawienie głośności
    $('.setupVolumeValue').text($('[name=setupVolume]').val());
    $('[name=setupVolume]').on('input', function(){
        var volume = $(this).val();
        $('.setupVolumeValue').text(volume);
    }).change(function(){
        var volume = $(this).val();
        $('.setupVolumeValue').text(volume);
    });
	
    //generowanie skryptu
    $('#setupGenerate').click(function(){
        $('.has-error').removeClass('has-error').find('.help-block').remove();  //usunięcie informacji o błędach
        var WMPDSG = new WMPlayerDSG();                                         //obiekt generatora skryptu publikującego
        var error = false;                                                      //flaga błędu
        var template = $('[name=setupTemplate]:checked').val();                 //pobranie danych szablonu
        //pobieranie listy odtwarzania
        var playlist =[];
        $('.setup-playlist-position').each(function(){
            var inputTitle = $(this).find('[name=setupPlaylistTitle]');         //pole tytułu utworu
            var inputUrl = $(this).find('[name=setupPlaylistUrl]');             //pole adresu URL utworu

            var title = WMPDSG.title(inputTitle.val());                         //escape-owanie tytułu utworu
            var url = inputUrl.val();                                           //walidacja adresu url
            if(!WMPDSG.url(url)){
                error = true;                                                   //właczenie flagi błędu
                //dodanie do pola informacji o błędzie
                inputUrl.parent('.form-group').addClass('has-error');
                inputUrl.after('<span class="help-block">Invalid URL.</span>');
            }
            else playlist.push({'title': title, 'Url': url});                   //dodanie utworu do listy odtwarzania
        });
        var autoplay = WMPDSG.autoplay($('[name=setupAutoplay]').is(':checked'));                //pobranie opcji autoodtwarzania
        var loop = WMPDSG.loop($('[name=setupLoop]').is(':checked'));                        //pobranie opcji odtwarzania w pętli
        var inputVolume = $('[name=setupVolume]');                              //pole głośności
        var volume = WMPDSG.volume(inputVolume.val());                          //walidacja głośności
        if(!volume){
            error = true;                                                       //właczenie flagi błędu
            //dodanie do pola informacji o błędzie
            inputVolume.closest('.form-group').addClass('has-error');
            inputVolume.after('<span class="help-block">Value between 0-100 required.</span>');
        }

        //daj komunikat o błędzie
        if(error){
            $('#modalError .modal-body').html('<p>Form has errors.</p>');
            $('#modalError').modal();
            return;
        }

        //przygotowanie wsadu do generatora
        var data = {
            template: template,
            playlist: playlist,
            autoplay: autoplay,
            loop: loop,
            volume: volume
        };
        //generowanie i wyswietlenie kodu skryptu
        var result = '<!-- WMPlayer http://wmplayer.net -->\n' + WMPDSG.generate(data) + '\n<!-- WMPlayer script end -->';
        var modal =  $('#modalDeploymentScript .modal-body');
        modal.text(result).html(modal.html().replace(/\n/g,'<br/>'));
        /*
        $('#modalDeploymentScript .modal-body').text(result);
        $('#modalDeploymentScript .modal-body').html().replace(/\n/g,'<br/>');
        */
        $('#modalDeploymentScript').modal();

    });

    //reakcja na błąd przy odtwarzaniu pliku audio kreatora
    $('#setupAudio').on('error', function(){
        $('.setup-play.glyphicon-stop').removeClass('glyphicon-stop').addClass('glyphicon-play');
        this.pause();
        this.currentTime = 0;
        $('#modalError .modal-body').html('<p>Audio file couldn\'t be played.</p>');
        $('#modalError').modal();
    });
});