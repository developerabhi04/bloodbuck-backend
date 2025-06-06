import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import Coupon from "../Models/CouponModel.js";


export const validateCoupon = catchAsyncErrors(async (req, res) => {
    const { code, totalAmount } = req.body;

    if (!code || !totalAmount) {
        return res.status(400).json({ success: false, message: "Code and total amount are required" });
    }

    const coupon = await Coupon.findOne({ code, isActive: true });

    if (!coupon) {
        return res.status(404).json({ success: false, message: "Invalid or expired coupon code" });
    }

    if (new Date(coupon.expiryDate) < new Date()) {
        return res.status(400).json({ success: false, message: "Coupon has expired" });
    }

    const discountAmount = (totalAmount * coupon.discount) / 100;
    const discountedTotal = totalAmount - discountAmount;

    res.status(200).json({
        success: true,
        message: "Coupon applied successfully",
        discountAmount,
        discountedTotal,
    });
});




// ✅ Create a new coupon
export const createCoupon = catchAsyncErrors(async (req, res) => {
    console.log("Received Data:", req.body); // 🔍 Debugging

    const { code, discount, expiryDate, isActive } = req.body;

    if (!code || !discount || !expiryDate) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
        return res.status(400).json({ success: false, message: "Coupon code already exists" });
    }

    const newCoupon = new Coupon({
        code,
        discount,
        expiryDate,
        isActive: isActive !== undefined ? isActive : true // ✅ Ensure isActive is set correctly
    });

    await newCoupon.save();

    res.status(201).json({
        success: true,
        message: "Coupon created successfully!",
        coupon: newCoupon,
    });
});


// ✅ Get all coupons
export const getAllCoupons = catchAsyncErrors(async (req, res) => {
    const coupons = await Coupon.find();
    res.status(200).json({ success: true, coupons });
});

// ✅ Update a coupon
export const updateCoupon = catchAsyncErrors(async (req, res) => {
    console.log("Update Request Data:", req.body); // 🔍 Debugging

    const { id } = req.params;
    const { code, discount, expiryDate, isActive } = req.body;

    let coupon = await Coupon.findById(id);
    if (!coupon) {
        return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    // ✅ Ensure `isActive` is updated correctly
    if (typeof isActive === "boolean") {
        coupon.isActive = isActive;
    }

    if (code) coupon.code = code;
    if (discount) coupon.discount = discount;
    if (expiryDate) coupon.expiryDate = expiryDate;

    await coupon.save();

    res.status(200).json({
        success: true,
        message: "Coupon updated successfully!",
        coupon,
    });
});


// ✅ Delete a coupon
export const deleteCoupon = catchAsyncErrors(async (req, res) => {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
        return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    await coupon.deleteOne();

    res.status(200).json({ success: true, message: "Coupon deleted successfully!" });
});


// ✅ Get Single Coupon
export const getSingleCoupon = catchAsyncErrors(async (req, res) => {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
        return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    res.status(200).json({
        success: true,
        coupon,
    });
});


