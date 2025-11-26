const mongoose = require('mongoose');
const feedbackSchema = new mongoose.Schema({
    feedback : { type: String, required: true },
    rating : { type: Number, required: true, },
    dateSubmitted : { type: Date, required: true },
    isRead : { type: Boolean, default: false }
}, {
    collection: 'feedbacks'
});

module.exports = mongoose.model('Feedback', feedbackSchema);