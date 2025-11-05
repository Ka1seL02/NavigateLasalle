const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const accountSchema = new mongoose.Schema({
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  collection: 'accounts'
});

accountSchema.plugin(AutoIncrement, { inc_field: 'si' });

module.exports = mongoose.model('Account', accountSchema);