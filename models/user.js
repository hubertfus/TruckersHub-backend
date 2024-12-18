const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Order = require('./order'); 

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['driver', 'dispatcher'],
        required: true
    },
    phone: {
        type: String,
        match: /^[0-9]{9}$/,
        required: true
    },
    license_number: {
        type: String,
        default: null
    },
    availability: {
        type: Boolean,
        default: function () {
            return this.role === "driver" ? true : undefined;
        }
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    }
    next();
});

userSchema.methods.isPasswordValid = async function (password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
