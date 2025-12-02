const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    tag: { type: String, required: true },
    content: { type: String, required: true },
    image: [
        {
            imageUrl: { type: String, required: true },
            publicId: { type: String, required: true }
        }
    ],
    author: { type: String, required: true },
    datePosted: { type: Date, default: null },
    dateScheduled: { type: Date, default: null },
    status: { type: String, enum: ['draft', 'scheduled', 'published'], default: 'draft' }
}, { 
    collection: 'news',
    timestamps: false // Disabled createdAt and updatedAt
});

newsSchema.index({ status: 1, datePosted: -1 });

module.exports = mongoose.model('News', newsSchema);