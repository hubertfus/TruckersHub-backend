const mongoose = require('mongoose');
const User = require('../models/user');
const Order = require('../models/order');

async function updateDriverAvailability(userId) {
  let session = null;

  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.client.s.options.replicaSet) {
      session = await mongoose.startSession();
      session.startTransaction();
    }


    const user = await User.findById(new mongoose.Types.ObjectId(userId)).session(session || undefined);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'driver') {
      throw new Error('User is not a driver');
    }

    const hasOrders = await Order.exists({ assigned_driver: userId }).session(session || undefined);

    user.availability = !hasOrders;
    user.updated_at = new Date();

    await user.save(session ? { session } : undefined);

    if (session) {
      await session.commitTransaction();
      session.endSession();
        }

    return {
      success: true,
      message: `Driver availability updated to ${!hasOrders}`,
      user,
    };
  } catch (error) {
    console.error("Error during transaction:", error.message);

    if (session) {
      await session.abortTransaction();
      session.endSession();
    }

    return {
      success: false,
      message: error.message,
    };
  }
}

module.exports = updateDriverAvailability;
