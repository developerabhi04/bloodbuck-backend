import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
    {
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
    },
    {
        timestamps: true, // This adds createdAt and updatedAt fields automatically
    }
);

const ThirdBanner = mongoose.model("ThirdBanner", bannerSchema);

export default ThirdBanner;
