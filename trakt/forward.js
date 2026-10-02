// Trakt returned here on a system whose sign-in sheet cannot catch this
// address (before iOS 17.4): the answer goes on to the app's own scheme,
// which the sheet catches. The code is useless to anyone but the app that
// asked for it (PKCE), and nothing is kept or sent anywhere else.
(function () {
  var query = window.location.search;
  if (/[?&](code|error)=/.test(query)) {
    window.location.replace('com.plymo.plymo://trakt' + query);
  }
})();
