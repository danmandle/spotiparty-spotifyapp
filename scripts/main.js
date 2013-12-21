require([
  '$api/models',
  // 'scripts/language-example',
  'scripts/cover-example',
  // 'scripts/button-example',
  // 'scripts/playlist-example',
  // 'scripts/player-functions',
  // 'scripts/view'
], function(models, languageExample, coverExample, buttonExample, playlistExample) {
  'use strict';

  // languageExample.doHelloWorld();
  // coverExample.doCoverForAlbum();
  // buttonExample.doShareButtonForArtist();
  // buttonExample.doPlayButtonForAlbum();
  // playlistExample.doPlaylistForAlbum();

  window.urlToUri = function(url) {
    // convert URL to URI
    //// http://open.spotify.com/user/danmandle/playlist/5ZwcCib9Fp38CygXSTi9Fw
    //// spotify:user:danmandle:playlist:5ZwcCib9Fp38CygXSTi9Fw
    return 'spotify' + url.replace('http://open.spotify.com', '').replace(/\//gi, ':');
  }

  // we should initialize some values
  // trackChange();
  // updateLocalPlaylist();

});