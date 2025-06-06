import cloudinary from "cloudinary";
import catchAsyncErrors from "../middlewares/catchAsyncError.js";
import Logo from "../Models/LogoDetailsModel.js";
import multer from 'multer';
import mongoose from 'mongoose';



// Setup multer to use memory storage (store files in memory temporarily)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



// Controller for adding logo
export const addCompanyInfo = [upload.fields([{ name: 'logo', maxCount: 1 }]), async (req, res) => {
    try {
        const { address, phone, email, facebook, twitter, instagram, linkedin } = req.body;

        // Helper function to upload files to Cloudinary
        const uploadFileToCloudinary = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                cloudinary.v2.uploader.upload_stream({ folder: 'logo' }, (error, result) => {
                    if (error) return reject(error);
                    resolve({
                        public_id: result.public_id,
                        url: result.secure_url
                    });
                }).end(fileBuffer);
            });
        };

        // Handle file uploads to Cloudinary
        let logo = {};

        if (req.files?.logo) {
            const uploadedLogo = await uploadFileToCloudinary(req.files.logo[0].buffer);
            logo = uploadedLogo; // This will contain both public_id and url
        }

        // Handle file uploads to Cloudinary
        // const logo = req.files?.logo ? await uploadFileToCloudinary(req.files.logo[0].buffer) : '';

        // Create a new application instance
        const newLogo = new Logo({ address, phone, email, facebook, twitter, instagram, linkedin, logo });

        // Save the new application to the database
        await newLogo.save();

        // Respond with a success message
        res.status(201).json({
            success: true,
            message: 'Banner and Content Created Successfully!',
            company: newLogo
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
}];








// ✅ Get Company Information
export const getCompanyInfo = catchAsyncErrors(async (req, res) => {
    const companys = await Logo.find({});
    if (!companys) {
        return res.status(404).json({ message: "Company info not found" });
    }
    res.status(200).json({ success: true, companys });
});


// ✅ Update Company Information (including logo)
// export const updateCompanyInfo = catchAsyncErrors(async (req, res) => {
//     const { id } = req.params;
//     const { address, phone, email, facebook, twitter, instagram, linkedin } = req.body;

//     let company = await Logo.findById(id);
//     if (!company) {
//         return res.status(404).json({ message: "Company info not found" });
//     }

//     // ✅ If new logo is uploaded, delete old one and upload a new one
//     if (req.file) {
//         await cloudinary.v2.uploader.destroy(company.logo.public_id);
//         const uploadedLogo = await uploadToCloudinary([req.file]);
//         company.logo = uploadedLogo[0];
//     }

//     // ✅ Update other fields
//     company.address = address || company.address;
//     company.phone = phone || company.phone;
//     company.email = email || company.email;
//     company.socialLinks = {
//         facebook: facebook || company.socialLinks.facebook,
//         twitter: twitter || company.socialLinks.twitter,
//         instagram: instagram || company.socialLinks.instagram,
//         linkedin: linkedin || company.socialLinks.linkedin,
//     };

//     await company.save();

//     res.status(200).json({
//         success: true,
//         message: "Company info updated successfully",
//         company,
//     });
// });





export const updateCompanyInfo = [upload.fields([{ name: 'logo', maxCount: 1 }]), async (req, res) => {
    try {
        const { id } = req.params;
        const { address, phone, email, facebook, twitter, instagram, linkedin } = req.body;

        const company = await Logo.findById(id);
        if (!company) {
            return res.status(404).json({ success: false, message: "Company Information not found" });
        }

        // Check if the banner has photos
        let currentCompanyUrl = company.logo.length ? company.logo[0].url : null;

        if (req.files?.logo) {
            // Extract public_id from the current image URL
            if (currentCompanyUrl) {
                const publicIdMatch = currentCompanyUrl.match(/\/([^/]+)\.[a-z]+$/i);

                if (publicIdMatch) {
                    const publicId = `logo/${publicIdMatch[1]}`;
                    await cloudinary.v2.uploader.destroy(publicId);
                }
            }

            // Upload the new image to Cloudinary
            const uploadedPhoto = await new Promise((resolve, reject) => {
                cloudinary.v2.uploader.upload_stream(
                    { folder: 'logo' },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                ).end(req.files.logo[0].buffer);
            });

            // Update photos array with the new image
            company.logo = [{
                public_id: uploadedPhoto.public_id,
                url: uploadedPhoto.secure_url,
            }];
        }



        company.address = address || company.address;
        company.phone = phone || company.phone;
        company.email = email || company.email;

        company.facebook = facebook || company.facebook;
        company.twitter = twitter || company.twitter;
        company.instagram = instagram || company.instagram;
        company.linkedin = linkedin || company.linkedin;


        await company.save();



        res.status(200).json({
            success: true,
            message: "Company information updated successfully!",
            company,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again later.",
        });
    }
},
];




export const deleteCompanyInfo = catchAsyncErrors(async (req, res) => {
    const { id } = req.params;

    


    // Find the logo by ID
    const company = await Logo.findById(id);
    if (!company) {
        return res.status(404).json({
            success: false,
            message: "Content not found",
        });
    }

    // Check if the banner has an image stored in `photos`
    if (company.logo.length > 0) {
        const currentCompanyUrl = company.logo[0].url; // Access the first image

        if (currentCompanyUrl) {
            // Extract public_id from Cloudinary URL
            const publicIdMatch = currentCompanyUrl.match(/\/([^/]+)\.[a-z]+$/i);
            if (publicIdMatch) {
                const publicId = `logo/${publicIdMatch[1]}`; // Assuming "banner" is the folder name in Cloudinary

                // Delete the image from Cloudinary
                try {
                    await cloudinary.v2.uploader.destroy(publicId);
                    console.log("Image deleted from Cloudinary:", publicId);
                } catch (error) {
                    console.error("Failed to delete image from Cloudinary:", error);
                }
            }
        }
    }

    // Remove the logo from the database
    await company.deleteOne();

    // Respond with a success message
    res.status(200).json({
        success: true,
        message: "Content deleted successfully",
    });

});





// ✅ Get Single Banner
export const getSingleCompanyInfo = catchAsyncErrors(async (req, res) => {
    const { id } = req.params;

    const banner = await Logo.findById(id);
    if (!banner) {
        return res.status(404).json({ success: false, message: "Company info not found" });
    }

    res.status(200).json({
        success: true,
        company: banner,
    });
});
