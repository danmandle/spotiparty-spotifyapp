require([
	'$api/models',
	'$views/image#Image',
	'$views/list#List'
], function(models, Image, List) {
	'use strict';

//move to playlist-control
	function updateLocalPlaylist(callback) {
		// console.log('The callback: ', callback);
		
		models.Playlist.createTemporary('Spotiparty').done(function(p) {
			console.log("playlist " + p.name + " created");
			p.load("tracks").done(function(spotipartyPlaylist) {
				window.spotipartyPlaylist = spotipartyPlaylist;
				
				
				models.player.load('track').done(function(p) {
					if(p.track != null){
						// spotipartyPlaylist.tracks.trim(p.track);
						spotipartyPlaylist.tracks.clear();
						// console.log(spotipartyPlaylist.tracks.toArray());
					}
					updatePlaylistFromWeb(spotipartyPlaylist);
				});

				setTimeout($.proxy(function() {
					var list = List.forPlaylist(p); // add options later, like height and number of items before scroll
					$('#playlistContainer').html(list.node);
					list.init();
				}, this), 10);
				callback ? callback() : undefined;
			});
		}).fail(function(error) {
			console.log(error);
		});

	}

window.theSongs = {
			'songs': [
				'spotify:track:6IKNeMqF1V1gmNkiZh1MmZ',
				'spotify:track:3PJikMV2xGNCooQttQrAw5',
				'spotify:track:30g7tH1rfMratchnaLfgqJ',
				'spotify:track:3kZC0ZmFWrEHdUCmUqlvgZ',
				'spotify:track:5yc59J3MR3tVDPTOgwgRI5',
				'spotify:track:2bD1AW4yqiCurGCva6r88a',
				'spotify:track:1x5MjCffpcdHLf65eR9r3T',
				'spotify:track:5KQrOv9nFVnM465CVGriW9',
				'spotify:track:5qEn8c0MBzyRKgQq91Vevi',
				'spotify:track:7Ik1qCkU5NIeBNFzoehjix',
				'spotify:track:0GO8y8jQk1PkHzS31d699N',
				'spotify:track:3l8dM1wjgFh98jpiq5ZCe7',
				'spotify:track:2XbqxKjCnE9YWfPRqwgtPq'
			]
		};

	function updatePlaylistFromWeb(localPlaylist) {
		// AJAX call would go here...
		
		// var window.theSongs = {'songs':[]};

		if (window.theSongs.songs.length > 0) {

			// localPlaylist.tracks.insert(0, window.theSongs.songs); // that 0 might not be right

			$.each(window.theSongs.songs, function(index, value) {
				localPlaylist.tracks.add(models.Track.fromURI(value));

				// console.log("added track uri " + value);
			});
			console.log('Added a bunch of songs');
			
			///// This is to remove a song each time one is played
			// window.theSongs.songs.shift();
		} else {
			console.log('No songs in the queue');
		}
	}

//move to view
	if(localStorage.backupPlaylist != undefined){	    
	    models.Playlist.fromURI(localStorage.backupPlaylist).load('name').done(function(playlist) {
	    	$('#backupPlaylist').val(playlist.name);
	    });
	}
	
	var imageURI = null;

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
			localStorage.backupPlaylist = playlistURI;

			models.Playlist.fromURI(playlistURI).load('name').done(function(playlist) {
				$('#backupPlaylist').val(playlist.name);
			});
		}, this), 0);
	});

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

	function trackChange() {
		models.player.load('track').done(function(p) {
			
			/// something about being here
			
			if(p.track != undefined){
				updateCoverArt(p.track);
				updateTrackTitle(p.track);
				updateLocalPlaylist();
			}
			else{
				console.log("yo dawg, we're undefined."); //Probably from that moment between when a track stops and starts
			}
			
		}).fail(function(error) {
			console.log(error);
		});

	};

// move to player-functions
	$('#startTheParty').click(function(){
		console.log('Let the party begin');
		updateLocalPlaylist(function(){
			models.player.stop().done(function(p) {
				var theTempPlaylist = models.Playlist.fromURI('spotify:internal:temp_playlist:spotify:app:spotiparty@Spotiparty');
				models.player.playContext(theTempPlaylist); // There's probably a more right way to do this
			});
		});
			
	});


	models.player.addEventListener('change:playing', function(p) {
		console.log((p.target.playing ? 'Started' : 'Stopped') + ' playing');
		if(p.target.playing){
			window.startChecking();
		}
		else{
			stopChecking();
		}
	});

	// Gets fired when a track ends or is skipped
	models.player.addEventListener('change:track', function(p) {
		console.log('song changed');
		trackChange();
	});

	window.songPosition = function() {

		models.player.load('position', 'playing').done(function(p) {
			
			// !p.playing ? stopChecking() : null;
			if(p.playing && p.position > 0){
				
				console.log(Math.round((p.duration - p.position)/1000) + " seconds left", Math.round((p.position / p.duration)*100) + '% complete');
			
				if ((p.duration - p.position) < 30000) { // if there's less that 30 seconds left in the song
					console.log('Time to update the localPlaylist');
					updateLocalPlaylist();
					stopChecking();
				}
			}
			else if(p.playing){
				console.log("We're playing ,but Position not available, wait till next time.", p.positon);
			}
			else{
				console.log(p.playing, p.positon);
				console.log("was going to check positon, but decieded against it. Also stopping checking.");
				stopChecking();
			}
		}).fail(function(error) {
			console.log(error);
		});
	};

	window.startChecking = function(){
		console.log('started checking, waiting 5 seconds');
		setTimeout($.proxy(function() {
			window.songPositionChecker = window.setInterval(songPosition, 2000);
		}, this), 5000);
	};
	window.stopChecking = function() {console.log('stopped checking');clearInterval(window.songPositionChecker)};

	window.urlToUri = function(url) {
		// convert URL to URI
		//// http://open.spotify.com/user/danmandle/playlist/5ZwcCib9Fp38CygXSTi9Fw
		//// spotify:user:danmandle:playlist:5ZwcCib9Fp38CygXSTi9Fw
		return 'spotify' + url.replace('http://open.spotify.com', '').replace(/\//gi, ':');
	}

// we should initialize some values
	trackChange();
	updateLocalPlaylist();
	startChecking();	

});