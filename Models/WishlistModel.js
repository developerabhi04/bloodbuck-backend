// models/WishlistModel.js
import mongoose from "mongoose";

const WishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            sizes: {
                type: String,
                default: null,
            },
            seamSizes: {
                type: mongoose.Schema.Types.Mixed,
                default: null,
            },
            colorName: {
                type: String,
                required: true,
            },
        },
    ],
}, {
    timestamps: true
});

export const Wishlist = mongoose.model("Wishlist", WishlistSchema);
export default Wishlist;
