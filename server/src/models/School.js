const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
    name: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true }
});

module.exports = mongoose.model('School', SchoolSchema);
