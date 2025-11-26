const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    tag: { type: [String], required: true },
    content: { type: String, required: true },
    image: {
        type: [String],
        required: true,
        validate: [
            arr => arr.length > 0 || "At least one image is required.",
            arr => arr.length === new Set(arr).size || "Images must be unique."
        ]
    },
    author: { type: String , required: true },
    datePosted: { type: Date, default: null },
    dateScheduled: { type: Date, default: null },
    status: { type: String, enum: ['draft', 'scheduled', 'posted'], default: 'draft' }
}, { collection: 'news', timestamps: true });

// Auto-set datePosted when status is 'posted'
newsSchema.pre('save', function(next) {
    if (this.status === 'posted' && !this.datePosted) this.datePosted = new Date();
    next();
});

newsSchema.index({ status: 1, datePosted: -1 });

module.exports = mongoose.model('News', newsSchema);