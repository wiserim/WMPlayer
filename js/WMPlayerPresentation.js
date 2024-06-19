$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip();   
	//utworzenie, konfiguracja i uruchomienie aplikacji
	var player = new WMPlayer(document.getElementById('container-1'));  //utworzenie aplikacji i ustawienie jej kontenera
	//dodanie przykładowych plików audio do listy odtwarzania
	player.addTrack('https://wiserim.github.io/WMPlayer/music/Carefree.mp3', 'Carefree');
	player.addTrack('https://wiserim.github.io/WMPlayer/music/Inspired.mp3', 'Inspired');
	player.addTrack('https://wiserim.github.io/WMPlayer/music/Monkeys%20Spinning%20Monkeys.mp3', 'Monkeys Spinning Monkeys');
	player.addTrack('https://wiserim.github.io/WMPlayer/music/The%20Complex.mp3', 'The Complex');

	//uruchomienie aplikacji
	$('#playerStart').click(function(){player.start();});
	
	
	//wybór szablonu
	$('#setTemplate').change(function(){
		var val = $(this).val();

		if(val == 'default') {
			var template = $('#default')[0];
			player.theme('default');
		}

		if(val == 'default-dark') {
			var template = $('#default')[0];
			player.theme('default dark');
		}

		if(val == 'classic') {
			var template = $('#classic')[0];
			player.theme('classic');
		}

		player.template(template);
	});
	
	//wybór kontenera
	$('#setContainer').change(function(){
		var container = $('#'+$(this).val())[0];
		player.parent(container);
	});
	
	//autoodtwarzanie
	$('#setAutoplay').change(function(){
		var autoplay = $(this).is(':checked');
        player.autoplay(autoplay);
	});
	
	//odtwarzanie w pętli
	$('#setLoop').change(function(){
		var loop = $(this).is(':checked');
		player.loop(loop);
	});

	//pokaż listę odtwarzania
	$('#setShowPlaylist').change(function(){
		var showPlaylist = $(this).is(':checked');
		player.showPlaylist(showPlaylist);
	});

	//ustawienie głośności
	$('#setVolume').on('input', function(){
		var volume = $(this).val();
		$('.setVolumeValue').text(volume);
		player.volume(volume/100);
	});
	
	//wybór utworu
	$('#setTrack').change(function(){
		var trackIndex = $(this).val()-1;
		player.track(trackIndex);
	});
	
	//dodanie utworu
	$('#addTrack').click(function(){
		var title = $('#addTrackTitle').val();
		var url = $('#addTrackUrl').val();
        player.addTrack(url, title);
        var index = $('#setTrack option').size() +1;
        $('#setTrack').append($('<option></option>').attr('value', index).text(index));
        $('#deleteTrackPosition').append($('<option></option>').attr('value', index).text(index));
	});
	
	//usunięcie utworu
	$('#deleteTrack').click(function(){
		var trackIndex = $('#deleteTrackPosition').val();
		if(trackIndex != 'last') player.removeTrack(trackIndex-1);
		else player.removeTrack();

		if($('#setTrack option').size() > 1)
		{
			$('#setTrack option:last-child').remove();
			$('#deleteTrackPosition option:last-child').remove();
		}
	});
});
