import User from "../Models/UserModel.js";
import bcrypt from "bcrypt";
import sendToken from "../utils/jwtToken.js";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";;;
import jwt from "jsonwebtoken";
import cloudinary from 'cloudinary';
import multer from 'multer';



// Setup multer to use memory storage (store files in memory temporarily)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const uploadFileToCloudinary = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream(
            { folder }, (error, result) => {
                if (error) return reject(error);
                resolve({
                    public_id: result.public_id,
                    url: result.secure_url
                });
            }
        ).end(fileBuffer);
    });
};


// ✅ Delete images from Cloudinary
const deleteFromCloudinary = async (publicIds) => {
    try {
        await Promise.all(publicIds.map(id => cloudinary.v2.uploader.destroy(id)));
    } catch (error) {
        console.error("Error deleting images from Cloudinary:", error);
    }
};




// ✅ Google Authentication Route
export const googleLogin = async (req, res) => {
    try {
        const { name, email, picture, uid } = req.user; // Extract user info from verified token

        // Check if user already exists by email or googleId
        let user = await User.findOne({ $or: [{ email }, { googleId: uid }] });

        if (!user) {
            // Create a new user for Google Sign-In
            user = new User({
                name,
                email,
                googleId: uid,
                avatar: [{ url: picture }], // Save profile picture
                // No need to set phone or password for Google sign-in
            });

            await user.save();
        }

        // Generate JWT for your app
        const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || "7d",
        });

        res.status(200).json({
            success: true,
            token: jwtToken,
            user,
        });
    } catch (error) {
        console.error("❌ Google Login Error:", error);
        res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
    }
};





// Register a User
export const registerUser = [upload.fields([{ name: 'avatar', maxCount: 1 }]), catchAsyncErrors(async (req, res, next) => {
    // console.log("uploading file", req.file);

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ success: false, message: "User already exists" });
    }


    let avatar = [];

    if (req.files?.avatar) {
        avatar = await Promise.all(
            req.files.avatar.map(async (file) => await uploadFileToCloudinary(file.buffer, 'avatar'))
        );
    }



    const user = await User.create({
        name,
        email,
        password,
        avatar, // Store the first image as avatar
    });

    sendToken(user, 201, res);
})];




// ✅ Login User
export const loginUser = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    // Check if user exists and select password for verification
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // Send token
    sendToken(user, 200, res);
});



// ✅ Get All Users (Admin Only)
export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find({});

    return res.status(200).json({
        success: true,
        users,
    });
});



// ✅ Delete User (Admin Only)
export const deleteUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Delete images from Cloudinary (Only if they exist)
    if (user.avatar && user.avatar.length > 0) {
        const photoPublicIds = user.avatar.map(photo => photo.public_id).filter(id => id); // Remove undefined/null IDs
        if (photoPublicIds.length > 0) {
            await deleteFromCloudinary(photoPublicIds);
        }
    }

    await user.deleteOne();

    return res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
});


// update user role -- admin
export const updateUserRole = catchAsyncErrors(async (req, res, next) => {
    const { name, email, role } = req.body;
    const user = await User.findByIdAndUpdate(
        req.params.id,
        { name, email, role },
        { new: true, runValidators: true }
    );
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
});