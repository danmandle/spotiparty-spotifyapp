require([
	'$api/models',
	'$views/image#Image',
	'$views/list#List'
], function(models, Image, List) {
	'use strict';

// Inital app load
	function init(){
		if(!window.appInitialized){

			console.log("Initalizing");

			// window.theSongs = {
			// 	'songs': [
			// 		'spotify:track:6IKNeMqF1V1gmNkiZh1MmZ',
			// 		'spotify:track:3PJikMV2xGNCooQttQrAw5',
			// 		'spotify:track:30g7tH1rfMratchnaLfgqJ',
			// 		'spotify:track:3kZC0ZmFWrEHdUCmUqlvgZ',
			// 		'spotify:track:5yc59J3MR3tVDPTOgwgRI5',
			// 		'spotify:track:2bD1AW4yqiCurGCva6r88a',
			// 		'spotify:track:1x5MjCffpcdHLf65eR9r3T',
			// 		'spotify:track:5KQrOv9nFVnM465CVGriW9',
			// 		'spotify:track:5qEn8c0MBzyRKgQq91Vevi',
			// 		'spotify:track:7Ik1qCkU5NIeBNFzoehjix',
			// 		'spotify:track:0GO8y8jQk1PkHzS31d699N',
			// 		'spotify:track:3l8dM1wjgFh98jpiq5ZCe7',
			// 		'spotify:track:2XbqxKjCnE9YWfPRqwgtPq'
			// 	]
			// };

			// window.theSongs = {'songs' : []};
			models.Playlist.createTemporary('webTempPlaylist').done(function(playlist) {
				window.webTempPlaylist = playlist;

				// console.log("first created", window.theQueue, window.webTempPlaylist);
				console.log("playlist " + playlist.name + " created");

				playlist.load('tracks').done(function(playlist){
					playlist.tracks.clear().done(function(){

						models.Playlist.createTemporary('theQueue').done(function(playlist) {
							window.theQueue = playlist;

							console.log("playlist " + playlist.name + " created", playlist);

							playlist.load('tracks').done(function(playlist){
								playlist.tracks.clear().done(function(){
									updateLocalPlaylist();
								}).fail(function(){
									console.error("Error clearing theQueue tracks");
								});
							});
						}).fail(function(error) {
							console.error("Error creating temp playlist", error);
						});

					}).fail(function(){
						console.error("Error clearing theQueue tracks");
					});
				});

			}).fail(function(error) {
				console.error("Error creating temp playlist", error);
			});


			// models.player.addEventListener('change', function(e) {
			// 	console.error('something changed',e);
			// });

			models.player.addEventListener('change:playing', function(e) {
				console.log((e.target.playing ? 'Started' : 'Stopped') + ' playing');
				if(e.target.playing){
					window.startChecking();
				}
				else{
					stopChecking();
				}
			});

			// Gets fired when a track ends or is skipped
			models.player.addEventListener('change:track', function(e) {
				trackChanged(e);
			});

			window.appInitialized = true;
			window.firstTime = true;
		}
		else{
			console.log("App has already been initialized");
		}

		updateCurrentPlayingView();
		startChecking();
		addSwipeWatcher();
	}

// Playlist Control
	$('#clearPlaylist').click(function(){
		clearTempPlaylist();
	});
	function clearTempPlaylist(){
		console.log('Clearing Temp Playlist');
		window.webTempPlaylist.load("tracks").done(function(spotipartyPlaylist) {
			spotipartyPlaylist.tracks.clear();
			updatePlaylistList('#playlistContainer', window.webTempPlaylist);
		}).fail(function(error) {
			console.error(error);
		});
	}

	$('#clearQueue').click(function(){
		console.log('Clearing Temp Playlist');
		window.theQueue.load("tracks").done(function(spotipartyPlaylist) {
			spotipartyPlaylist.tracks.clear();
			updatePlaylistList('#playQueue', window.theQueue);
		}).fail(function(error) {
			console.error(error);
		});
	});

	function updatePlaylistList(div, playlist){

		setTimeout($.proxy(function() {
			var list = List.forPlaylist(playlist); // add options later, like height and number of items before scroll
			$(div).html(list.node);
			list.init();
		}, this), 100);
	}



	function updateLocalPlaylist(callback) {
		// console.log('The callback: ', callback);

		window.webTempPlaylist.load("tracks").done(function(spotipartyPlaylist) {

			models.player.load('track', 'context').done(function(player) {
				// console.log(player);

				// if(false){
				// if(player.track != null){

					spotipartyPlaylist.tracks.clear(window.webTempPlaylist).done(function(p){
						// console.log('done clearing');

						setTimeout($.proxy(function() {
							updatePlaylistFromWeb(spotipartyPlaylist, callback);
						}, this), 10);


					}).fail(function(error) {
						console.error("clearing mishap",error);
					});

					// spotipartyPlaylist.tracks.clear();
					// console.log(spotipartyPlaylist.tracks.toArray());

				// }
				// else{
				// 	updatePlaylistFromWeb(spotipartyPlaylist, callback);
				// }

			}).fail(function(error) {
				console.error(error);
			});


		}).fail(function(error) {
			console.error(error);
		});
	}

	function addNextSongToQueue(track){
		window.songAdded = true;

		var theTrack = models.Track.fromURI(track);

		removePlayedSong(theTrack);

		// console.log("so i can find it again", theTrack);

		window.theQueue.load("tracks").done(function(queue) {
			queue.tracks.add(theTrack).done(function(track){

				console.log("Added " + theTrack.name + " to " + window.theQueue.name);

				updatePlaylistList('#playQueue', window.theQueue);
			});
		});
	}

	function removePlayedSong(track){
		// remove URI from web playlist
		console.log('removed', track.name, "from web queue");

		// window.theSongs.songs.splice($.inArray(track.uri, window.theSongs.songs),1);

		var theUrl = "http://spotiparty.co/party/removeFromPlaylist?user=" + window.theUser.username + "&track="+track.uri

		console.log(theUrl);

		 $.ajax({
				url: theUrl
		 }).done(function(result) {
		 	console.log("removed "+track.name+" from online playlist");
		 }).error(function(theError){
		 	console.error("ajax error", theError);
		 });

		window.songAdded = false;
	}

	function updatePlaylistFromWeb(localPlaylist, callback) {
		// AJAX call would go here...
		models.User.fromURI('spotify:user:@').load('username', 'name').done(function(user) {
			window.theUser = user;
		    $.ajax({
		   		url: "http://spotiparty.co/party/getParty?user=" + window.theUser.username
		    }).done(function(result) {
				console.log("result", result);

				if(result[0].playlist.length > 0){
					var theSongs = Array();

					$.each(result[0].playlist, function(index, playlistItem){
						theSongs.push(playlistItem.songId);
						// console.log(playlistItem.songId);
						// console.log(playlistItem.user.name);
					});

					if(!window.songAdded && !window.firstTime){
						addNextSongToQueue(models.Track.fromURI(theSongs[0]));
					}
					else if(window.firstTime){
						window.firstTime = false;
						console.log("skipping adding the song");
					}

					localPlaylist.tracks.add(models.Track.fromURIs(theSongs)).done(function(stuffs){
						// added all songs to display
						updatePlaylistList('#playlistContainer', window.webTempPlaylist);
						callback ? callback() : undefined;
					});

				} else {
					console.log('No songs in the queue');
					grabFromBackupPlaylist();
				}
			});
		});
	}

	function grabFromBackupPlaylist(){
		if(localStorage.backupPlaylist){
			models.Playlist.fromURI(localStorage.backupPlaylist).load('name','uri','tracks').done(function(playlist) {
				playlist.tracks.snapshot().done(function(snapshot) {
					var tracksInPlaylist = snapshot.toArray();

					var selectedTrack = tracksInPlaylist[Math.floor(Math.random()*tracksInPlaylist.length)];

					addNextSongToQueue(selectedTrack);
				});
			});
		}
		else{
			console.error("Backup Playlist not set. Out of songs to play.");
		}
	}


// View
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

	function updateCurrentPlayingView(maybePlayer) {
		console.log('trying to update current play view');

		if(maybePlayer){
			// use the player from the event
			updateView(maybePlayer);
		}
		else{
			models.player.load('track').done(function(player) {
				updateView(player);
			}).fail(function(error) {
				console.error("error on player load", error);
			});

		}


		function updateView(player){
			if(player.track != undefined){

				// console.log("track",player.track.name);

				$('#current-track-artist').text(player.track.artists[0].name);
				$('#current-track-title').text(player.track.name);

				console.log(player.track);

				var image = Image.forTrack(player.track, {
					width: 130,
					height: 130,
					player: false
				});
				if (imageURI != image._item.uri) {
					// evaluate so that it doesn't reload the image each time the play state changes
					imageURI = image._item.uri;
					$('#albumCoverContainer').html(image.node);
				}
			}
			else{
				console.log("yo dawg, player track is undefined."); //Probably from that moment between when a track stops and starts
			}
		}

	};
	function addSwipeWatcher(){
		//Enable swiping...
		console.log('watching for swipe...');
		$("body").swipe( {
			//Generic swipe handler for all directions
			swipe:function(event, direction, distance, duration, fingerCount) {
				if(direction == "left"){
					console.log('swipe back');
					models.player.skipToPrevTrack();
				}
				if(direction == "right"){
					console.log('swipe next');


					updateLocalPlaylist(function(){models.player.skipToNextTrack()});
				}
			},
			//Default is 75px, set to 50
		   threshold:50
		});
	}

// Player Functions
	$('#startTheParty').click(function(){
		console.log('Let the party begin');
		updateLocalPlaylist(function(){
			models.player.stop().done(function(p) {
				models.player.playContext(window.theQueue);
			});
		});

	});

	function trackChanged(e){
		console.log('track changed');

		// models.player.load('position', 'playing').done(function(p) {

		// e.target.context.uri;

		startChecking();

		// (e.oldValue != null) ? removePlayedSong(e.oldValue) : undefined;

		updateCurrentPlayingView(e.target);

	}

	window.songPosition = function() {
		// window.checking = true;

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
				console.log("playing: ", p.playing, "position: ", p.positon);
				console.log("was going to check positon, but decieded against it. Also stopping checking.");
				stopChecking();
			}
		}).fail(function(error) {
			console.error(error);
		});
	};

	window.startChecking = function(){
		// console.log('started checking, waiting 5 seconds');
		// setTimeout($.proxy(function() {
		// 	window.songPositionChecker = window.setInterval(songPosition, 2000);
		// }, this), 5000);
		if(window.checking){
			console.log('already checking');
		}
		else{
			window.checking = true;
			window.songPositionChecker = window.setInterval(songPosition, 2000);
		}
	};
	window.stopChecking = function() {
		window.checking = false;
		console.log('stopped checking');
		clearInterval(window.songPositionChecker);
	};

	window.urlToUri = function(url) {
		// convert URL to URI
		//// http://open.spotify.com/user/danmandle/playlist/5ZwcCib9Fp38CygXSTi9Fw
		//// spotify:user:danmandle:playlist:5ZwcCib9Fp38CygXSTi9Fw
		return 'spotify' + url.replace('http://open.spotify.com', '').replace(/\//gi, ':');
	}

if(localStorage.partyName != undefined){
   $('#partyNameTop').text("Spotiparty - " + localStorage.partyName);
}



init();

});