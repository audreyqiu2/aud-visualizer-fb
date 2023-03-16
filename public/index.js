console.log("in index.js");

const port = 4000;

// Developer codes
var CLIENT_ID = '9d94f606e5f14c6e9d25d87b2ed63cfb'
var CLIENT_SECRET = '2598aa227a584e9e8ca50b0ff559d01c';
// var REDIRECT_URI = window.location.href + "callback";
// let REDIRECT_URI = "http://localhost:4000/callback";
let REDIRECT_URI = "h";



// Base URL for logging in and OAuth authentification
const baseAuthURL = "https://accounts.spotify.com/authorize";

// Scope of the API calls
const scope = "user-modify-playback-state streaming user-library-read playlist-read-private";

// Access token to be retrieved
let access_token = "";
let CODE = "";
let device_id = "";

// For collecting current user's playlists
// Contains endpoints to the Spotify API to get info about the playlist
let playlists = [];


window.addEventListener("load", init);

// Sets up the Spotify player
window.onSpotifyWebPlaybackSDKReady = () => {
  const token = access_token;
  const player = new Spotify.Player({
    name: 'AUDiovisualizer Player',
    getOAuthToken: cb => { cb(token); },
    volume: 0.5
  });
  console.log("player ready");
}

function init() {
  console.log("in init");
  console.log(window.location.href);
  REDIRECT_URI = window.location.href + "callback"
  afterAuthentication();

  // Listen to button for logging in to Spotify
  id("loginBtn").addEventListener("click", authorizationRequestHandler);

}

function authorizationRequestHandler() {
  const state = generateRandomString(16);
  let url = "https://accounts.spotify.com/authorize?" +
    "client_id=" + CLIENT_ID +
    "&response_type=code" +
    "&redirect_uri=" + encodeURI(REDIRECT_URI) +
    "&show_dialogue=true" +
    "&scope=" + encodeURI(scope) +
    "&state=" + state;

  // fetch('/bigben')
  //   .then(response => response.text())
  //   .catch(e => {console.error(e)});

  window.location.href = url;
  // window.location.href += "bigben";

  afterAuthentication();
}

function generateRandomString(length) {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// After the user is authenticated through the Spotify API, hide the login button,
// and show the playlists as a list to choose from
function afterAuthentication() {
  console.log('in after Authentifiation');
  // Retrieves access token as cookie
  access_token = document.cookie.split('=')[1];

  if (window.location.search.length > 0) {
    id("loginBtn").classList.add("hidden");
    id("playlists-container").classList.remove("hidden");
    id("myPlaylistsHeading").classList.remove("hidden");
    makeRequestForUserInfo();
    // makeRequestForPlaylists();
  } else {
    id("loginBtn").classList.remove("hidden");
    id("playlists-container").classList.add("hidden");
    id("myPlaylistsHeading").classList.add("hidden");
  }

  window.addEventListener('message', function(event) {
    // Only resize the iframe if the message is of type 'resize'
    if (event.data.type === 'resize') {
      var iframe = id("visual");
      // Set the width and height of the iframe to match the canvas size
      iframe.style.width = event.data.width + 'px';
      iframe.style.height = event.data.height + 'px';
    }
  });
}

// Gets devices to play and sets the des
function getDevices() {
  fetch('/get_devices')
    .then(response => response.json())
    .then(data => {
      console.log(data);
    })
    .catch(e => console.error(e));
}

// Makes request to get top 10 playlists from current user
function makeRequestForPlaylists() {
  fetch('/get_my_playlists')
    .then(response => response.json())
    .then(data => {
      handlePlaylists(data);
    })
    .catch(error => console.error(error));
}

// Handles the data returned with 10 playlists from current user.
// Adds their name to the DOM.
function handlePlaylists(data) {
  // Logs data from the top 10 playlists
  console.log(data);

  for (let i = 0; i < data.items.length; i++) {
    let playlist = data.items[i];
    let playlist_uri = playlist.uri;
    playlists.push(playlist_uri);

    // Querying for the HTML element to modify
    let idx = i + 1;
    let query = "#playlists :nth-child(" + idx + ")";
    let listNode = qs(query);
    listNode.innerHTML = playlist.name;
    listNode.addEventListener("click", () => {
      makeRequestRefreshToken();
      makeRequestToPlay(idx);
    });
  }
  console.log(playlists);
}

// Handles a request to the Spotify API to start a playback on the specified playlist
function makeRequestToPlay(idx) {
  let uri = playlists[idx - 1];
  fetch('/playback_start', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      playlist_uri: uri
    })
  })
    .then(response => {
      console.log("playingggg!");
    })
    .catch(error => console.error());
}

// Handles a request to the Spotify API to get user info
function makeRequestForUserInfo() {
  console.log("in makeRequestForUserInfo");
  fetch('/get_me')
    .then(response => response.json())
    .then(data => {
      console.log("got data for user info");
      let nameNode = id("username");
      let avatarNode = qs("#myPlaylistsHeading img");

      avatarNode.src = data.images[0].url;
      nameNode.textContent = data.display_name;

      // console.log(data);
    })
    .catch(error => {
      error.json()
      console.error(error)});
}

function makeRequestRefreshToken() {
  fetch('/refresh_token')
    .then(response => response.json())
    .then(data => {
      console.log(data);
      access_token = data.access_token;
    })
    .catch(e => {console.error(e)})
}

// Takes the playlist url that is returned from the user's most recent playlists;
// handles a request to get more info about the playlist
function makeRequestForPlaylistInfo(playlistUrl) {
  let modDate = null;
  fetch('/get_playlist_info', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      playlist_url: playlistUrl
    })
  })
    .then(response => response.json())
    .then(data => {
      modDate = data.tracks.items[0].added_at;
    })
    .catch(error => console.error());
}


//////////////////////////////////////////////////////////////////////////////////////////
// HELPER METHODS //
/**
   * Checks the status of the fetch request sent to the Pokemon API. If HTTP status
   * is within the correct range, returns true. Returns false otherwise.
   * @param {JSObject} response - Response from the fetch request to the Pokemon API.
   * @returns {boolean} - Returns whether the "status" field of the response object reads "ok".
   */
async function statusCheck(response) {
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response;
}

/**
 * Auxilary function for query selecting all and returning elements by selector
 * @param {string} selector - selector for elements to be returned
 * @return {NodeList} returns node list of HTML elements with corresponding CSS selector
 */
function id(selector) {
  return document.getElementById(selector);
}

/**
 * Auxilary function for query selecting and returning element by id
 * @param {string} selector - selector for element to be returned
 * @return {NodeList} returns HTML element with corresponding CSS selector
 */
function qs(selector) {
  return document.querySelector(selector);
}

/**
 * Auxilary function for query selecting and returning element by id
 * @param {string} selector - selector for element to be returned
 * @return {NodeList} returns HTML element with corresponding CSS selector
 */
function qsa(selector) {
  return document.querySelectorAll(selector);
}
