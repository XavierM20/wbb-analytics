/**
 * Season Model
 * Captures the essence of a basketball season, associating it with a specific year. It records the roster of players
 * participating in that season, along with references to all the games and practice sessions that take place. This model
 * serves as a central point for aggregating detailed seasonal activities, facilitating easy access to comprehensive data
 * on player participation, game outcomes, and practice efficiency. The structure supports dynamic updates as the season
 * progresses, with new games and practices being added.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const seasonSchema = new Schema({
    year: { type: String, required: true },
    players: [{ type: Schema.Types.ObjectId, ref: 'Player'}],
    games: [{ type: Schema.Types.ObjectId, ref: 'Game', default: [] }],
    practices: [{ type: Schema.Types.ObjectId, ref: 'Practice', default: [] }],
    schoolID: { type: Schema.Types.ObjectId, ref: 'School', required: true } // Added reference to School
});

module.exports = mongoose.model('Season', seasonSchema);