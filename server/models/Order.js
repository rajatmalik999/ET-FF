const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        fundId: { type: String, required: true },
        fundName: { type: String, required: true },
        fundSymbol: { type: String, required: true },
        units: { type: Number, required: true },
        navAtPurchase: { type: Number, required: true },
        amount: { type: Number, required: true },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'cancelled'],
            default: 'completed',
        },
    },
    { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
