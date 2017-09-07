'use strict';

const Challenge = require('./model/challenge');

class ChallengeBot{

    /**
     * A constructor for a ChallengeBot
     * Takes in a token and then initializes class properties as well as
     * Sets bot handlers for events
     */
    constructor(token){
        console.log("Starting challengebot...");

        //Initializes challengebot instancedata
        this.commands = {};
        this.id = "";

        //Gets all of the needed slack npm libraries
        var RtmClient = require('@slack/client').RtmClient;
        var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
        var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

        //Sets the handler for what the bot should do once it initializes
        this.rtm = new RtmClient(token);
        this.rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, rtmStartData => {
            this.id = "<@" + rtmStartData.self.id + ">";
            console.log(rtmStartData.self.name + " is ready to rumble as " + this.id + " on the team " + rtmStartData.team.name);
        });
        this.rtm.start();

        //Sets the handler for what the bot should do whenever it sees a message
        this.rtm.on(RTM_EVENTS.MESSAGE, message => {
            console.log(message.channel + ">:" + message.text);
            this.interpretText(message);
        });

        //Initializes all of the challengebot's possible commands and assigns them functions
        this.commands["add"] = this.addChallenge;
        this.commands["remove"] = this.removeChallenge;
        this.commands["describe"] = this.describeChallenge;
        this.commands["possible"] = this.getPossibleChallenges;
        this.commands["current"] = this.getCurrentChallenge;

        //Will continuously delete old challenges
        setInterval(function(){
            const currentDate = new Date.now();
            currentDate.setHours(7, 30, 0, 0);

            Challenge.find({
                current: true,
                lastUsed: {
                    $lt: currentDate // lastUsed < currentDate
                }
            }).remove().exec();

        }, 150000);
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
            for(var i = 0; i < Object.keys(this.commands).length; i++){
                stringToOutput += "'" + Object.keys(this.commands)[i] + "'" + (i == Object.keys(this.commands).length - 1)? "" : (i == Object.keys(this.commands).length - 2)? ", and " : ", " ;
            }
        }
        this.sendMessage(stringToOutput, message.channel);
    }

    /**
     * Adds a challenge to the list of possible challenges and returns the success of adding the challenge
     */
    addChallenge(args){

        const challengeData = {
            name: args[0],
            description: [args[0], args.slice(1, args.length).join(" ")]
        };

        Challenge.create(challengeData, (error, challenge) => {
            if (error) return `I encountered a problem creating the challenge!\nError: ${error}`;

            return 'I have successfully created the challenge!';
        });
    }

    /**
     * Will attempt to remove a challenge and will return a message based on the success of deleting the challenge
     * Will not delete a challenge if the challenge is the current challenge
     */
    removeChallenge(args){
        Challenge.findOne({
            current: false,
            name: args[0]
        }).remove(error => {
            if (error) return 'Error deleting Challenge!';

            return 'I have delete that old Challenge!';
        });
    }

    /**
     * Will return a list of all of the possible challenges
     */
    getPossibleChallenges(args){

        Challenge.find({}, (error, challenges) => {
            if (error) return  `I am having trouble getting the possible challenges!\nError: ${error}`;

            if (challenges.length === 0) return 'There are no Challenges!';

            let formattedPossible = `The possible challenges are `;

            for(let i = 0; i < challenges.length; i++) {
                const challenge = challenges[i];
                let challengeText = `'${challenge.name}'`;

                if (i === challenges.length - 1){
                    challengeText += `.`;
                } else if (i === challenges.length - 2) {
                    challengeText += `, and `;
                } else {
                    challengeText += `, `;
                }
                formattedPossible += challengeText;
            }
            return formattedPossible;
        });
    }

    /**
     * Will, given a challenge name, return a description of the challenge
     */
    describeChallenge(args){
        Challenge.findOne({name: args[0]}, (error, challenge) => {
            if (error) return `I am having troubles finding the challenge!\nError: ${error}`;

            if (challenge === null) return 'I could not find that challenge!';

            return challenge.description;
        });
    }

    /**
     * Will return a description of the current challenge
     * Either gets the already selected current challenge of the day, or if there isn't any
     * Will choose a new challenge randomly
     */
    getCurrentChallenge(args){

        Challenge.findOne({current: true}, (error, challenge) => {
            if (error) return `I am having troubles finding the current challenge!\nError: ${error}`;

            if (challenge === null) {
                Challenge.count().exec((countError, count) => {
                    if (countError) return `I am having troubles counting all the challenges!\nError: ${error}`;

                    // Get a random entry
                    const random = Math.floor(Math.random() * count);

                    // Again query all users but only fetch one offset by our random #
                    Challenge.findOne().skip(random).exec((error, newChallenge) => {
                        if (error) return `I had a problem random choosing a new Challenge\nError: ${error}`;

                        return newChallenge.description;
                    });
                });
            } else {
                return challenge.description;
            }
        });
    }

}

module.exports = ChallengeBot;
