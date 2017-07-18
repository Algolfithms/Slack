//Not going to codegolf this
//Below makes the bots on slack
//Bots only actually get constructed if not editing
//This makes sure the slack rate limit never comes into play
'use strict';
var editing = true;
const ChallengeBot = require("./challengebot.js");
if(!editing){
    let challengebot = new ChallengeBot(process.env.challengeBotToken);
}

//Below makes a webpage so that a timer can keep pinging the website
//Prevents the script from going to sleep
var express = require('express');
var http = require("http");
var app = express();
app.use(express.static('public'));
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/index.html');
});
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
setInterval(function() {
    http.get("https://algolfithms-slack.herokuapp.com/");
}, 150000);
