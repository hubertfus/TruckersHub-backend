const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
    license_plate: {
        type: String,
        required: [true, 'License plate is required.'],
    },
    model: {
        type: String,
        required: [true, 'Vehicle model must be a string.'],
    },
    brand: {
        type: String,
        required: [true, 'Vehicle brand must be a string.'],
    },
    year: {
        type: Number,
        validate: {
            validator: Number.isInteger,
            message: 'Manufacturing year must be an integer.',
        },
    },
    capacity: {
        weight: {
            type: Number,
            required: [true, 'Vehicle weight capacity is required.'],
        },
        volume: {
            length: {
                type: Number,
                required: [true, 'Vehicle volume length is required.'],
            },
            width: {
                type: Number,
                required: [true, 'Vehicle volume width is required.'],
            },
            height: {
                type: Number,
                required: [true, 'Vehicle volume height is required.'],
            },
        },
    },
    current_location: {
        latitude: {
            type: Number,
            required: [true, 'Vehicle latitude is required.'],
        },
        longitude: {
            type: Number,
            required: [true, 'Vehicle longitude is required.'],
        },
    },
    maintenance_schedule: [
        {
            service_type: {
                type: String,
                required: [true, 'Service type is required.'],
            },
            date: {
                type: Date,
                required: [true, 'Service date is required.'],
            },
            description: {
                type: String,
            },
        },
    ],
    created_at: {
        type: Date,
        required: [true, 'Created timestamp is required.'],
        default: Date.now,
    },
    updated_at: {
        type: Date,
        required: [true, 'Updated timestamp is required.'],
        default: Date.now,
    },
});

VehicleSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

const Vehicle = mongoose.model('Vehicle', VehicleSchema);

module.exports = Vehicle;
