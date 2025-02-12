/**
 * Tempo Model
 * Represents a tempo event within a basketball game or practice session. Each tempo event is associated
 * with a specific game, involves multiple players, and is characterized by its type (offensive or defensive),
 * the time it takes for the transition to occur, and the exact timestamp of the event. This model facilitates
 * tracking the speed and efficiency of team transitions during gameplay.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['Admin', 'Moderator', 'User'] },
    school: { type: String, required: true } // Added school field
});

module.exports = mongoose.model('User', userSchema);
