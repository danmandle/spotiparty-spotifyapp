require([
	'$api/models',
	'$views/image#Image',
	'$views/list#List'
], function(models, Image, List) {
	'use strict';

	var imageURI = null;

	function trackChange() {
		models.player.load('track').done(function(p) {

			window.track = p.track;

			//console.log('Song: ' + track.name + ' by ' + track.artists[0].name);

			updateCoverArt(track);
			updateTrackTitle(track);
		}).fail(function(error) {
			console.log(error);
		});

	};

	function updateCoverArt(track) {
		var image = Image.forTrack(track, {
			width: 500,
			height: 500,
			player: false
		});
		if (imageURI != image._item.uri) {
			// evaluate so that it doesn't reload the image each time the play state changes
			imageURI = image._item.uri;
			$('#albumCoverContainer').html(image.node);
		}
	}

	function updateTrackTitle(track) {
		$('h1#current-track').text(track.artists[0].name + ' - ' + track.name);
	}

	$('#backupPlaylist').bind('dragenter', function() {

		$('#backupPlaylist').val('');
	});

	$('#backupPlaylist').bind('change', function() {

		console.log('The changed conent: ' + $('#backupPlaylist').val());
	});

	$('#backupPlaylist').bind('drop', function() {

		// spotify:user:danmandle:playlist:5ZwcCib9Fp38CygXSTi9Fw
		// http://open.spotify.com/user/danmandle/playlist/5ZwcCib9Fp38CygXSTi9Fw

		setTimeout($.proxy(function() {
			// have to set the timeout for, well, unknown reasons, but the value of the field wasn't populating

			var playlistURI = urlToUri($('#backupPlaylist').val());

			models.Playlist.fromURI(playlistURI).load('name').done(function(playlist) {
				$('#backupPlaylist').val(playlist.name);
			});
		}, this), 0);
	});
});