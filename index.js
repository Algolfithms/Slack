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
setInterval(function() {
    http.get("https://algolfithms-slack.herokuapp.com/");
}, 150000);
