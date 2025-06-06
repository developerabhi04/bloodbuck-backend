import mongoose from "mongoose";

const colorVariantSchema = new mongoose.Schema({
    colorName: {
        type: String,
        required: [true, "Please enter color name"],
    },
    // Dedicated colour image (optional)
    colorImage: {
        public_id: { type: String },
        url: { type: String },
    },
    photos: [
        {
            public_id: { type: String },
            url: { type: String },
        },
    ],
    stock: {
        type: Number,
        default: 0,
        // required: [true, "Please enter stock"],
    },

});

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter Name"],
        },
        price: {
            type: Number,
            required: [true, "Please enter Price"],
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        subcategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubCategory",
            required: true,
        },
        description: {
            type: String,
            required: [true, "Please enter Description"],
        },
        colors: [colorVariantSchema],
        reviews: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                rating: {
                    type: Number,
                    required: true,
                },
                comment: {
                    type: String,
                },
                createdAt: { type: Date, default: Date.now },
            },
        ],
        averageRating: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
