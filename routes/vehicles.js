const router = require('express').Router();
const bcrypt = require('bcrypt');
const Vehicle = require("../models/Vehicle");



router.get("/", async (req, res) => {
    try {
        const { sort = 'created_at', available = false } = req.query;

        const vehiclesAggregation = await Vehicle.aggregate([
            {
                $lookup: {
                    from: "orders", 
                    localField: "_id", 
                    foreignField: "vehicle_id",
                    as: "orders",
                },
            },
            {
                $addFields: {
                    isInUse: { $gt: [{ $size: "$orders" }, 0] }, 
                },
            },
            {
                $match: available === "true" ? { isInUse: false } : {}, 
            },
            {
                $project: {
                    orders: 0,
                },
            },
            {
                $sort: { [sort]: 1 },
            },
        ]);

        res.json([ ...vehiclesAggregation  ]);
    } catch (error) {
        console.error("Error fetching vehicles:", error.message);
        res.status(500).json({ message: "An error occurred while fetching the vehicles." });
    }
});


module.exports = router;

