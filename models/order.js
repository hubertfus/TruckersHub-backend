// models/Order.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const loadDetailsSchema = new Schema({
  type: {
    type: String,
    required: true,
  },
  weight: {
    type: Schema.Types.Mixed, 
    required: true,
  },
  dimensions: {
    length: {
      type: Schema.Types.Mixed, 
      required: true,
    },
    width: {
      type: Schema.Types.Mixed, 
      required: true,
    },
    height: {
      type: Schema.Types.Mixed, 
      required: true,
    },
  },
});

const addressSchema = new Schema({
  street: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  zip_code: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
});

const orderSchema = new Schema({
  order_number: {
    type: String,
    required: true,
  },
  load_details: {
    type: loadDetailsSchema,
    required: true,
  },
  pickup_address: {
    type: addressSchema,
    required: true,
  },
  delivery_address: {
    type: addressSchema,
    required: true,
  },
  status: {
    type: String,
    enum: ['created', 'in_progress', 'completed', 'cancelled'],
    required: true,
  },
  assigned_driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null,
  },
  vehicle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null,
  },
  estimated_delivery_time: {
    type: Date,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
