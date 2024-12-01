const mongoose = require('mongoose');

const DriversViewSchema = new mongoose.Schema({}, { strict: false }); 
const DriversView = mongoose.model('DriversView', DriversViewSchema, 'driversView'); 

module.exports = DriversView;
