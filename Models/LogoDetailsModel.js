import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        logo: [
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
        address: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },

        facebook: {
            type: String,
            default: ""
        },
        twitter: {
            type: String,
            default: ""
        },
        instagram: {
            type: String,
            default: ""
        },
        linkedin: {
            type: String,
            default: ""
        },

    },
    { timestamps: true }
);

const Logo = mongoose.model("Company", schema);


export default Logo;
