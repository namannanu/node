const multer = require("multer");
const path = require("path");

// Define storage for uploaded files - using memory storage for Vercel compatibility
const storage = multer.memoryStorage();

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

module.exports = upload;