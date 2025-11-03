const mongoose = require('mongoose');
const faqSchema = new mongoose.Schema({
    question : {
        type: String,
        required: true,
        unique: true
    }, 
    answer : {
        type: String,
        required: true
    }
}, {
    collection: 'faqs'
});

module.exports = mongoose.model('FAQ', faqSchema);