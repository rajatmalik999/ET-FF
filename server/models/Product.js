const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        imageUrl: {
            type: String,
            default: '',
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 4.2,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
