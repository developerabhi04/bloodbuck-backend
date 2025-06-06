import catchAsyncErrors from '../middlewares/catchAsyncError.js';
import ThirdBanner from '../Models/ThirdBannerModel.js';
import cloudinary from 'cloudinary';
import multer from 'multer';
import mongoose from 'mongoose';



// Setup multer to use memory storage (store files in memory temporarily)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const uploadFileToCloudinary = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream(
            { folder },
            (error, result) => {
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



// ✅ Add New Banner
export const addThirdBanner = [upload.fields([{ name: 'photos', maxCount: 5 }]), async (req, res) => {

    let photos = [];

    if (req.files?.photos) {
        photos = await Promise.all(
            req.files.photos.map(async (file) => await uploadFileToCloudinary(file.buffer, 'sbanner'))
        );
    }
    // ✅ Save banner to MongoDB
    const newThirdBanner = new ThirdBanner({
        photos,
    });

    await newThirdBanner.save();

    res.status(201).json({
        success: true,
        message: "Banner created successfully",
        newThirdBanner
    });
}];


// ✅ Get All Banners
export const getAllThirdBanner = catchAsyncErrors(async (req, res) => {
    const thirdBanners = await ThirdBanner.find();
    res.status(200).json({
        success: true,
        thirdBanners,
    });
});



// ✅ Update Banner
export const updateThirdBanner = [upload.fields([{ name: 'photos', maxCount: 5 }]), catchAsyncErrors(async (req, res) => {
    const { id } = req.params;;

    // ✅ Check if  ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Banner ID" });
    }

    const thirdBanner = await ThirdBanner.findById(id);
    if (!thirdBanner) {
        return res.status(404).json({ success: false, message: "Banner not found" });
    }

    // ✅ Handle Product Image Updates (Delete Old & Upload New)
    if (req.files?.photos) {
        // Delete old photos
        if (thirdBanner.photos.length > 0) {
            const publicIds = thirdBanner.photos.map(photo => photo.public_id);
            await deleteFromCloudinary(publicIds);
        }

        // Upload new photos
        thirdBanner.photos = await Promise.all(
            req.files.photos.map(async (file) => await uploadFileToCloudinary(file.buffer, 'sbanner'))
        );
    }




    await thirdBanner.save();

    res.status(200).json({
        success: true,
        message: "Banner updated successfully!",
        thirdBanner,
    });
})];

// ✅ Delete Banner
export const deleteThirdBanner = catchAsyncErrors(async (req, res) => {
    const { id } = req.params;

    const thirdBanner = await ThirdBanner.findById(id);
    if (!thirdBanner) {
        return res.status(404).json({ success: false, message: "Banner not found" });
    }

    // ✅ Delete images from Cloudinary (Only if they exist)
    if (thirdBanner.photos && thirdBanner.photos.length > 0) {
        const photoPublicIds = thirdBanner.photos.map(photo => photo.public_id).filter(id => id); // Remove undefined/null IDs
        if (photoPublicIds.length > 0) {
            await deleteFromCloudinary(photoPublicIds);
        }
    }
    // ✅ Delete banner from DB
    await thirdBanner.deleteOne();

    res.status(200).json({
        success: true,
        message: "Banner deleted successfully",
    });
});


// ✅ Get Single Banner
export const getSingleBanner = catchAsyncErrors(async (req, res) => {
    const { id } = req.params;

    const banner = await ThirdBanner.findById(id);
    if (!banner) {
        return res.status(404).json({ success: false, message: "Banner not found" });
    }

    res.status(200).json({
        success: true,
        thirdBanner: banner
    });
});