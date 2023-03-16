// imports
const express = require("express");

// View logs
// require("firebase-functions/logger/compat");


const axios = require('axios');
const request = require("request");
const { text } = require('express');
const app = express();
app.use(express.json());

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
const functions = require('firebase-functions');
const { json } = require("express");

exports.bigben = functions.https.onRequest((req, res) => {
  console.log("in big ben");
  const hours = (new Date().getHours() % 12) + 1  // London is UTC + 1hr;
  res.status(200).send(`<!doctype html>
    <head>
      <title>Time</title>
    </head>
    <body>
      ${'BONG '.repeat(hours)}
    </body>
  </html>`);
});

exports.callback = functions.https.onRequest((req, res) => {
  console.log("in callback");
  // Check the hostname and set REDIRECT_URL to the correct URL
  const hostName = req.get('host');
  if (hostName == "localhost:4000") {
    REDIRECT_URI = "http://localhost:4000/callback";
  } else {
    // REDIRECT_URI = "https://audreyqiu2.github.io/aud.iovisualizer/callback";
    // REDIRECT_URI = "https://aud-iovisualizer-380501.web.app/callback";
    REDIRECT_URI = "http://127.0.0.1:5002/callback";
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
    res.sendFile(__dirname + "../public/index.html");
  });
});

exports.get_me = functions.https.onRequest((req, res) => {
  const authOptions = {
    url: BASE_URL + '/me',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`
    }
  };

  axios.get(authOptions.url, { headers: authOptions.headers })
    .then(response => {
      res.type(json);
      res.status(200).send(response.data);
    })
    .catch(error => {

      console.error(error);
      res.type(json);
      res.status(500);
      res.sendFile(__dirname + "../public/index.html");
    });
});