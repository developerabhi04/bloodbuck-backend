import mongoose from "mongoose";
import Wishlist from "../Models/WishlistModel.js";
import Cart from "../Models/CartModel.js";

const validateWishlistData = (userId, productId, colorName) => {
    if (!userId || !productId || !colorName || productId === "null") {
        throw new Error("Invalid data provided: userId, productId, and colorName are required.");
    }
};



export const addToWishlist = async (req, res) => {
    try {
        const { userId, productId, sizes, seamSizes, colorName } = req.body;

        // Log the received payload for debugging
        console.log("Received addToWishlist payload:", req.body);

        try {
            validateWishlistData(userId, productId, colorName);
        } catch (validationError) {
            return res.status(400).json({ success: false, message: validationError.message });
        }

        let wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            wishlist = new Wishlist({ userId, items: [] });
        }

        // Convert sizes and seamSizes to strings (if provided) for consistent storage
        const sizeValue = sizes != null ? sizes.toString() : null;
        const seamSizeValue = seamSizes != null ? seamSizes.toString() : null;

        const existingItemIndex = wishlist.items.findIndex(
            (item) =>
                item.productId &&
                item.productId.toString() === productId &&
                String(item.sizes) === String(sizeValue) &&
                String(item.seamSizes) === String(seamSizeValue) &&
                item.colorName === colorName
        );


        if (existingItemIndex === -1) {
            wishlist.items.push({
                productId,
                sizes: sizeValue,
                seamSizes: seamSizeValue,
                colorName,
            });
            await wishlist.save();
            return res.status(200).json({ success: true, message: "Item added to wishlist!", wishlist });
        } else {
            return res.status(400).json({ success: false, message: "Item already in wishlist!" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// -----------------------------------------------------------------------------
// Move an item from Wishlist to Cart
// -----------------------------------------------------------------------------
export const moveWishlistToCart = async (req, res) => {
    try {
        console.log("🔍 Received move-to-cart request:", req.body);

        let { userId, productId, sizes, seamSizes, colorName } = req.body;

        if (!userId || !productId || !colorName) {
            return res.status(400).json({ success: false, message: "User ID, Product ID, and Color Name are required!" });
        }

        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid User ID or Product ID format!" });
        }

        const wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            return res.status(404).json({ success: false, message: "Wishlist not found!" });
        }

        // Convert sizes and seamSizes to strings if defined
        sizes = sizes != null ? sizes.toString() : null;
        seamSizes = seamSizes != null ? seamSizes.toString() : null;
        colorName = colorName.trim();

        console.log("🔍 Checking wishlist for item:", { productId, sizes, seamSizes, colorName });

        const itemIndex = wishlist.items.findIndex(
            (item) =>
                item.productId.toString() === productId &&
                String(item.sizes || "") === String(sizes || "") &&
                String(item.seamSizes || "") === String(seamSizes || "") &&
                item.colorName.trim() === colorName
        );

        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: "Item not found in wishlist!" });
        }

        console.log("✅ Item found in wishlist:", wishlist.items[itemIndex]);
        const item = wishlist.items[itemIndex];

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const cartItemIndex = cart.items.findIndex(
            (cartItem) =>
                cartItem.productId.toString() === productId &&
                String(cartItem.sizes || "") === String(sizes || "") &&
                String(cartItem.seamSizes || "") === String(seamSizes || "") &&
                cartItem.colorName.trim() === colorName
        );

        if (cartItemIndex !== -1) {
            cart.items[cartItemIndex].quantity += 1;
        } else {
            cart.items.push({
                productId: item.productId,
                sizes: sizes,
                seamSizes: seamSizes,
                colorName: colorName,
                quantity: 1,
            });
        }

        await cart.save();
        wishlist.items.splice(itemIndex, 1);
        await wishlist.save();

        res.status(200).json({
            success: true,
            message: "Item moved to cart successfully!",
            cart,
        });
    } catch (error) {
        console.error("❌ Error moving wishlist item to cart:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// -----------------------------------------------------------------------------
// Remove an item from the Wishlist
// -----------------------------------------------------------------------------

export const removeFromWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.params;
        const { sizes, seamSizes, colorName } = req.query;

        if (!userId || !productId || !colorName) {
            return res.status(400).json({
                success: false,
                message: "Invalid data provided! userId, productId, and colorName are required.",
            });
        }

        // Validate Object IDs
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid userId or productId format!",
            });
        }

        const wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: "Wishlist not found!",
            });
        }

        const initialLength = wishlist.items.length;
        wishlist.items = wishlist.items.filter((item) => {
            return !(
                item.productId.toString() === productId &&
                (item.sizes ? String(item.sizes) === String(sizes) : !sizes) &&
                (item.seamSizes ? String(item.seamSizes) === String(seamSizes) : !seamSizes) &&
                item.colorName === colorName
            );
        });

        if (wishlist.items.length === initialLength) {
            return res.status(404).json({ success: false, message: "Item not found in wishlist!" });
        }

        await wishlist.save();
        res.status(200).json({
            success: true,
            message: "Item removed from wishlist successfully!",
            wishlist,
        });
    } catch (error) {
        console.error("Error removing wishlist item:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


// -----------------------------------------------------------------------------
// Get Wishlist with Populated Product Details
// -----------------------------------------------------------------------------
export const getWishlist = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User id is mandatory!",
            });
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format!",
            });
        }

        const wishlist = await Wishlist.findOne({ userId }).populate({
            path: "items.productId",
            select: "name colors price stock",
        });
        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: "Wishlist not found!",
            });
        }

        const populatedItems = wishlist.items
            .map((item) => {
                if (!item.productId) {
                    console.warn("Found an item in wishlist with null productId:", item);
                    return null;
                }
                const variant = item.productId.colors.find((color) => color.colorName === item.colorName);
                return {
                    productId: item.productId._id,
                    name: item.productId.name,
                    imageUrl: variant?.photos?.[0]?.url || null,
                    price: item.productId.price,
                    stock: item.productId.stock,
                    colorOptions: item.productId.colors.map((color) => color.colorName),
                    sizeOptions: variant?.sizes || [],
                    seamSizeOptions: variant?.seamSizes || [],
                    selectedSize: item.sizes || null,
                    selectedSeamSize: item.seamSizes || null,
                    selectedColorName: item.colorName,
                    quantity: item.quantity,
                };
            })
            .filter((item) => item !== null);

        res.status(200).json({ success: true, data: populatedItems });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
