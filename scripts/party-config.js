require(['$api/models', '$api/location'], function(models, location) {
  // window.socket = io.connect('http://127.0.0.1:1337');
  // socket.on('connect', function() {
  //   alert('connect')
  // });
  // var Party = {};
  // var user = models.User.fromURI('spotify:user:@');
  //   user.load('username', 'name').done(function(u) {
  //     $('#user').val(u.identifier);
  //     Party.user = u;
  // });
  // var loc = location.Location.query();
  // loc.load(['latitude']).done(function(loc) {
  //   console.log("Latitude: " + loc.latitude);
  // });

  $('#createPartyForm').on('submit', function(evt) {
    evt.preventDefault();
    var $form = $(this);
    var name = $form.find('#partyName').val();
    var user = $form.find('#user').val();

    localStorage.partyName = name;

    $.ajax({
		url: 'http://127.0.0.1:1337/party',
		type: 'POST',
		crossDomain: true,
		data: {
		  partyName: name,
		 	user: user,
		  lat: localStorage.latitude,
		  long: localStorage.longitude,
		  radius: localStorage.radius
		}
		});
  });
});