const mongoose = require('mongoose');
const Order = require('./models/Order');
const setDriverAvailability = require("./setDriverAvailability")


async function acceptOrder(orderId, driverId) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'created') {
      throw new Error('Only orders with status "created" can be accepted');
    }

    order.status = 'in_progress';
    order.assigned_driver =  new mongoose.Types.ObjectId(driverId);
    order.updated_at = new Date();

    await order.save({ session });
    setDriverAvailability(driverId,false)
    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message: 'Order accepted successfully',
      order,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return {
      success: false,
      message: error.message,
    };
  }
}

module.exports = acceptOrder;
