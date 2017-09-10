const mongoose = require("mongoose");

/**
 * Below is the structure that all challenges must follow
 * Challenges must have names, descriptions, lastUsed, and current
 */
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

//Below checks that only one Challenge can be current(true)
ChallengeSchema.index({current: 1}, {unique: true, partialFilterExpression: {current: true}});

//First param is the name of the entry, second param is the schema to follow when creating an entry
module.exports = mongoose.model('Challenge', ChallengeSchema);
