import BannerOne from '../Models/BannersModel.js';
import catchAsyncErrors from '../middlewares/catchAsyncError.js';
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




// ✅ Add New Banner
export const addBanner = [upload.fields([{ name: 'photos', maxCount: 5 }]), async (req, res) => {
    const { headingOne, paragraph } = req.body;


    // Handle file uploads to Cloudinary
    let photos = [];

    if (req.files?.photos) {
        photos = await Promise.all(
            req.files.photos.map(async (file) => await uploadFileToCloudinary(file.buffer, 'bannerss'))
        );
    }

    const newBanner = await BannerOne.create({
        headingOne,
        paragraph,
        photos
    });



    await newBanner.save();

    res.status(201).json({
        success: true,
        message: "Banner created successfully",
        banner: newBanner
    });
}];



// ✅ Get All Banners
export const getAllBanner = catchAsyncErrors(async (req, res) => {
    const banners = await BannerOne.find();
    res.status(200).json({
        success: true,
        banners,
    });
});

// ✅ Get Single Banner
export const getSingleBanner = catchAsyncErrors(async (req, res) => {
    const { id } = req.params;

    const banner = await BannerOne.findById(id);
    if (!banner) {
        return res.status(404).json({ success: false, message: "Banner not found" });
    }

    res.status(200).json({
        success: true,
        banner,
    });
});


// ✅ Update Banner
export const updateBanner = [upload.fields([{ name: 'photos', maxCount: 5 }]), async (req, res) => {
    try {
        const { id } = req.params;
        const { headingOne, paragraph } = req.body;

        // Find the existing banner
        const bannerFind = await BannerOne.findById(id);
        if (!bannerFind) {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }


        // ✅ Handle Product Image Updates (Delete Old & Upload New)
        if (req.files?.photos) {
            // Delete old photos
            if (bannerFind.photos.length > 0) {
                const publicIds = bannerFind.photos.map(photo => photo.public_id);
                await deleteFromCloudinary(publicIds);
            }

            // Upload new photos
            bannerFind.photos = await Promise.all(
                req.files.photos.map(async (file) => await uploadFileToCloudinary(file.buffer, 'bannerss'))
            );
        }

        // ✅ Update text fields
        if (headingOne) bannerFind.headingOne = headingOne;
        if (paragraph) bannerFind.paragraph = paragraph;

        await bannerFind.save();

        res.status(200).json({
            success: true,
            message: "Banner updated successfully!",
            banner: bannerFind,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
}];



// ✅ Delete Banner
export const deleteBanner = catchAsyncErrors(async (req, res) => {
    const { id } = req.params;

    // Find the banner by ID
    const bannerFind = await BannerOne.findById(id);
    if (!bannerFind) {
        return res.status(404).json({ success: false, message: "Banner not found" });
    }


    // ✅ Delete images from Cloudinary (Only if they exist)
    if (bannerFind.photos && bannerFind.photos.length > 0) {
        const photoPublicIds = bannerFind.photos.map(photo => photo.public_id).filter(id => id); // Remove undefined/null IDs
        if (photoPublicIds.length > 0) {
            await deleteFromCloudinary(photoPublicIds);
        }
    }

    // Delete the banner from the database
    await bannerFind.deleteOne();

    // Respond with success message
    res.status(200).json({
        success: true,
        message: "Banner and content deleted successfully",
    });
});



