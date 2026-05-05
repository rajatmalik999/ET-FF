const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const nodemailer = require('nodemailer');
const User = require('../models/User');

require('../config/passport');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = '7d';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const OTP_TTL_MS = 10 * 60 * 1000;
const otpStore = new Map();

const getOtpTransporter = () => {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });
};

// @route   POST /api/auth/register
// @desc    Register a user
router.post('/register', async (req, res) => {
    try {
        const { name, countryCode, contact, email, password } = req.body;

        if (!name || !contact || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            name,
            countryCode,
            contact,
            email,
            password: hashedPassword,
        });

        await user.save();

        return res.status(201).json({
            message: 'User registered successfully',
            userId: user._id,
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        if (user.googleId && !user.password) {
            return res.status(400).json({ message: 'This account uses Google sign-in. Please use Login with Google.' });
        }
        if (!user.password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user._id,
                email: user.email,
            },
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        return res.json({
            message: 'Login successful',
            token,
            userId: user._id,
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/forgot-password/send-otp
// @desc    Send OTP to user email for password reset
router.post('/forgot-password/send-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Please provide email' });
        }

        const transporter = getOtpTransporter();
        if (!transporter) {
            return res.status(500).json({ message: 'Email service is not configured on server.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        if (user.googleId && !user.password) {
            return res.status(400).json({ message: 'This account uses Google sign-in only.' });
        }

        const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
        otpStore.set(email, {
            otp,
            expiresAt: Date.now() + OTP_TTL_MS,
        });

        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject: 'Your password reset OTP',
            text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
        });

        return res.json({ message: 'OTP sent to your email.' });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Unable to send OTP' });
    }
});

// @route   POST /api/auth/forgot-password/verify-otp
// @desc    Verify OTP and reset password
router.post('/forgot-password/verify-otp', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Please provide email, otp and new password' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const otpEntry = otpStore.get(email);
        if (!otpEntry) {
            return res.status(400).json({ message: 'OTP not requested or expired. Please request again.' });
        }
        if (Date.now() > otpEntry.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
        }
        if (String(otpEntry.otp) !== String(otp).trim()) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        otpStore.delete(email);

        return res.json({ message: 'Password reset successful. Please login with your new password.' });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
router.get('/google', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.redirect(`${FRONTEND_URL}/login?error=google_not_configured`);
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback - redirects to frontend with token
router.get(
    '/google/callback',
    (req, res, next) => {
        passport.authenticate('google', { session: false }, (err, user, info) => {
            if (err) {
                return res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
            }
            if (!user) {
                return res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
            }
            req.user = user;
            next();
        })(req, res, next);
    },
    (req, res) => {
        const user = req.user;
        const payload = {
            user: {
                id: user._id,
                email: user.email,
            },
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&userId=${user._id}`);
    }
);

module.exports = router;
