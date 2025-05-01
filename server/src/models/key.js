/*
Key Model
    The key model will be where you store Register keys for Different Roles
    if a key is registered the key should be deleted and the user should be created
*/ 
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const keySchema = new Schema({
    key: { type: String, required: true },
    role: { type: String, required: true, enum: ['Coach', 'Player']},
    expireAt: {
        type: Date,
        default: Date.now,
        expires: 2592000 // Expires in 30 days (30 days * 24 hours * 60 minutes * 60 seconds)
    }
});

keySchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Key', keySchema);