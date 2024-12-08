const router = require('express').Router();
const mongoose = require('mongoose');
const Vehicle = require("../models/Vehicle");
const Order = require("../models/order")

router.get("/", async (req, res) => {
    try {
        const { sort = 'created_at', available = false, vehicleId } = req.query;

        const sortOption = { [sort]: 1 };
        const orConditions = [];

        if (available) orConditions.push({ isInUse: false });
        if (vehicleId) orConditions.push({ _id: new mongoose.Types.ObjectId(vehicleId) });

        const matchCondition = orConditions.length > 0 
            ? { $or: orConditions }
            : {}; 

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
                $match: matchCondition, 
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

        res.json([...vehiclesAggregation]);
    } catch (error) {
        console.error("Error fetching vehicles:", error.message);
        res.status(500).json({ message: "An error occurred while fetching the vehicles." });
    }
});

router.post("/add-vehicle", async (req, res) => {
    try {
        const {
            license_plate,
            model,
            brand,
            year,
            capacity,
            current_location,
            maintenance_schedule
        } = req.body;

        if (!license_plate || !model || !brand || !capacity || !current_location) {
            return res.status(400).json({ message: "Required fields are missing." });
        }

        const newVehicle = new Vehicle({
            license_plate,
            model,
            brand,
            year,
            capacity,
            current_location,
            maintenance_schedule,
        });

        const savedVehicle = await newVehicle.save();

        res.status(201).json({
            message: "Vehicle created successfully",
            vehicle: savedVehicle,
        });
    } catch (error) {
        console.error("Error adding a new vehicle:", error.message);
        res.status(500).json({ message: "An error occurred while creating the vehicle." });
    }
});

router.put("/edit/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const {
            license_plate,
            model,
            brand,
            year,
            capacity,
            current_location,
            maintenance_schedule,
        } = req.body;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid vehicle ID." });
        }

        const vehicle = await Vehicle.findById(id);
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found." });
        }

        vehicle.license_plate = license_plate || vehicle.license_plate;
        vehicle.model = model || vehicle.model;
        vehicle.brand = brand || vehicle.brand;
        vehicle.year = year || vehicle.year;
        vehicle.capacity = capacity || vehicle.capacity;
        vehicle.current_location = current_location || vehicle.current_location;
        vehicle.maintenance_schedule = maintenance_schedule || vehicle.maintenance_schedule;

        const updatedVehicle = await vehicle.save();
        res.status(200).json({
            message: "Vehicle updated successfully",
            vehicle: updatedVehicle,
        });
    } catch (error) {
        console.error("Error updating vehicle:", error.message);
        res.status(500).json({ message: "An error occurred while updating the vehicle." });
    }
});



module.exports = router;
