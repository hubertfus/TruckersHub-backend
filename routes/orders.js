const router = require('express').Router();
const mongoose = require('mongoose');
const Order = require('../models/order');

router.get('/', async (req, res) => {
  try {
      const { driverId } = req.query;

      const orders = await Order.aggregate([
          {
              $match: {
                  $or: [
                      { assigned_driver: new mongoose.Types.ObjectId(driverId) },
                      { assigned_driver: null } 
                  ]
              }
          },
          {
              $addFields: {
                  statusOrder: {
                      $switch: {
                          branches: [
                              { case: { $eq: ["$status", "in_progress"] }, then: 1 },
                              { case: { $eq: ["$status", "created"] }, then: 2 },
                              { case: { $eq: ["$status", "completed"] }, then: 3 },
                              { case: { $eq: ["$status", "cancelled"] }, then: 4 }
                          ],
                          default: 5 
                      }
                  }
              }
          },
          {
              $sort: { statusOrder: 1, created_at: -1 } 
          },
          {
              $project: {
                  statusOrder: 0 
              }
          }
      ]);

      res.status(200).json(orders); 
  } catch (error) {
      console.error('Error in fetching orders:', error); 
      res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
