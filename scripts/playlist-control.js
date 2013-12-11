require([
	'$api/models',
	'$views/image#Image',
	'$views/list#List'
], function(models, Image, List) {
	'use strict';

	window.startTheParty = function() {
		updateLocalPlaylist();
		models.player.stop().done(function(p) {
			models.player.playContext(models.Playlist.fromURI('spotify:internal:temp_playlist:spotify:app:spotiparty@Spotiparty')); // There's probably a more right way to do this
		});
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

});