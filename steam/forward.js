// Steam's sign-in returns here with its signed answer in the address; the
// answer goes on to the app's own scheme, which the sign-in sheet catches.
// Plymo's server then asks Steam itself whether it signed that answer, so
// nothing here is trusted, kept or sent anywhere else.
(function () {
  var query = window.location.search;
  if (/[?&]openid\.mode=/.test(query)) {
    window.location.replace('com.plymo.plymo://steam' + query);
  }
})();
