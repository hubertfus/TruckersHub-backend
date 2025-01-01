const User = require("./models/user");
const Order = require("./models/order");

const isAuthorized = async (order, action, userId) => {
  try {
    const user = await User.findById(userId).exec();
    if (!user) {
      console.log("User not found.");
      return false;
    }

    const userRole = user.role;

    switch (action) {
      case "accept":
        return userRole === "driver";

      case "cancel":
        return (
          userRole === "driver" &&
          order.assigned_driver &&
          order.assigned_driver.toString() === userId
        );

      case "assign":
      case "complete":
      case "delete":
      case "create":
      case "assign-driver":
      case "assign-vehicle":
      case "update":
      case "view-all":
        return userRole === "dispatcher";

      case "view-own":
        return userRole === "driver";

      default:
        console.log(`Unknown action: ${action}`);
        return false;
    }
  } catch (error) {
    console.error("Error checking authorization:", error);
    return false;
  }
};

const validateAuthorization = async (req, res, next, action) => {
  const { userId } = req.body;
  const orderId = req.params.id || req.body.orderId;

  if (!userId) {
    return res.status(400).json({ message: "Missing userId" });
  }

  try {
    const order = orderId ? await Order.findById(orderId) : null;
    const isAllowed = await isAuthorized(order, action, userId);

    if (!isAllowed) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    req.order = order;
    next();
  } catch (error) {
    console.error("Authorization error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  validateAuthorization,
};
