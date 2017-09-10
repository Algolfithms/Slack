//Not going to codegolf this
//Below makes the bots on slack
'use strict';
const ChallengeBot = require("./challengebot.js");

//Below handles the connection to the MongoDB database
const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL);
const database = mongoose.connection;
database.on('error', err => console.log(`Connection Error: ${err}`));

let challengebot = new ChallengeBot(process.env.challengeBotToken);

//Below makes a webpage so that a timer can keep pinging the website
//Prevents the script from going to sleep
var express = require('express');
var https = require("https");
var app = express();
app.use(express.static('public'));
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/index.html');
});
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
setInterval(function() {
    https.get("https://algolfithms-slack.herokuapp.com/");
}, 150000);
