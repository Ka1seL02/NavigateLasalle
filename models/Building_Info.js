const mongoose = require('mongoose');
const buildingSchema = new mongoose.Schema({
    id : {
        type: String,
        required: true,
        unique: true
    },
    name : {
        type: String,
        required: true,
        unique: true
    },
    image : {
        type: String,
        required: true,
        unique: true
    },
    description : {
        type: String,
        required: true,
        unique: true
    },
    status : {
        type: String,
        required: true,
        unique: true
    }
}, {
    collection: 'building-infos'
});

module.exports = mongoose.model('Building-Info', buildingSchema);