import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            unique: true,
            trim: true,
        },
        photos: [
            {
                public_id: {
                    type: String,
                    required: [true, "Please enter Public ID"],
                },
                url: {
                    type: String,
                    required: [true, "Please enter URL"],
                },
            },
        ],
        slug: {
            type: String,
            unique: true,
            lowercase: true,
        },
        subcategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "SubCategory",
            },
        ],
    },
    { timestamps: true }
);

const subCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Subcategory name is required"],
            trim: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
    },
    { timestamps: true }
);

export const Category = mongoose.model("Category", categorySchema);
export const SubCategory = mongoose.model("SubCategory", subCategorySchema);
