'use strict';
class ChallengeBot{

    /**
     * A constructor for a ChallengeBot
     * Takes in a token and then initializes class properties as well as
     * Sets bot handlers for events
     */
    constructor(token, databaseURL){
        console.log("Starting challengebot...");

        //Initializes challengebot instancedata
        this.commands = {};
        this.id = "";
        this.database;

        //Handles connecting to the database
        var pg = require('pg');
        this.database = new pg.Pool({connectionString:databaseURL});
        this.database.connect(function(err){
            if(err){
                console.log("Couldn't connect to the database\n", err);
            }
        });

        //Gets all of the needed slack npm libraries
        var RtmClient = require('@slack/client').RtmClient;
        var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
        var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

        //Sets the handler for what the bot should do once it initializes
        this.rtm = new RtmClient(token);
        this.rtm.idFunc = (id) => this.id = id;
        this.rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
            var id = "<@" + rtmStartData.self.id + ">";
            console.log(rtmStartData.self.name + " is ready to rumble as " + id + " on the team " + rtmStartData.team.name);
            this.idFunc(id);
        });
        this.rtm.start();

        //Sets the handler for what the bot should do whenever it sees a message
        var msgFunc = (message) => this.interpretText(message);
        this.rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
            console.log(message.channel + ">:" + message.text);
            msgFunc(message);
        });

        //Initializes all of the challengebot's possible commands and assigns them functions
        this.commands["add"] = this.addChallenge;
        this.commands["remove"] = this.removeChallenge;
        this.commands["describe"] = this.describeChallenge;
        this.commands["possible"] = this.getPossibleChallenges;
        this.commands["current"] = this.getCurrentChallenge;
    }

    /**
     * Makes the bot send a message on a specified channel and then logs it
     */
    sendMessage(message, channel){
        console.log(channel + ">: " + message);
        this.rtm.sendMessage(message, channel);
    }

    /**
     * Takes a message the user enterred and handles any commands they gave
     */
    interpretText(message){
        try{
            var args = message.text.split(" ");
            if(args[0] !== this.id){return;} //Will quit the execution of the function if the first word of the message isn't "@challengebot"
            args.push(null);
        }catch(e){
            console.log(e.message);
            return;
        }
        var stringToOutput = "";
        try{
            stringToOutput = this.commands[args[1]](args.slice(2, args.length));
        }catch(e){
            stringToOutput = "The command wasn't understood... The possible commands I listen to are ";
            for(i = 0; i < Object.keys(this.commands).length; i++){
                stringToOutput += "'" + Object.keys(this.commands)[i] + "'" + (i == Object.keys(this.commands).length - 1)? "" : (i == Object.keys(this.commands).length - 2)? ", and " : ", " ;
            }
        }
        this.sendMessage(stringToOutput, message.channel);
    }

    /**
     * Adds a challenge to the list of possible challenges and returns the success of adding the challenge
     */
    addChallenge(args){
        try{
            this.database.query("INSERT INTO challenges (name, description) VALUES ($1, $2)", [args[0], args.slice(1, args.length).join(" ")]);
            return "I attempted the addition of the challenge successfully.";
        }catch(e){
            console.log(e.message);
            return "I couldn't add your challenge... The connection to the database may not be working, or you may have given incorrect arguments; the correct usage of this command is '@challengebot add [one word challenge name] [challenge description]'.";
        }
    }

    /**
     * Will attempt to remove a challenge and will return a message based on the success of deleting the challenge
     * Will not delete a challenge if the challenge is the current challenge
     */
    removeChallenge(args){
        try{
            this.database.query("DELETE FROM challenges WHERE name=$1 AND (current IS NULL OR current < TO_TIMESTAMP(CURRENT_DATE || ' 07:30:00', 'YYYY-MM-DD HH:MI:SS'))", args[0]);
            return "I attempted the removal of the challenge successfully.";
        }catch(e){
            console.log(e.message);
            return "I couldn't remove your challenge... The connection to the database may not be working or you may have given incorrect arguments; the correct usage of this command is '@challengebot remove [one word challenge name]'."
        }
    }

    /**
     * Will return a list of all of the possible challenges
     */
    getPossibleChallenges(args){
        try{
            var query = this.database.query("SELECT name FROM challenges");
            var possible = [];
            query.on("row", function(row, result){
                possible.push(row["name"]);
            });
            var done = false;
            query.on("end", function(result){
                done = true;
            });
            while(!done){}
            var formattedPossible = (possible.length == 0)? "empty" : "";
            for(i = 0; i < possible.length; i++){
                formattedPossible += "'" + possible[i] + "'" + (i == possible.length - 1)? "" : (i == possible.length - 2)? ", and " : ", " ;
            }
            return "The possible challenges are " + formattedPossible + ".";
        }catch(e){
            console.log(e.message);
            return "I could not retrieve the possible challenges... The connection to the database may not be working or you may have given incorrect arguments; the correct usage of this command is '@challengebot possible'.";
        }
    }

    /**
     * Will, given a challenge name, return a description of the challenge
     */
    describeChallenge(args){
        try{
            var query = this.database.query("SELECT description FROM challenges WHERE name=$1", args[0]);
            var description = null;
            query.on("row", function(row, result){
                description = row["description"];
            });
            while(row == null){}
            return description;
        }catch(e){
            console.log(e.message);
            return "I can't describe that challenge... The connection to the database may not be working or you may have given incorrect arguments; the correct usage of this command is '@challengebot describe [one word challenge name]'.";
        }
    }

    /**
     * Will return a description of the current challenge
     */
    getCurrentChallenge(args){
        try{
            this.database.query("SELECT name FROM challlenges WHERE current IS NOT NULL AND current < TO_TIMESTAMP(CURRENT_DATE || ' 07:30:00', 'YYYY-MM-DD HH:MI:SS')").on("row", function(row, result){
                this.removeChallenge([row["name"]]);
            });
            var query = this.database.query("SELECT name FROM challenges WHERE current IS NOT NULL AND current > TO_TIMESTAMP(CURRENT_DATE || ' 07:30:00', 'YYYY-MM-DD HH:MI:SS')");
            var current = null;
            var queryComplete = false;
            query.on("row", function(row, result){
                current = row["name"];
                queryComplete = true;
            });
            query.on("end", function(result){
                queryComplete = true;
            });
            while(!queryComplete){}
            if(current == null){
                this.database.query("SELECT name FROM challenges ORDER BY RANDOM() LIMIT 1").on("row", function(row, result){
                    current = row["name"];
                });
                while(current == null){}
            }
            return this.describeChallenge([current]);
        }catch(e){
            console.log(e.message);
            return "I can't get the current challenge... The connection to the database may not be working or you may have given incorrect arguments; the correct usage of this command is '@challengebot current'.";
        }
    }

}

module.exports = ChallengeBot;
