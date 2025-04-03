/**
 * Game Model
 * Defines the structure for documents representing basketball games within a season. Each game is linked to a season, 
 * includes details like the date, opponent, and location, and tracks specific events such as tempos and shots. This model 
 * allows for detailed recording and analysis of game dynamics, player performances, and team strategies through the 
 * association of tempo and shot event data. It serves as a comprehensive record of each game's circumstances and outcomes.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gameSchema = new Schema({
    season_id: { type: Schema.Types.ObjectId, ref: 'Season', required: true },
    date: { type: Date, required: true },
    opponent: { type: String, required: true },
    location: { type: String, required: true },
    tempo_events: [{ type: Schema.Types.ObjectId, ref: 'Tempo', default: [] }],
    shot_events: [{ type: Schema.Types.ObjectId, ref: 'Shot', default: [] }],
    team_logo: { type: String, ref: 'Image', default: '' },
    score: {
        team: { type: Number, required: true },
        opponent: { type: Number, required: true }
    },
});

module.exports = mongoose.model('Game', gameSchema);
