class ChallengeBot{

    constructor(token){
        this.token = token;
        this.isConnected = false;
        this.challenges = {};
        this.currentChallenge = "";

        var RtmClient = require('@slack/client').RtmClient;
        var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

        this.rtm = new RtmClient(token);
        rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
            console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}`);
        });
        rtm.start();

        rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
            this.isConnected = true;
        });
        rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
            try{interpretText(message);}catch(e){}
        });
    }

    function interpretText(message){
        //TODO restructure all of below so it isn't all just if statements (eg. move them into their own functions or something)
        args = message.text.split(" ");
        if(args[0] != "@challengebot"){return;}
        if(args[1] == "add"){
            if(args.length < 4){
                this.rtm.sendMessage("Sorry, but the incorrect amount of parameters were provided for the 'add' command. Correct usage is '@challengebot add [challenge name (only 1 word)] [challenge description]'", message.channel);
                return;
            }
            this.challenges[args[3]] = args.splice(4, args.length).join(" ");
        }else if(args[1] == "remove"){
            var index = this.challenges.indexOf(args[3])
            if(index > -1){this.challenges.splice(index, 1);}
        }else if(args[1] == "possible"){
            this.rtm.sendMessage(String(Object.keys(this.challenges).join(", ")), message.channel);
        }else{
            this.rtm.sendMessage("To use this bot, type out '@challengebot' and then either 'add', 'remove', 'possible', 'describe', or 'current'.", message.channel);
        }
    }

}
