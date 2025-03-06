/*
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['Coach', 'Player'] },
    schoolId: { type: String, required: true } // Added school field
});

module.exports = mongoose.model('User', userSchema);
