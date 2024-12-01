const router = require('express').Router();
const mongoose = require('mongoose');
const Order = require('../models/order');
const User = require('../models/user');

const isAuthorized = async (order, action, userId) => {
    try {
        const user = await User.findById(userId).exec();
        if (!user) {
            console.log("User not found.");
            return false;
        }

        const userRole = user.role;

        if (action === 'accept') {
            return userRole === 'driver';
        }

        if (action === 'cancel') {
            return userRole === 'driver' && order.assigned_driver && order.assigned_driver.toString() === userId;
        }

        if (action === 'assign' || action === 'complete') {
            return userRole === 'dispatcher';
        }

        if (action === 'delete') {
            return userRole === 'dispatcher'; // Only dispatchers can delete orders
        }

        return false;
    } catch (error) {
        console.error("Error checking authorization:", error);
        return false;
    }
};

// GET orders
router.get('/', async (req, res) => {
    try {
        const { driverId, role } = req.query;

        const matchConditions = role === 'dispatcher'
            ? {} 
            : {
                $or: [
                    { assigned_driver: new mongoose.Types.ObjectId(driverId) },
                    { assigned_driver: null }
                ]
            };

        const orders = await Order.aggregate([
            {
                $match: matchConditions
            },
            {
                $lookup: {
                    from: "users", 
                    localField: "assigned_driver",
                    foreignField: "_id",
                    as: "driver_details"
                }
            },
            {
                $lookup: {
                    from: "vehicles", 
                    localField: "vehicle_id",
                    foreignField: "_id",
                    as: "vehicle_details"
                }
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
                                    { $arrayElemAt: ["$vehicle_details.license_plate", 0] } 
                                ]
                            },
                            else: "No Vehicle Assigned"
                        }
                    }
                }
            },
            {
                $sort: { created_at: -1 }
            },
            {
                $project: {
                    driver_details: 0,
                    vehicle_details: 0,
                }
            }
        ]);

        res.status(200).json(orders); 
    } catch (error) {
        console.error('Error in fetching orders:', error); 
        res.status(500).json({ error: error.message });
    }
});

// POST accept order
router.post('/accept', async (req, res) => {
    const { userId, orderId } = req.body;
    if (!userId || !orderId ) {
        return res.status(400).json({ message: "Missing userId or orderId" });
    }
    
    try {
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        if (!isAuthorized(order, 'accept', userId)) {
            return res.status(403).json({ message: "Unauthorized action" });
        }
        
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { assigned_driver: userId, status: 'in_progress' },
            { new: true }
        );
        
        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error("Error processing order accept:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// POST cancel order
router.post('/cancel', async (req, res) => {
    const { userId, orderId} = req.body;

    if (!userId || !orderId ) {
        return res.status(400).json({ message: "Missing userId or orderId" });
    }

    try {
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (!isAuthorized(order, 'cancel', userId)) {
            return res.status(403).json({ message: "Unauthorized action" });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status: 'cancelled' },
            { new: true } 
        );

        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error("Error canceling order:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// POST complete order
router.post('/complete', async (req, res) => {
    const { userId, orderId} = req.body;

    if (!userId || !orderId) {
        return res.status(400).json({ message: "Missing userId, orderId, or role" });
    }

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (!isAuthorized(order, 'complete', userId)) {
            return res.status(403).json({ message: "Unauthorized action" });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status: 'completed' },
            { new: true } 
        );

        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error("Error completing order:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.delete('/:id', async (req, res) => {
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

        if (!isAuthorized(order, 'delete', userId)) {
            return res.status(403).json({ message: "Unauthorized action" });
        }

        await Order.findByIdAndDelete(orderId);

        res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
        console.error("Error deleting order:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const orderId = req.params.id;

        const orderDetails = await Order.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(orderId) }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "assigned_driver",
                    foreignField: "_id",
                    as: "driver_details"
                }
            },
            {
                $lookup: {
                    from: "vehicles",
                    localField: "vehicle_id",
                    foreignField: "_id",
                    as: "vehicle_details"
                }
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
                                    { $arrayElemAt: ["$vehicle_details.license_plate", 0] }
                                ]
                            },
                            else: "No Vehicle Assigned"
                        }
                    }
                }
            },
            {
                $project: {
                    driver_details: 0,
                    vehicle_details: 0,
                }
            }
        ]);

        if (!orderDetails || orderDetails.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(orderDetails[0]); 
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
