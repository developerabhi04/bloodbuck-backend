import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true, // Ensure consistency
        },
        discount: {
            type: Number,
            required: true,
            min: 1, // Minimum discount
            max: 100, // Maximum discount 100%
        },
        expiryDate: {
            type: Date,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true, // Coupons are active by default
        },
    },
    { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
