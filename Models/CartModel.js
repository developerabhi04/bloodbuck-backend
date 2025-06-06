import mongoose from "mongoose";

const CartSchema = new mongoose.Schema(
    {
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
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                sizes: {
                    type: String,
                    default: null,  // Allows null
                },
                seamSizes: {
                    type: mongoose.Schema.Types.Mixed,
                    default: null,  // Allows null or different types
                },
                colorName: {
                    type: String,  // Store the selected color name
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

export const Cart = mongoose.model("Cart", CartSchema);
export default Cart;
