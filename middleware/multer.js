const express = require("express");
const upload = require("../src/config/multerconfig"); // Adjust the path to your Multer config file

const app = express();

// Upload route
app.post("/upload", upload.single("image"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded." });
        }

        // Log file information
        console.log("File uploaded:", req.file);

        // Respond with file information
        res.status(200).json({
            success: true,
            message: "File uploaded successfully.",
            file: {
                filename: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype,
                fieldname: req.file.fieldname,
                buffer: req.file.buffer ? "Buffer present" : "No buffer"
            },
        });
    } catch (err) {
        console.error("Error uploading file:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
});

// Export for use in main server
module.exports = app;