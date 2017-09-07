const mongoose = require("mongoose");

const ChallengeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    lastUsed: {
        type: Date,
        required: true,
        default: Date.now
    },
    current: {
        type: Boolean,
        required: true,
        default: false,
    }
});

ChallengeSchema.index({current: 1}, {unique: true, partialFilterExpression: {current: true}}); // checks that only one Challenge can be current(true)

// Parameter one is the name of the entry, second is the Schema to follow when creating an entry
const Challenge = mongoose.model('Challenge', ChallengeSchema);
module.exports = Challenge;