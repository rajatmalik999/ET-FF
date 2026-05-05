const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');

// @route   GET /api/portfolio/assets
// @desc    Get current user's portfolio aggregated from completed orders (protected)
router.get('/assets', auth, async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user.id,
            status: 'completed',
        }).lean();

        // Aggregate holdings by fund
        const holdingsMap = new Map();

        for (const order of orders) {
            const key = order.fundId;
            const existing = holdingsMap.get(key) || {
                fundId: order.fundId,
                name: order.fundName,
                symbol: order.fundSymbol,
                totalUnits: 0,
                totalInvested: 0,
            };

            existing.totalUnits += Number(order.units) || 0;
            existing.totalInvested += Number(order.amount) || 0;

            holdingsMap.set(key, existing);
        }

        const assets = Array.from(holdingsMap.values()).map((h) => {
            const avgNav =
                h.totalUnits > 0 ? h.totalInvested / h.totalUnits : 0;

            return {
                fundId: h.fundId,
                name: h.name,
                symbol: h.symbol,
                units: h.totalUnits,
                investedAmount: h.totalInvested,
                averageNav: avgNav,
            };
        });

        return res.json(assets);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server error');
    }
});

module.exports = router;
