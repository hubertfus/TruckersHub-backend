const router = require("express").Router();
const mongoose = require("mongoose");
const Order = require("../models/order");
const User = require("../models/user");
const { validateAuthorization } = require("../authMiddleware");

router.get("/", async (req, res) => {
  try {
    const { driverId, role, createdAndWtihNoVehicleAssigned } = req.query;

    let matchConditions = {};

    if (role === "dispatcher") {
      if (createdAndWtihNoVehicleAssigned === "true") {
        matchConditions = { vehicle_id: null };
      } else {
        matchConditions = {};
      }
    } else {
      matchConditions = {
        $or: [
          { assigned_driver: new mongoose.Types.ObjectId(driverId) },
          { assigned_driver: null },
        ],
      };
      if (createdAndWtihNoVehicleAssigned === "true") {
        matchConditions.vehicle_id = null;
      }
    }

    const orders = await Order.aggregate([
      {
        $match: matchConditions,
      },
      {
        $lookup: {
          from: "users",
          localField: "assigned_driver",
          foreignField: "_id",
          as: "driver_details",
        },
      },
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicle_id",
          foreignField: "_id",
          as: "vehicle_details",
        },
      },
      {
        $addFields: {
          driver_info: { $arrayElemAt: ["$driver_details.name", 0] },
          vehicle_info: {
            $cond: {
              if: { $gt: [{ $size: "$vehicle_details" }, 0] },
              then: {
                $concat: [
                  { $arrayElemAt: ["$vehicle_details.brand", 0] },
                  " ",
                  { $arrayElemAt: ["$vehicle_details.model", 0] },
                  " ",
                  { $arrayElemAt: ["$vehicle_details.license_plate", 0] },
                ],
              },
              else: "No Vehicle Assigned",
            },
          },
        },
      },
      {
        $sort: { created_at: -1 },
      },
      {
        $project: {
          driver_details: 0,
          vehicle_details: 0,
        },
      },
    ]);

    res
      .status(200)
      .json({ message: "Orders fetched successfully", data: orders });
  } catch (error) {
    console.error("Error in fetching orders:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/accept",
  async (req, res, next) => {
    await validateAuthorization(req, res, next, "accept");
  },
  async (req, res) => {
    const { userId, orderId } = req.body;
    if (!userId || !orderId) {
      return res.status(400).json({ message: "Missing userId or orderId" });
    }

    try {
      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { assigned_driver: userId, status: "in_progress" },
        { new: true }
      );

      res
        .status(200)
        .json({ message: "Order accepted successfully", data: updatedOrder });
    } catch (error) {
      console.error("Error processing order accept:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post(
  "/cancel",
  async (req, res, next) => {
    await validateAuthorization(req, res, next, "cancel");
  },
  async (req, res) => {
    const { userId, orderId } = req.body;

    if (!userId || !orderId) {
      return res.status(400).json({ message: "Missing userId or orderId" });
    }

    try {
      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { status: "cancelled" },
        { new: true }
      );

      res
        .status(200)
        .json({ message: "Order cancelled successfully", data: updatedOrder });
    } catch (error) {
      console.error("Error canceling order:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.post(
  "/complete",
  async (req, res, next) => {
    await validateAuthorization(req, res, next, "complete");
  },
  async (req, res) => {
    const { userId, orderId } = req.body;

    if (!userId || !orderId) {
      return res
        .status(400)
        .json({ message: "Missing userId, orderId, or role" });
    }

    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { status: "completed" },
        { new: true }
      );

      res
        .status(200)
        .json({ message: "Order completed successfully", data: updatedOrder });
    } catch (error) {
      console.error("Error completing order:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.delete(
  "/:id",
  async (req, res, next) => {
    await validateAuthorization(req, res, next, "delete");
  },
  async (req, res) => {
    const orderId = req.params.id;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    try {
      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      await Order.findByIdAndDelete(orderId);
      res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

router.get("/:id", async (req, res) => {
  try {
    const orderId = req.params.id;

    const orderDetails = await Order.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(orderId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "assigned_driver",
          foreignField: "_id",
          as: "driver_details",
        },
      },
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicle_id",
          foreignField: "_id",
          as: "vehicle_details",
        },
      },
      {
        $addFields: {
          driver_info: { $arrayElemAt: ["$driver_details.name", 0] },
          vehicle_info: {
            $cond: {
              if: { $gt: [{ $size: "$vehicle_details" }, 0] },
              then: {
                $concat: [
                  { $arrayElemAt: ["$vehicle_details.brand", 0] },
                  " ",
                  { $arrayElemAt: ["$vehicle_details.model", 0] },
                  " ",
                  { $arrayElemAt: ["$vehicle_details.license_plate", 0] },
                ],
              },
              else: "No Vehicle Assigned",
            },
          },
        },
      },
      {
        $project: {
          driver_details: 0,
          vehicle_details: 0,
        },
      },
    ]);

    if (!orderDetails || orderDetails.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(orderDetails[0]);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/create",
  async (req, res, next) => {
    await validateAuthorization(req, res, next, "create");
  },
  async (req, res) => {
    const {
      order_number,
      load_details,
      pickup_address,
      delivery_address,
      vehicle_id,
      assigned_driver,
      estimated_delivery_time,
    } = req.body.newOrder;

    const { weight, dimensions } = load_details;
    const { length, width, height } = dimensions;

    if (weight <= 0 || length <= 0 || width <= 0 || height <= 0) {
      return res.status(400).json({
        message: "Negative or zero values are not allowed in load details.",
      });
    }

    if (
      !order_number ||
      !load_details ||
      !pickup_address ||
      !delivery_address
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    let session = null;

    try {
      if (
        mongoose.connection.readyState === 1 &&
        mongoose.connection.client.s.options.replicaSet
      ) {
        session = await mongoose.startSession();
        session.startTransaction();
      }

      const newOrder = new Order({
        order_number,
        load_details,
        pickup_address,
        delivery_address,
        vehicle_id: vehicle_id || null,
        assigned_driver: assigned_driver || null,
        estimated_delivery_time: estimated_delivery_time || null,
        status: "created",
        created_at: new Date(),
        updated_at: new Date(),
      });

      const savedOrder = await newOrder.save(session ? { session } : undefined);

      if (session) await session.commitTransaction();

      res
        .status(201)
        .json({ message: "Order created successfully", data: savedOrder });
    } catch (error) {
      if (session) await session.abortTransaction();
      console.error("Error creating new order:", error);
      res.status(500).json({ message: "Internal server error" });
    } finally {
      if (session) session.endSession();
    }
  }
);

router.post(
  "/assign-driver",
  async (req, res, next) => {
    await validateAuthorization(req, res, next, "assign-driver");
  },
  async (req, res) => {
    const { orderId, driverId, dispatcherId } = req.body;

    if (!orderId || !driverId || !dispatcherId) {
      return res.status(400).json({
        message: "Missing required fields: orderId, driverId, dispatcherId",
      });
    }

    let session = null;

    try {
      if (
        mongoose.connection.readyState === 1 &&
        mongoose.connection.client.s.options.replicaSet
      ) {
        session = await mongoose.startSession();
        session.startTransaction();
      }

      const order = await Order.findById(orderId).session(session);
      if (!order) {
        throw new Error("Order not found");
      }

      const driver = await User.findById(driverId).session(session);
      if (!driver || driver.role !== "driver") {
        throw new Error("Driver not found or invalid role");
      }

      const dispatcher = await User.findById(dispatcherId).session(session);
      if (!dispatcher || dispatcher.role !== "dispatcher") {
        throw new Error("Dispatcher not found or invalid role");
      }
      let oldDriver;
      if (order.assigned_driver) {
        oldDriver = order.assigned_driver;
      }
      order.assigned_driver = driverId;
      order.status = "in_progress";

      const driverInfo = driver.name;

      await order.save({ session });

      await driver.save({ session });
      if (session) await session.commitTransaction();

      res.status(200).json({
        message: "Driver assigned successfully",
        order: {
          ...order.toObject(),
          driver_info: driverInfo,
        },
      });
    } catch (error) {
      if (session) await session.abortTransaction();
      console.error("Error assigning driver:", error);
      res.status(500).json({ message: error.message });
    } finally {
      if (session) session.endSession();
    }
  }
);

router.post(
  "/assign-vehicle",
  async (req, res, next) => {
    await validateAuthorization(req, res, next, "assign-vehicle");
  },
  async (req, res) => {
    const { orderId, vehicleId, dispatcherId } = req.body;

    if (!orderId || !vehicleId || !dispatcherId) {
      return res.status(400).json({
        message: "Missing required fields: orderId, vehicleId, dispatcherId",
      });
    }

    let session = null;

    try {
      if (
        mongoose.connection.readyState === 1 &&
        mongoose.connection.client.s.options.replicaSet
      ) {
        session = await mongoose.startSession();
        session.startTransaction();
      }

      const order = await Order.findById(orderId).session(session);
      if (!order) {
        throw new Error("Order not found");
      }

      const vehicle = await mongoose
        .model("Vehicle")
        .findById(vehicleId)
        .session(session);
      if (!vehicle) {
        throw new Error("Vehicle not found");
      }

      const dispatcher = await User.findById(dispatcherId).session(session);
      if (!dispatcher || dispatcher.role !== "dispatcher") {
        throw new Error("Dispatcher not found or invalid role");
      }

      order.vehicle_id = vehicleId;
      order.updated_at = new Date();

      const vehicleInfo = `${vehicle.brand} ${vehicle.model} ${vehicle.license_plate}`;

      await order.save({ session });

      if (session) await session.commitTransaction();

      res.status(200).json({
        message: "Vehicle assigned successfully",
        order: {
          ...order.toObject(),
          vehicle_info: vehicleInfo,
        },
      });
    } catch (error) {
      if (session) await session.abortTransaction();
      console.error("Error assigning vehicle:", error);
      res.status(500).json({ message: error.message });
    } finally {
      if (session) session.endSession();
    }
  }
);

router.put(
  "/update",
  async (req, res, next) => {
    await validateAuthorization(req, res, next, "update");
  },
  async (req, res) => {
    const { orderId, updatedOrderData, dispatcherId } = req.body;

    if (!orderId || !dispatcherId || !updatedOrderData) {
      return res.status(400).json({
        message:
          "Missing required fields: orderId, dispatcherId, updatedOrderData",
      });
    }

    const { load_details } = updatedOrderData;
    if (load_details) {
      const { weight, dimensions } = load_details;
      const { length, width, height } = dimensions;

      if (weight <= 0 || length <= 0 || width <= 0 || height <= 0) {
        return res.status(400).json({
          message: "Negative or zero values are not allowed in load details.",
        });
      }
    }

    let session = null;

    try {
      if (
        mongoose.connection.readyState === 1 &&
        mongoose.connection.client.s.options.replicaSet
      ) {
        session = await mongoose.startSession();
        session.startTransaction();
      }

      const order = await Order.findById(orderId).session(session);
      if (!order) {
        throw new Error("Order not found");
      }
      const dispatcher = await User.findById(dispatcherId).session(session);
      if (!dispatcher || dispatcher.role !== "dispatcher") {
        throw new Error("Dispatcher not found or invalid role");
      }

      updatedOrderData.assigned_driver =
        order.assigned_driver || updatedOrderData.assigned_driver;
      updatedOrderData.vehicle_id =
        order.vehicle_id || updatedOrderData.vehicle_id;
      updatedOrderData.status = order.status;

      order.set(updatedOrderData);

      await order.save({ session });

      if (session) await session.commitTransaction();

      res.status(200).json({
        message: "Order updated successfully",
        order: order,
      });
    } catch (error) {
      if (session) await session.abortTransaction();
      console.error("Error updating order:", error);
      res.status(500).json({ message: error.message });
    } finally {
      if (session) session.endSession();
    }
  }
);

module.exports = router;
