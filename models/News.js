const mongoose = require('mongoose');
const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    image: {
        type: [String],
        required: true,
        validate: [
            {
                validator: function (arr) {
                    return arr.length > 0;
                },
                message: "At least one image is required."
            },
            {
                validator: function (arr) {
                    return arr.length === new Set(arr).size;
                },
                message: "Images must be unique."
            }
        ]
    },
    author: {
        type: String,
        required: true
    },
    datePosted: {
        type: Date,
        default: null
    },
    dateScheduled: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'posted']
    }
}, {
    collection: 'news'
});

module.exports = mongoose.model('News', newsSchema);