import multer from "multer";

// ✅ Use Memory Storage (For Cloudinary Upload)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extName = allowedTypes.test(file.originalname.toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (mimeType && extName) {
        cb(null, true);
    } else {
        cb(new Error("Only images (JPEG, JPG, PNG, WEBP, GIF) are allowed!"));
    }
};

// ✅ Initialize Multer to Accept Multiple Fields
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB per file
    fileFilter,
}).fields([
    { name: "photos", maxCount: 5 },  // ✅ Accept up to 5 product images
    { name: "colors", maxCount: 5 },  // ✅ Accept up to 5 color images
    { name: "logo", maxCount: 1 },    // ✅ Accept a single logo image
]);

// ✅ Export Upload Middleware
export default upload;
