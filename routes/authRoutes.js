// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const {
	signIn,
	signOut,
	validateSession,
	getUserSessions,
	logoutAllDevices,
} = require("../controllers/authController");

router.post("/signin", signIn);
router.post("/signout", signOut);
router.post("/validate", validateSession);
router.post("/sessions", getUserSessions);
router.post("/logout-all", logoutAllDevices);

module.exports = router;
