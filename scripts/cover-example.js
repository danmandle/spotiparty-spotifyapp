require([
  '$api/models',
  '$views/image#Image'
], function(models, Image) {
  'use strict';
  
  var imageURI = null;

  function trackChange(){
  	models.player.load('track').done(function(p) {
  	    
  	    window.track = p.track;
  	    
  	    console.log('Song: '+track.name+' by '+track.artists[0].name);
  	    
  	    updateCoverArt(track);
  	    updateTrackTitle(track);
  	 });
  	
  };
  
  function updateCoverArt(track){
  	var image = Image.forTrack(track, {width: 500, height: 500, player: false});
  	if(imageURI != image._item.uri){
  		// evaluate so that it doesn't reload the image each time the play state changes
  		imageURI = image._item.uri;
  		$('#albumCoverContainer').html(image.node); 
  	}
  }
  
  function updateTrackTitle(track){
  	$('h1#current-track').text(track.artists[0].name + ' - ' + track.name);
  }
  
  window.songPosition = function(){window.songPositionChecker = setInterval(function(){
  	
  	
  	models.player.load('position').done(function(p) {
	  	
	  	var percentComplete = p.position / p.duration;
  		console.log('position: '+p.position);
	  	console.log('percentComplete: '+percentComplete);
	  		  	
	  	if((p.duration - p.position) < 9000){ // if there's less that 9 seconds left in the song
	  		prepNextSong();
	  	}
	  	
	  	!p.playing ? clearInterval(songPosition) : null;
	});
  }, 500)};
  
  window.stopChecking = function(){
  	clearInterval(songPosition);
  }
 
 function prepNextSong(){
 	console.log('Song ending, grab next song');
 }
 
  // update on change
  models.player.addEventListener('change:track', function(p) {
      trackChange();
  });
  
  models.player.addEventListener('change:playing', function(p) {
      console.log((p.target.playing?'Started':'Stopped') + ' playing');
      
      (p.target.playing)? window.songPosition() : clearInterval(window.songPositionChecker);
    /*=====
    
    	There's an edge case here where if you start playing a song with less than 5 secs left, it won't trigger prepNextSong
    
     =====*/  
	// if((p.target.duration - p.target.position) > 9000){
	// 	(p.target.playing)? window.songPosition() : clearInterval(window.songPositionChecker);
	// }
	// else{
	// 	prepNextSong();
	// }
  });
  
  trackChange();
});