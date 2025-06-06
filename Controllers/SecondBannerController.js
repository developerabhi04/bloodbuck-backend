import catchAsyncErrors from '../middlewares/catchAsyncError.js';
import SecondBanner from '../Models/SecondBannerModel.js';
import cloudinary from 'cloudinary';
import multer from 'multer';
import mongoose from 'mongoose';



// Setup multer to use memory storage (store files in memory temporarily)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadFileToCloudinary = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream(
            { folder },(error, result) => {
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
export const addSecondBanner = [upload.fields([{ name: 'photos', maxCount: 5 }]), async (req, res) => {
    const { headingOne } = req.body;

    // Handle file uploads to Cloudinary
    let photos = [];

    if (req.files?.photos) {
        photos = await Promise.all(
            req.files.photos.map(async (file) => await uploadFileToCloudinary(file.buffer, 'sbanner'))
        );
    }


    // ✅ Save banner to MongoDB
    const newSecondBanner = await SecondBanner.create({headingOne, photos });


    res.status(201).json({
        success: true,
        message: "Banner created successfully",
        banner: newSecondBanner,
    });
}];



// ✅ Get All Banners
export const getAllSecondBanner = catchAsyncErrors(async (req, res) => {
    const secondBanners = await SecondBanner.find();
    res.status(200).json({
        success: true,
        banners:secondBanners,
    });
});



// ✅ Update Banner
export const updateSecondBanner = [upload.fields([{ name: 'photos', maxCount: 5 }]), catchAsyncErrors(async (req, res) => {
    const { id } = req.params;
    const { headingOne } = req.body;

    // ✅ Check if  ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid Banner ID" });
    }


    const secondBannerFind = await SecondBanner.findById(id);
    if (!secondBannerFind) {
        return res.status(404).json({ success: false, message: "Banner not found" });
    }



    // ✅ Handle Product Image Updates (Delete Old & Upload New)
    if (req.files?.photos) {
        // Delete old photos
        if (secondBannerFind.photos.length > 0) {
            const publicIds = secondBannerFind.photos.map(photo => photo.public_id);
            await deleteFromCloudinary(publicIds);
        }

        // Upload new photos
        secondBannerFind.photos = await Promise.all(
            req.files.photos.map(async (file) => await uploadFileToCloudinary(file.buffer, 'sbanner'))
        );
    }




    // ✅ Update text fields
    if (headingOne) secondBannerFind.headingOne = headingOne;

    await secondBannerFind.save();

    res.status(200).json({
        success: true,
        message: "Banner updated successfully!",
        banner: secondBannerFind,
    });
})];




// ✅ Delete Banner
export const deleteSecondBanner = catchAsyncErrors(async (req, res) => {
    const { id } = req.params;

    const secondBanner = await SecondBanner.findById(id);
    if (!secondBanner) {
        return res.status(404).json({ success: false, message: "Banner not found" });
    }

    // ✅ Delete images from Cloudinary (Only if they exist)
    if (secondBanner.photos && secondBanner.photos.length > 0) {
        const photoPublicIds = secondBanner.photos.map(photo => photo.public_id).filter(id => id); // Remove undefined/null IDs
        if (photoPublicIds.length > 0) {
            await deleteFromCloudinary(photoPublicIds);
        }
    }

    // ✅ Delete banner from DB
    await secondBanner.deleteOne();

    res.status(200).json({
        success: true,
        message: "Banner deleted successfully",
    });
});


// ✅ Get Single Banner
export const getSingleBanner = catchAsyncErrors(async (req, res) => {
    const { id } = req.params;

    const banner = await SecondBanner.findById(id);
    if (!banner) {
        return res.status(404).json({ success: false, message: "Banner not found" });
    }

    res.status(200).json({
        success: true,
        secondBanner: banner,
    });
    
});
