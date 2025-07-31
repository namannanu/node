const jwt = require("jsonwebtoken");
const logout = require("../routes/logout"); // Ensure this file exists and exports tokenBlacklist

// Ensure tokenBlacklist is imported properly
const tokenBlacklist = logout.tokenBlacklist || new Set(); // Default to an empty set if undefined

module.exports = function (req, res, next) {
    try {
        const authHeader = req.header("Authorization");
        if (!authHeader) {
            return res.status(401).json({ success: false, msg: "No token, authorization denied" });
        }

        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader; // Handle "Bearer " prefix

        if (tokenBlacklist.has(token)) {
            return res.status(401).json({ success: false, msg: "Token is invalid (Logged out)" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // Attach user info to request
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        return res.status(401).json({ success: false, msg: "Token is not valid" });
    }
};
