const mongoose = require('mongoose');
const faqSchema = new mongoose.Schema({
    question : { type: String, required: true, unique: true }, 
    answer : { type: String, required: true },
    category : {
        type: String,
        required: true,
        enum: ['General', 'News', 'Interactive Map', 'Virtual Tour', 'Feedback']
    }
}, {
    collection: 'faqs'
});

module.exports = mongoose.model('FAQ', faqSchema);