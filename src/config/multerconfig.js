import multer from "multer";
import path from "path";

// Define storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public"); // Ensure this directory exists
    },
    filename: function (req, file, cb) {
        // Generate a unique filename with the original file extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extension = path.extname(file.originalname); // Get file extension (e.g., .jpg, .png)
        const filename = `${uniqueSuffix}${extension}`; // Combine unique suffix and extension
        cb(null, filename); // Finalize the filename
    }
});

// Create the multer instance
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
    fileFilter: (req, file, cb) => {
        // Allow only JPEG and PNG files
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
            cb(null, true); // Accept the file
        } else {
            cb(new Error("Invalid file type. Only JPEG and PNG are allowed."), false); // Reject the file
        }
    }
});

export default upload;