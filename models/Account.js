const mongoose = require('mongoose');
const accountSchema = new mongoose.Schema({
  si: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'deactivated'],
    default: 'active'
  }
}, {
  collection: 'accounts'
});

module.exports = mongoose.model('Account', accountSchema);