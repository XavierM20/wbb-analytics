const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const statsSchema = new Schema({
    gameOrDrill_id: { type: Schema.Types.ObjectId, refPath: 'onModel', required: true },
    onModel: { type: String, required: true, enum: ['Game', 'Drill'] },
    player_id: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    offensive_rebounds: { type: Number, required: true, default: 0 },
    defensive_rebounds: { type: Number, required: true, default: 0 },
    assists: { type: Number, required: true, default: 0 },
    steals: { type: Number, required: true, default: 0 },
    blocks: { type: Number, required: true, default: 0 },
    turnovers: { type: Number, required: true, default: 0 },
});

module.exports = mongoose.model('Stats', statsSchema);
