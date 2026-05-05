const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'admin_dev_secret';

const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
        return res.status(401).json({ message: 'Admin token missing' });
    }

    try {
        const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired admin token' });
    }
};

let fundsData = [
    {
        id: 'bitcoin',
        name: 'Bitcoin Fund',
        symbol: 'BTC-F',
        nav: 42.85,
        navDate: '2025-03-09',
        change1D: '+2.34%',
        holdings: [
            { name: 'Bitcoin (BTC)', allocation: '72%' },
            { name: 'Wrapped Bitcoin (WBTC)', allocation: '18%' },
            { name: 'Bitcoin Miners ETF', allocation: '10%' },
        ],
        description: 'Direct exposure to Bitcoin and related assets.',
    },
    {
        id: 'ethereum',
        name: 'Ethereum Fund',
        symbol: 'ETH-F',
        nav: 28.12,
        navDate: '2025-03-09',
        change1D: '+1.89%',
        holdings: [
            { name: 'Ethereum (ETH)', allocation: '65%' },
            { name: 'Lido Staked ETH', allocation: '22%' },
            { name: 'Layer 2 Tokens', allocation: '13%' },
        ],
        description: 'Ethereum and staking / L2 exposure.',
    },
    {
        id: 'meme',
        name: 'Meme Coin Fund',
        symbol: 'MEME-F',
        nav: 12.44,
        navDate: '2025-03-09',
        change1D: '-0.52%',
        holdings: [
            { name: 'Dogecoin (DOGE)', allocation: '40%' },
            { name: 'Shiba Inu (SHIB)', allocation: '35%' },
            { name: 'Pepe (PEPE)', allocation: '25%' },
        ],
        description: 'Diversified meme coin basket.',
    },
];

// @route   GET /api/funds
// @desc    Get available mutual funds
router.get('/', (req, res) => {
    res.json(fundsData);
});

// @route   POST /api/funds
// @desc    Create a fund
router.post('/', verifyAdmin, (req, res) => {
    const { name, symbol, nav, navDate, change1D, description, holdings } = req.body;

    if (!name || !symbol || nav === undefined) {
        return res.status(400).json({ message: 'name, symbol and nav are required' });
    }

    const newFund = {
        id: `${symbol.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        name,
        symbol,
        nav: Number(nav),
        navDate: navDate || new Date().toISOString().slice(0, 10),
        change1D: change1D || '0.00%',
        description: description || '',
        holdings: Array.isArray(holdings) ? holdings : [],
    };

    fundsData.push(newFund);
    return res.status(201).json(newFund);
});

// @route   PATCH /api/funds/:id
// @desc    Update a fund
router.patch('/:id', verifyAdmin, (req, res) => {
    const fund = fundsData.find((item) => item.id === req.params.id);
    if (!fund) {
        return res.status(404).json({ message: 'Fund not found' });
    }

    const allowed = ['name', 'symbol', 'nav', 'navDate', 'change1D', 'description', 'holdings'];
    allowed.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
            if (field === 'nav') {
                fund[field] = Number(req.body[field]);
            } else {
                fund[field] = req.body[field];
            }
        }
    });

    return res.json(fund);
});

// @route   PATCH /api/funds/:id/nav
// @desc    Update fund NAV quickly
router.patch('/:id/nav', verifyAdmin, (req, res) => {
    const { nav, navDate, change1D } = req.body;
    const fund = fundsData.find((item) => item.id === req.params.id);

    if (!fund) {
        return res.status(404).json({ message: 'Fund not found' });
    }
    if (nav === undefined) {
        return res.status(400).json({ message: 'nav is required' });
    }

    fund.nav = Number(nav);
    fund.navDate = navDate || new Date().toISOString().slice(0, 10);
    if (change1D !== undefined) fund.change1D = change1D;

    return res.json(fund);
});

// @route   DELETE /api/funds/:id
// @desc    Delete fund
router.delete('/:id', verifyAdmin, (req, res) => {
    const nextFunds = fundsData.filter((item) => item.id !== req.params.id);
    if (nextFunds.length === fundsData.length) {
        return res.status(404).json({ message: 'Fund not found' });
    }
    fundsData = nextFunds;
    return res.status(204).send();
});

module.exports = router;
