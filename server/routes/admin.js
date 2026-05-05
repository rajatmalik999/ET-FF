const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const ADMIN_EMAIL = process.env.ADMIN_DEMO_EMAIL || 'admin@demo.com';
const ADMIN_PASSWORD = process.env.ADMIN_DEMO_PASSWORD || 'Admin@123';
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
        req.admin = decoded;
        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired admin token' });
    }
};

// @route   POST /api/admin/login
// @desc    Login using demo admin credentials
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
        {
            role: 'admin',
            email: ADMIN_EMAIL,
        },
        ADMIN_JWT_SECRET,
        { expiresIn: '12h' }
    );

    return res.json({ token });
});

// @route   GET /api/admin/users
// @desc    List users for admin panel
router.get('/users', verifyAdmin, async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
        return res.json(users);
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Failed to fetch users' });
    }
});

// @route   POST /api/admin/users
// @desc    Create user from admin panel
router.post('/users', verifyAdmin, async (req, res) => {
    try {
        const { name, email, password, countryCode, contact } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'name, email and password are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            countryCode: countryCode || '+91',
            contact: contact || '',
        });

        return res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            countryCode: user.countryCode,
            contact: user.contact,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Failed to create user' });
    }
});

// @route   PATCH /api/admin/users/:id
// @desc    Update user fields from admin panel
router.patch('/users/:id', verifyAdmin, async (req, res) => {
    try {
        const allowed = ['name', 'email', 'countryCode', 'contact'];
        const updateData = {};

        allowed.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updateData[field] = req.body[field];
            }
        });

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(req.body.password, salt);
        }

        const user = await User.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            projection: { password: 0 },
            runValidators: true,
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json(user);
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Failed to update user' });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Remove user from admin panel
router.delete('/users/:id', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(204).send();
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Failed to delete user' });
    }
});

module.exports = router;
