const mongoose = require('mongoose');
const User = require('./models/User');

async function setDriverAvailability(userId, availability) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findById( new mongoose.Types.ObjectId(userId)).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    user.availability = availability;
    user.updated_at = new Date();

    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message: `User availability updated to ${availability}`,
      user,
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

module.exports = setDriverAvailability;
