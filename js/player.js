$(function(){
	// Update the page when the app loads
	nowPlaying();
	
	// Listen for track changes and update the page
	player.observe(models.EVENT.CHANGE, function (event) {
		if (event.data.curtrack == true) {
			var track = player.track;
			$("#play-history").append('<div>Track changed to: '+track.name+' by '+track.album.artist.name+'</div>');
		}
		nowPlaying();
		
	}); 
	
	$("#commands a").click(function(e){
		switch($(this).attr('command')) {
			case "togglePause":
				// Check if playing and reverse it
				player.playing = !(player.playing);
				e.preventDefault();
				break;
			case "getPosition":
				// get position of player
				console.log(player.position);
				// get length of current song
				console.log(player.track.duration);
				e.preventDefault();
				break;
			case "startParty":
				// clear playlist
				clearPlaylist(tempPlaylist);

				// load in songs, would be an ajax request
				var data = {
					'songs': ['spotify:track:30g7tH1rfMratchnaLfgqJ', 'spotify:track:3kZC0ZmFWrEHdUCmUqlvgZ', 'spotify:track:5yc59J3MR3tVDPTOgwgRI5', 'spotify:track:2bD1AW4yqiCurGCva6r88a', 'spotify:track:3PJikMV2xGNCooQttQrAw5']
				};
				if (data.songs.length > 0) {
					$.each(data.songs, function(index, value) {
						tempPlaylist.add(value);
						console.log("added track uri " + value);
					});
				}else{
					console.log('No songs in the queue');
				}

				// display playlist in app
				var playlistList = new views.List(tempPlaylist);
					playlistList.node.classList.add("temporary");
					$("#playlistContainer").html(playlistList.node);

				// var list = List.forPlaylist(tempPlaylist); // add options later, like height and number of items before scroll
				// $('#playlistContainer').html(list.node);
				// list.init();

				// play!
				player.play("spotify:track:30g7tH1rfMratchnaLfgqJ", tempPlaylist.data.uri, 0);

				e.preventDefault();
				break;
			case "skip":
				// skip to next track
				player.next();
				e.preventDefault();
				break;				
			case "playTrackFromUri":
				// Grab a random track from your library (cause it's more fun)
				var tracks = library.tracks;
				var track = tracks[Math.floor(Math.random()*tracks.length)]
				clearPlaylist(tempPlaylist);
				tempPlaylist.add(track.data.uri);
				player.play(track.data.uri, tempPlaylist.data.uri, 0);
				e.preventDefault();
				break;
			case "playTrackFromContext":
				// Play an item (artist, album, playlist) from a particular position
				player.play(
					$(this).attr('href'),				// Item to play
					$(this).attr('href'),				// Context to use
					parseInt($(this).attr('pos'))		// Position to play from
				);
				e.preventDefault();
				break;
			case "showSharePopup":
				// skip to next track
				application.showSharePopup(document.getElementById($(this).attr('id')),player.track.uri); // This will fail if you're listening to a local track :(
				e.preventDefault();
				break;
		}
	});
	
});

function clearPlaylist(playlist) {
	while (playlist.data.length > 0) {
		playlist.data.remove(0);
	}
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
		'songs': ['spotify:track:30g7tH1rfMratchnaLfgqJ', 'spotify:track:3kZC0ZmFWrEHdUCmUqlvgZ', 'spotify:track:5yc59J3MR3tVDPTOgwgRI5', 'spotify:track:2bD1AW4yqiCurGCva6r88a', 'spotify:track:3PJikMV2xGNCooQttQrAw5']
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

window.songPosition = function() {
	window.songPositionChecker = setInterval(function() {
		// get current position
		console.log(player.position);
		// get length of current song
		console.log(player.track.duration);
	}, 2000);
};
window.songPosition();

function nowPlaying() {

	// This will be null if nothing is playing.
	var track = player.track;

	if (track == null) {
		$("#now-playing").html("Painful silence!");
	} else {
		var link = null;
		if (player.context)
			link = new models.Link(player.context);
		else
			link = new models.Link(player.track.uri);
			
		if (link.type === models.Link.TYPE.ARTIST)
			playerImage.context = models.Artist.fromURI(link.uri);
		else if (link.type === models.Link.TYPE.PLAYLIST)
			playerImage.context = models.Playlist.fromURI(link.uri);
		else if (link.type === models.Link.TYPE.INTERNAL) {
			if (tempPlaylist.length > 0)
				playerImage.context = tempPlaylist;
		}
			
		$("#now-playing").empty();
		var cover = $(document.createElement('div')).attr('id', 'player-image');

		if (link.type === models.Link.TYPE.TRACK || link.type === models.Link.TYPE.LOCAL_TRACK ||
			(link.type === models.Link.TYPE.INTERNAL && tempPlaylist.length == 0)) {
			cover.append($(document.createElement('a')).attr('href', track.data.album.uri));
			var img = new ui.SPImage(track.data.album.cover ? track.data.album.cover : "sp://import/img/placeholders/300-album.png");
			cover.children().append(img.node);
		} else {
			cover.append($(playerImage.node));
		}
		
		$("#now-playing").append(cover);
		
		var song = '<a href="'+track.uri+'">'+track.name+'</a>';
		var album = '<a href="'+track.album.uri+'">'+track.album.name+'</a>';
		var artist = '<a href="'+track.album.artist.uri+'">'+track.album.artist.name+'</a>';
		var context = player.context, extra ="";
		if(context) { extra = ' from <a href="'+context+'">here</a>'; } // too lazy to fetch the actual context name
		$("#now-playing").append(song+" by "+artist+" off "+album+extra);
	}
	
}