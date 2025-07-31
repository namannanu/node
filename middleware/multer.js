import express from "express";
import upload from "../config/multerconfig"; // Adjust the path to your Multer config file

const app = express();

// Serve static files from the "public" directory
app.use(express.static("public"));

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
                filename: req.file.filename,
                path: req.file.path,
                size: req.file.size,
                mimetype: req.file.mimetype,
                destination: req.file.destination,
                fieldname: req.file.fieldname,
                stream: req.file.stream,

            },
        });
    } catch (err) {
        console.error("Error uploading file:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});