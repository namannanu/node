const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware"); // Middleware to check authentication

// In-memory blacklist (Consider Redis or database for production)
let tokenBlacklist = new Set();

// Logout Route
router.post("/logout", authMiddleware, (req, res) => {
    try {
        const token = req.header("Authorization").replace("Bearer ", "");
        
        // Add token to blacklist
        tokenBlacklist.add(token);

        res.status(200).json({
            success: true,
            msg: "User logged out successfully"
        });

    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            success: false,
            msg: "Server Error"
        });
    }
});

module.exports = router;
