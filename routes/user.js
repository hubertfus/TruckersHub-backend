const router = require('express').Router();
const bcrypt = require('bcrypt');
const User = require("../models/user");
const DriversView = require('../models/Driversview');
const mongoose = require('mongoose');

router.get("/", async (req, res) => {
    try {
        const { sort = 'name', available, userId } = req.query;
        const sortOption = { [sort]: 1 };

        const pipeline = [];

        if (userId) {
            pipeline.push({
                $match: {
                    _id: new mongoose.Types.ObjectId(userId),
                },
            });
        }

        pipeline.push(
            {
                $lookup: {
                    from: "orders", 
                    localField: "_id", 
                    foreignField: "assigned_driver", 
                    as: "assigned_orders",
                },
            },
            {
                $addFields: {
                    availability: {
                        $eq: [
                            {
                                $size: {
                                    $filter: {
                                        input: "$assigned_orders",
                                        as: "order",
                                        cond: { $eq: ["$$order.status", "in_progress"] },
                                    },
                                },
                            },
                            0, 
                        ],
                    },
                },
            }
        );

        if (available !== undefined) {
            pipeline.push({
                $match: {
                    availability: available === 'true',
                },
            });
        }

        pipeline.push({
            $sort: sortOption,
        });

        const drivers = await DriversView.aggregate(pipeline);

        res.json({
            message: "Drivers fetched successfully",
            drivers: drivers,
        });    } catch (error) {
        console.error("Error fetching drivers:", error.message);
        res.status(500).json({ message: "An error occurred while fetching the drivers." });
    }
});


router.get("/:id", async (req, res) => {
    try {
        const userId = req.params.id;

        const pipeline = [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "orders", 
                    localField: "_id",
                    foreignField: "assigned_driver",
                    as: "user_orders",
                },
            },
            {
                $addFields: {
                    current_order: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: "$user_orders",
                                    as: "order",
                                    cond: { $eq: ["$$order.status", "in_progress"] },
                                },
                            },
                            0,
                        ],
                    },
                },
            },
            {
                $lookup: {
                    from: "vehicles", 
                    localField: "current_order.vehicle_id",
                    foreignField: "_id",
                    as: "current_vehicle",
                },
            },
            {
                $addFields: {
                    current_vehicle: { $arrayElemAt: ["$current_vehicle", 0] },
                    completed_or_cancelled_orders: {
                        $filter: {
                            input: "$user_orders",
                            as: "order",
                            cond: {
                                $or: [
                                    { $eq: ["$$order.status", "completed"] },
                                    { $eq: ["$$order.status", "cancelled"] },
                                ],
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    password: 0, 
                    user_orders: 0, 
                },
            },
        ];

        const userDetails = await User.aggregate(pipeline);

        if (!userDetails || userDetails.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "User details fetched successfully",
            user: userDetails[0],
        });
    } catch (error) {
        console.error("Error fetching user details:", error.message);
        res.status(500).json({ message: "An error occurred while fetching user details." });
    }
});

router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role, phone, license_number } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "Name, email, password, and role are required." });
        }
        
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "Email is already in use." });
        }
        const newUser = new User({ name, email, password, role, phone, license_number });
        await newUser.save(newUser);

        res.status(201).json({ message: "User registered successfully.", userId: newUser._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log(error.message)
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        res.status(200).json({ 
            message: "Login successful.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put("/edit/:id", async (req, res) => {
    try {
        const { name, email, phone, license_number } = req.body;

        if (!name || !email || !phone || !license_number) {
            return res.status(400).json({ message: "Name, email, phone, and license number are required." });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail && existingEmail._id.toString() !== req.params.id) {
            return res.status(400).json({ message: "Email is already in use by another user." });
        }

        user.name = name;
        user.email = email;
        user.phone = phone;
        user.license_number = license_number;

        await user.save();

        res.status(200).json({
            message: "User updated successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                license_number: user.license_number,
            }
        });
    } catch (error) {
        console.error("Error updating user:", error.message);
        res.status(500).json({ message: "An error occurred while updating the user." });
    }
});

router.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        await User.findByIdAndDelete(id);

        res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
        console.error("Error deleting user:", error.message);
        res.status(500).json({ message: "An error occurred while deleting the user." });
    }
});

module.exports = router;
