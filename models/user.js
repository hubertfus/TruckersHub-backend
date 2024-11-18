const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, "User's name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "User's email is required"],
    unique: true,
    match: [/^.+@.+$/, "Invalid email format"]
  },
  role: {
    type: String,
    required: [true, "User's role is required"],
    enum: ['driver', 'dispatcher']
  },
  phone: {
    type: String,
    match: [/^[0-9]{9}$/, "Phone number must be 9 digits"],
    required: function() {
      return this.role === 'driver'; 
    }
  },
  license_number: {
    type: String,
    default: null,
    required: function() {
      return this.role === 'driver'; 
    }
  },
  availability: {
    type: Boolean,
    default: null
  },
  created_at: {
    type: Date,
    required: [true, "Creation date is required"],
    default: Date.now
  },
  updated_at: {
    type: Date,
    required: [true, "Update date is required"],
    default: Date.now
  }
});

userSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);
