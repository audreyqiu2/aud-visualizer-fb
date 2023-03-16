// imports
const express = require("express");
// const decodedToken = jwt.decode(access_token)
const axios = require('axios');
const request = require("request");
const { text } = require('express');
const app = express();
app.use(express.json());

const port = 443;

// console.log("window.location.href", window.location.href);
// if (window.location.href == "http://localhost:4000/callback") {
//   port = 4000;
// } else {
//   port = 443;
// }


var CLIENT_ID = '9d94f606e5f14c6e9d25d87b2ed63cfb';
var CLIENT_SECRET = '2598aa227a584e9e8ca50b0ff559d01c';
// var REDIRECT_URI = "http://localhost:4000/callback";
let REDIRECT_URI = "";


// Scope of the API calls
const scope = "user-modify-playback-state streaming user-library-read playlist-read-private";


// Base URL for making calls to Spotify API once logged in
const BASE_URL = "https://api.spotify.com/v1";

// access code + token
let code = "";
let access_token = "";
let refresh_token = "";
let expires_at = null;

// static files
app.use(express.static("public"));
app.use("/styles.css", express.static(__dirname + "/styles.css"));
app.use("/index.js", express.static(__dirname + "/index.js"));
app.use("/index.html", express.static(__dirname + "/index.html"));

// Request access token and refresh token from Spotify API
app.get('/callback', (req, res) => {
  // Check the hostname and set REDIRECT_URL to the correct URL
  const hostName = req.get('host');
  if (hostName = "localhost:4000") {
    REDIRECT_URI = "http://localhost:4000/callback";
  } else {
    REDIRECT_URI = "https://audreyqiu2.github.io/aud.iovisualizer/callback";
  }

  const code = req.query.code;
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
    },
    json: true
  };

  request.post(authOptions, (error, response, body) => {
    access_token = body.access_token;
    refresh_token = body.refresh_token;

    console.log('access token', access_token);
    console.log('refresh token', refresh_token);

    res.append('Set-Cookie', 'access_token=' + access_token);
    res.sendFile(__dirname + "./index.html");
  });
});

// Gets basic current user information
app.get('/get-me', (req, res) => {
  const authOptions = {
    url: BASE_URL + '/me',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`
    }
  };

  axios.get(authOptions.url, { headers: authOptions.headers })
    .then(response => {
      // console.log(response.data);
      res.status(200).send(response.data);
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error getting user info');
    })
});

// Gets current user's top playlists
app.get('/get-my-playlists', (req, res) => {

  console.log("access_token", access_token);

  const authOptions = {
    url: BASE_URL + '/me/playlists?limit=10',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`
    }
  };

  axios.get(authOptions.url, { headers: authOptions.headers })
    .then(response => {
      // console.log(response.data);
      res.status(200).send(response.data);
    })
    .catch(error => {
      console.error(error);
      res.type(text);
      res.status(500).send('Error getting users playlists');
    })
});

app.get('/get-devices', async (req,res) => {
  const playlistUrl = req.body.playlist_url;
  console.log(playlistUrl);
  let url = BASE_URL + "/me/player/devices";

  try {
    const response = await axios.put(url, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.log(error);
    res.status(500);
  }
});

// Start Spotify playback
app.put('/playback/start', async (req, res) => {
  const playlistUri = req.body.playlist_uri;
  console.log(playlistUri);
  let url = BASE_URL + "/me/player/play";

  try {
    const response = await axios.put(url,
    {
      context_uri: playlistUri
    },
    {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    res.status(200).send('Playback started successfully');
  } catch (error) {
    // console.log(error);
    res.status(500);
  }
});

// Get more playlist info
app.post('/get-playlist-info', async (req, res) => {
  const playlistUrl = req.body.playlist_url;
  console.log(playlistUrl);
  let url = BASE_URL + "/me/player/play";
  // url += "";
  // console.log(url);
  // let filter = "fields=tracks.items(added_at)";

  try {
    const response = await axios.put(url, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.log(error);
    res.status(500).send('Something went wrong!');
  }
});

// Uses the refresh token to ask for a new access token
app.get('/refresh_token', function(req, res) {
  console.log('refresh token:', refresh_token);

  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      access_token = body.access_token;
      console.log('refreshed access token:', access_token);
      res.send({
        'access_token': access_token
      });
    }
  });
})

app.listen(port, () => console.info("listening on port ${port}"));