const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');

// @route   POST /api/orders
// @desc    Create a new order (complete payment)
router.post('/', auth, async (req, res) => {
    try {
        const { fundId, fundName, fundSymbol, nav, units, amount } = req.body;

        if (!fundId || !fundName || !fundSymbol || nav == null || !units || amount == null) {
            return res.status(400).json({ message: 'Missing required fields: fundId, fundName, fundSymbol, nav, units, amount' });
        }

        const numUnits = parseFloat(units);
        const numAmount = parseFloat(amount);
        const numNav = parseFloat(nav);

        if (isNaN(numUnits) || numUnits <= 0 || isNaN(numAmount) || numAmount <= 0) {
            return res.status(400).json({ message: 'Invalid units or amount' });
        }

        const order = new Order({
            user: req.user.id,
            fundId,
            fundName,
            fundSymbol,
            units: numUnits,
            navAtPurchase: numNav,
            amount: numAmount,
            status: 'completed',
        });

        await order.save();

        return res.status(201).json({
            message: 'Order placed successfully',
            order: {
                id: order._id,
                fundName: order.fundName,
                fundSymbol: order.fundSymbol,
                units: order.units,
                amount: order.amount,
                status: order.status,
            },
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/orders
// @desc    Get current user's orders
router.get('/', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .lean();

        return res.json(orders);
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
