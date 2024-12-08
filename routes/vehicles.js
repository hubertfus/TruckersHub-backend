const router = require('express').Router();
const mongoose = require('mongoose');
const Vehicle = require("../models/Vehicle");

router.get("/", async (req, res) => {
    try {
        const { sort = 'created_at', available = false, vehicleId } = req.query;

        const sortOption = { [sort]: 1 };
        const orConditions = [{isInUse: false}];
        
        if(vehicleId) orConditions.push({_id: new mongoose.Types.ObjectId(vehicleId)})
        console.log(orConditions)
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
                $match:{
                    $or:orConditions
                } 
            },
            {
                $project: {
                    orders: 0,  
                },
            },
            {
                $sort: sortOption,
            },
        ]);

        res.json([ ...vehiclesAggregation ]);
    } catch (error) {
        console.error("Error fetching vehicles:", error.message);
        res.status(500).json({ message: "An error occurred while fetching the vehicles." });
    }
});

module.exports = router;
