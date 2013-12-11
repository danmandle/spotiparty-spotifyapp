require([
	'$api/models',
	'$views/image#Image',
	'$views/list#List'
], function(models, Image, List) {
	'use strict';

	var imageURI = null;

	window.startTheParty = function() {
		updateLocalPlaylist();
		models.player.stop().done(function(p) {
			models.player.playContext(models.Playlist.fromURI('spotify:internal:temp_playlist:spotify:app:spotiparty@Spotiparty')); // There's probably a more right way to do this
		});
	}

	models.player.addEventListener('change:playing', function(p) {
		console.log((p.target.playing ? 'Started' : 'Stopped') + ' playing');

		(p.target.playing) ? window.songPosition() : stopChecking();

	});

	// Gets fired when a track ends or is skipped
	models.player.addEventListener('change:track', function(p) {
		console.log('song changed');
		trackChange();
	});

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

	window.songPosition = function() {
		window.songPositionChecker = setInterval(function() {
			// window.position();
		}, 2000);

		// window.songPositionChecker = setInterval(function() {
		// 	models.player.load('position', 'playing').done(function(p) {

		// 		// var percentComplete = Math.round((p.position / p.duration)*100);

		// 		var percentComplete = (p.position / p.duration);
		// 		console.log('seconds left: ' + (p.duration - p.position));
		// 		console.log('percentComplete: ' + percentComplete);

		// 		// console.log(Math.round((p.duration - p.position)/1000) + " seconds left");

		// 		if ((p.duration - p.position) < 30000) { // if there's less that 30 seconds left in the song
		// 			updateLocalPlaylist();
		// 			stopChecking();
		// 		}

		// 		!p.playing ? stopChecking() : null;
		// 	}).fail(function(error) {
		// 		console.log(error);
		// 	});
		// }, 2000)
	}; // timeout needs to be greater than the less than above

	window.stopChecking = function() {
		clearInterval(window.songPositionChecker);
	}

	function updateLocalPlaylist() {

		models.Playlist.createTemporary('Spotiparty').done(function(p) {
			console.log("playlist " + p.name + " created");
			p.load("tracks").done(function(spotipartyPlaylist) {
				window.spotipartyPlaylist = spotipartyPlaylist;

				spotipartyPlaylist.tracks.clear();
				updatePlaylistFromWeb(spotipartyPlaylist);

				setTimeout($.proxy(function() {
					var list = List.forPlaylist(p); // add options later, like height and number of items before scroll
					$('#playlistContainer').html(list.node);
					list.init();
				}, this), 10);
			});
		}).fail(function(error) {
			console.log(error);
		});

	}

	function updatePlaylistFromWeb(localPlaylist) {
		// AJAX call would go here...

		var data = {
			'songs': ['spotify:track:3PJikMV2xGNCooQttQrAw5', 'spotify:track:30g7tH1rfMratchnaLfgqJ', 'spotify:track:3kZC0ZmFWrEHdUCmUqlvgZ', 'spotify:track:5yc59J3MR3tVDPTOgwgRI5', 'spotify:track:2bD1AW4yqiCurGCva6r88a']
		};
		// var data = {'songs':[]};

		if (data.songs.length > 0) {

			// localPlaylist.tracks.insert(0, data.songs); // that 0 might not be right

			$.each(data.songs, function(index, value) {
				localPlaylist.tracks.add(models.Track.fromURI(value));

				console.log("added track uri " + value);
			});
		} else {
			console.log('No songs in the queue');
		}
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

	window.urlToUri = function(url) {
		// convert URL to URI
		//// http://open.spotify.com/user/danmandle/playlist/5ZwcCib9Fp38CygXSTi9Fw
		//// spotify:user:danmandle:playlist:5ZwcCib9Fp38CygXSTi9Fw
		return 'spotify' + url.replace('http://open.spotify.com', '').replace(/\//gi, ':');
	}

	// we should initialize some values
	trackChange();
	updateLocalPlaylist();
	
	window.position = function(){
		console.log('position requested');
		models.player.load('position', 'playing').done(function(p) {
			
			window.thePlayer = p;
			
			// var percentComplete = Math.round((p.position / p.duration)*100);

			var percentComplete = (p.position / p.duration);
			console.log('seconds left: ' + (p.duration - p.position));
			console.log('percentComplete: ' + percentComplete);

			// console.log(Math.round((p.duration - p.position)/1000) + " seconds left");

		}).fail(function(error) {
			console.log(error);
		});
	};
});