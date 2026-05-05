const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

const DEFAULT_PRODUCTS = [
    {
        name: 'Wireless Headphones Pro',
        slug: 'wireless-headphones-pro',
        description: 'Noise cancellation, 40h battery, and premium sound profile.',
        category: 'Audio',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80',
        price: 129.99,
        stock: 28,
        rating: 4.6,
    },
    {
        name: 'Smart Watch X2',
        slug: 'smart-watch-x2',
        description: 'Fitness tracking, call notifications, and AMOLED display.',
        category: 'Wearables',
        imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=1200&q=80',
        price: 189.0,
        stock: 36,
        rating: 4.4,
    },
    {
        name: 'Mechanical Keyboard TKL',
        slug: 'mechanical-keyboard-tkl',
        description: 'Hot-swappable switches with RGB backlight and USB-C.',
        category: 'Accessories',
        imageUrl: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=1200&q=80',
        price: 94.5,
        stock: 42,
        rating: 4.5,
    },
    {
        name: '4K Monitor 27"',
        slug: '4k-monitor-27',
        description: 'Ultra HD IPS panel with 99% sRGB and slim bezels.',
        category: 'Displays',
        imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200&q=80',
        price: 329.99,
        stock: 19,
        rating: 4.7,
    },
];

async function ensureSeedProducts() {
    const count = await Product.estimatedDocumentCount();
    if (count === 0) {
        await Product.insertMany(DEFAULT_PRODUCTS);
    }
}

router.get('/', async (req, res) => {
    try {
        await ensureSeedProducts();
        const products = await Product.find().sort({ createdAt: -1 });
        return res.json(products);
    } catch (err) {
        console.error('Failed to fetch products:', err.message);
        return res.status(500).json({ message: 'Failed to fetch products' });
    }
});

module.exports = router;
