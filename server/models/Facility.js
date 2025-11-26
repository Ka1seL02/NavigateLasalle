const mongoose = require('mongoose');
const facilitySchema = new mongoose.Schema({
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
    collection: 'facilities'
});

module.exports = mongoose.model('Facility', facilitySchema);