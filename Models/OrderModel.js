import mongoose from "mongoose";
const schema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    cartItems: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            name: String,
            quantity: Number,
            price: Number,
            imageUrl: String,
            selectedSize: String,
            selectedSeamSize: String,
            selectedColorName: String,
            reviewed: { type: Boolean, default: false },
        },
    ],
    shippingDetails: {
        fullName: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        email: { type: String, required: true },
    },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    discount: {
        type: Number,
        default: 0,
    },
    discountAmount: {
        type: Number,
        default: 0,
    },
    paymentMethod: {
        type: String,
        enum: ["Paypal"],
        default: "paypal",
    },
    status: {
        type: String,
        enum: ["Pending", "Processing", "Shipped", "Delivered"],
        default: "Pending",
    },

}, {
    timestamps: true,
});

const Order = mongoose.model("Order", schema);

export default Order;
