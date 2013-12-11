require([
	'$api/models',
	'$views/image#Image',
	'$views/list#List'
], function(models, Image, List) {
	'use strict';

	models.player.addEventListener('change:playing', function(p) {
		console.log((p.target.playing ? 'Started' : 'Stopped') + ' playing');

		(p.target.playing) ? window.songPosition() : stopChecking();

	});

	// Gets fired when a track ends or is skipped
	models.player.addEventListener('change:track', function(p) {
		console.log('song changed');
		trackChange();
	});

	window.songPosition = function() {

		models.player.load('position', 'playing').done(function(p) {

			window.thePlayer = p;

			// var percentComplete = Math.round((p.position / p.duration)*100);

			var percentComplete = (p.position / p.duration);
			// console.log('seconds left: ' + (p.duration - p.position));
			console.log(Math.round((p.duration - p.position)/1000) + " seconds left");
			console.log('percentComplete: ' + percentComplete);

			// console.log(Math.round((p.duration - p.position)/1000) + " seconds left");

			!p.playing ? stopChecking() : null;

		}).fail(function(error) {
			console.log(error);
		});

		// window.songPositionChecker = setInterval(window.position, 2000);

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

	window.songPositionChecker = function(){window.setInterval(songPosition, 2000)};

	window.stopChecking = function() {
		clearInterval(window.songPositionChecker);
	}

});