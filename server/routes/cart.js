const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const router = express.Router();

const withProductPopulate = {
    path: 'items.product',
    select: 'name price stock imageUrl category',
};

async function getOrCreateCart(userId) {
    let cart = await Cart.findOne({ user: userId }).populate(withProductPopulate);
    if (!cart) {
        cart = await Cart.create({ user: userId, items: [] });
        cart = await Cart.findById(cart._id).populate(withProductPopulate);
    }
    return cart;
}

router.get('/', auth, async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.user.id);
        return res.json(cart);
    } catch (err) {
        console.error('Failed to load cart:', err.message);
        return res.status(500).json({ message: 'Failed to load cart' });
    }
});

router.post('/items', auth, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const qty = Number(quantity || 1);

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        if (!Number.isInteger(qty) || qty < 1) {
            return res.status(400).json({ message: 'Quantity must be an integer greater than 0' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const cart = await getOrCreateCart(req.user.id);
        const existingItem = cart.items.find((item) => String(item.product._id) === String(product._id));
        const currentQty = existingItem ? existingItem.quantity : 0;
        const nextQty = currentQty + qty;

        if (nextQty > product.stock) {
            return res.status(400).json({ message: 'Requested quantity exceeds available stock' });
        }

        if (existingItem) {
            existingItem.quantity = nextQty;
        } else {
            cart.items.push({ product: product._id, quantity: qty });
        }

        await cart.save();
        const updatedCart = await Cart.findById(cart._id).populate(withProductPopulate);
        return res.status(201).json(updatedCart);
    } catch (err) {
        console.error('Failed to add cart item:', err.message);
        return res.status(500).json({ message: 'Failed to update cart' });
    }
});

router.patch('/items/:productId', auth, async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        const qty = Number(quantity);

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        if (!Number.isInteger(qty) || qty < 1) {
            return res.status(400).json({ message: 'Quantity must be an integer greater than 0' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (qty > product.stock) {
            return res.status(400).json({ message: 'Requested quantity exceeds available stock' });
        }

        const cart = await getOrCreateCart(req.user.id);
        const item = cart.items.find((entry) => String(entry.product._id) === productId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        item.quantity = qty;
        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate(withProductPopulate);
        return res.json(updatedCart);
    } catch (err) {
        console.error('Failed to update cart item:', err.message);
        return res.status(500).json({ message: 'Failed to update cart item' });
    }
});

router.delete('/items/:productId', auth, async (req, res) => {
    try {
        const { productId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const cart = await getOrCreateCart(req.user.id);
        cart.items = cart.items.filter((entry) => String(entry.product._id) !== productId);
        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate(withProductPopulate);
        return res.json(updatedCart);
    } catch (err) {
        console.error('Failed to remove cart item:', err.message);
        return res.status(500).json({ message: 'Failed to remove cart item' });
    }
});

module.exports = router;
