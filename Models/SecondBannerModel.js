import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
    {
        headingOne: {
            type: String,
            // required: true,
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
    },
    {
        timestamps: true, // This adds createdAt and updatedAt fields automatically
    }
);

const SecondBanner = mongoose.model("SecondBanner", bannerSchema);

export default SecondBanner;
