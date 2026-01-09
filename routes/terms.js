// routes/terms.js
const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");

// Write to the backend directory which is mounted
const LOG_FILE = path.join(process.cwd(), "logs.txt");

router.post("/api/terms-acceptance", async (req, res) => {
	try {
		const {fullName, email} = req.body;

		// Get IP address
		const ip =
			req.headers["x-forwarded-for"]?.split(",")[0] ||
			req.headers["x-real-ip"] ||
			req.connection.remoteAddress ||
			req.socket.remoteAddress ||
			"IP not available";

		const timestamp = new Date().toISOString();
		const readableDate = new Date().toLocaleString("en-US", {
			timeZone: "America/Vancouver",
			dateStyle: "full",
			timeStyle: "long",
		});

		const acceptanceLog = {
			fullName,
			email,
			ip,
			timestamp,
			userAgent: req.headers["user-agent"] || "Unknown",
		};

		console.log("Terms Acceptance:", acceptanceLog);

		// Format the log entry
		const logEntry = `
${"=".repeat(80)}
TERMS & POLICIES ACCEPTANCE
${"=".repeat(80)}
Name:       ${fullName}
Email:      ${email}
IP Address: ${ip}
Timestamp:  ${timestamp}
Date:       ${readableDate}
User Agent: ${acceptanceLog.userAgent}
${"=".repeat(80)}

`;

		// Append to file
		await fs.appendFile(LOG_FILE, logEntry, "utf8");
		console.log("Written to:", LOG_FILE); // Debug log

		res.status(200).json({
			success: true,
			message: "Terms acceptance recorded",
		});
	} catch (error) {
		console.error("Error recording terms acceptance:", error);
		res.status(500).json({
			success: false,
			message: "Failed to record acceptance",
		});
	}
});

module.exports = router;
