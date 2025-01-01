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

        res.status(200).json({
            message: "Vehicles fetched successfully",
            vehicles: vehiclesAggregation
        });    
    } catch (error) {
        console.error("Error fetching vehicles:", error.message);
        res.status(500).json({ message: "An error occurred while fetching the vehicles." });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Vehicle ID is required." });
        }

       
        const objectId = new mongoose.Types.ObjectId(id);

        const vehicle = await Vehicle.aggregate([
            {
                $match: { _id: objectId },
            },
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
                $project: {
                    orders: 0, 
                },
            },
        ]);

        if (vehicle.length === 0) {
            return res.status(404).json({ message: "Vehicle not found." });
        }

        res.status(200).json({
            message: "Vehicle fetched successfully.",
            vehicle: vehicle[0],
        });
    } catch (error) {
        console.error("Error fetching vehicle by ID:", error.message);
        res.status(500).json({ message: "An error occurred while fetching the vehicle." });
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

router.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid vehicle ID." });
        }

        const vehicle = await Vehicle.findById(id);
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found." });
        }


        await Vehicle.findByIdAndDelete(id);

        res.status(200).json({ message: "Vehicle deleted successfully." });
    } catch (error) {
        console.error("Error deleting vehicle:", error.message);
        res.status(500).json({ message: "An error occurred while deleting the vehicle." });
    }
});

module.exports = router;
