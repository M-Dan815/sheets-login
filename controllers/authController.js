// src/controllers/authController.js
require("dotenv").config();
const {google} = require("googleapis");
const path = require("path");
const crypto = require("crypto");
const {dbRun, dbGet, dbAll} = require("../db/database");

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
const sheets = google.sheets("v4");

// ============ Helper Functions ============

function generateSessionToken() {
	return crypto.randomBytes(32).toString("hex");
}

async function getAuthClient() {
	const keyFilePath = path.join(__dirname, "../service-account.json");

	const auth = new google.auth.GoogleAuth({
		keyFile: keyFilePath,
		scopes: SCOPES,
	});

	return await auth.getClient();
}

// Parse seat count from spreadsheet (default to 1 if invalid)
function parseSeatCount(value) {
	const parsed = parseInt((value || "").toString().trim(), 10);
	return isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

// ============ Session Management ============

async function getActiveSessionCount(email) {
	const result = await dbGet(
		"SELECT COUNT(*) as count FROM active_sessions WHERE email = ?",
		[email]
	);
	return result?.count || 0;
}

async function getActiveSessions(email) {
	return await dbAll(
		"SELECT session_token, device_info, created_at FROM active_sessions WHERE email = ? ORDER BY created_at DESC",
		[email]
	);
}

async function createSession(email, deviceInfo = null) {
	const sessionToken = generateSessionToken();

	await dbRun(
		"INSERT INTO active_sessions (email, session_token, device_info) VALUES (?, ?, ?)",
		[email, sessionToken, deviceInfo]
	);

	return sessionToken;
}

async function deleteSession(sessionToken) {
	const result = await dbRun(
		"DELETE FROM active_sessions WHERE session_token = ?",
		[sessionToken]
	);
	return result.changes > 0;
}

async function deleteSessionByEmail(email) {
	const result = await dbRun("DELETE FROM active_sessions WHERE email = ?", [
		email,
	]);
	return result.changes;
}

// ============ Main Controllers ============

const signIn = async (req, res) => {
	const {email, password, deviceInfo} = req.body;

	if (!email || !password) {
		return res.status(400).json({
			ok: false,
			error: "Missing email or password",
		});
	}

	try {
		const client = await getAuthClient();
		const spreadsheetId = process.env.SPREADSHEET_ID;
		const range = "allowed_emails!A:C"; // Email, Password, Seat Count

		const response = await sheets.spreadsheets.values.get({
			auth: client,
			spreadsheetId,
			range,
		});

		const rows = response.data.values || [];
		const normalizedEmail = email.trim().toLowerCase();

		// Find matching user
		let foundUser = null;

		for (const row of rows) {
			const rowEmail = (row[0] || "").trim().toLowerCase();
			const rowPassword = (row[1] || "").trim();
			const maxSeats = parseSeatCount(row[2]);

			if (rowEmail === normalizedEmail && rowPassword === password) {
				foundUser = {email: rowEmail, maxSeats};
				break;
			}
		}

		// Invalid credentials
		if (!foundUser) {
			console.log(`❌ Login failed for ${email}: Invalid credentials`);
			return res.json({
				ok: true,
				allowed: false,
				error: "Invalid email or password",
			});
		}

		// Check seat limit
		const activeSessionCount = await getActiveSessionCount(normalizedEmail);

		if (activeSessionCount >= foundUser.maxSeats) {
			console.log(
				`🚫 Login blocked for ${email}: ${activeSessionCount}/${foundUser.maxSeats} seats in use`
			);
			return res.json({
				ok: true,
				allowed: false,
				error: `You have reached your maximum of ${
					foundUser.maxSeats
				} allowed seat${
					foundUser.maxSeats > 1 ? "s" : ""
				}. Please log out from another device to continue.`,
				code: "SEAT_LIMIT_REACHED",
				activeSeats: activeSessionCount,
				maxSeats: foundUser.maxSeats,
			});
		}

		// Create session
		const sessionToken = await createSession(normalizedEmail, deviceInfo);

		console.log(
			`✅ Login successful for ${email} - Seat ${activeSessionCount + 1}/${
				foundUser.maxSeats
			}`
		);

		res.json({
			ok: true,
			allowed: true,
			sessionToken,
			activeSeats: activeSessionCount + 1,
			maxSeats: foundUser.maxSeats,
			email: normalizedEmail,
		});
	} catch (err) {
		console.error("Error during sign in:", err);
		res.status(500).json({ok: false, error: "Server error"});
	}
};

const signOut = async (req, res) => {
	const {sessionToken} = req.body;

	if (!sessionToken) {
		return res.status(400).json({
			ok: false,
			error: "Missing session token",
		});
	}

	try {
		// Get session info before deleting
		const session = await dbGet(
			"SELECT email FROM active_sessions WHERE session_token = ?",
			[sessionToken]
		);

		const deleted = await deleteSession(sessionToken);

		if (deleted) {
			console.log(`👋 Logout successful for ${session?.email}`);
		} else {
			console.log(`⚠️ Logout attempted with invalid token`);
		}

		res.json({
			ok: true,
			loggedOut: deleted,
		});
	} catch (err) {
		console.error("Error during sign out:", err);
		res.status(500).json({ok: false, error: "Server error"});
	}
};

const validateSession = async (req, res) => {
	const {sessionToken} = req.body;

	if (!sessionToken) {
		return res.status(400).json({
			ok: false,
			error: "Missing session token",
		});
	}

	try {
		const session = await dbGet(
			"SELECT email, created_at FROM active_sessions WHERE session_token = ?",
			[sessionToken]
		);

		res.json({
			ok: true,
			valid: session !== undefined,
			email: session?.email || null,
		});
	} catch (err) {
		console.error("Error validating session:", err);
		res.status(500).json({ok: false, error: "Server error"});
	}
};

const getUserSessions = async (req, res) => {
	const {sessionToken} = req.body;

	if (!sessionToken) {
		return res.status(400).json({
			ok: false,
			error: "Missing session token",
		});
	}

	try {
		// Verify the requesting session exists and get email
		const currentSession = await dbGet(
			"SELECT email FROM active_sessions WHERE session_token = ?",
			[sessionToken]
		);

		if (!currentSession) {
			return res.status(401).json({
				ok: false,
				error: "Invalid session",
			});
		}

		const sessions = await getActiveSessions(currentSession.email);

		// Mark which session is the current one
		const sessionsWithCurrent = sessions.map((s) => ({
			...s,
			isCurrent: s.session_token === sessionToken,
			session_token: undefined, // Don't expose full tokens
			tokenPreview: s.session_token.substring(0, 8) + "...",
		}));

		res.json({
			ok: true,
			email: currentSession.email,
			sessions: sessionsWithCurrent,
			count: sessions.length,
		});
	} catch (err) {
		console.error("Error getting user sessions:", err);
		res.status(500).json({ok: false, error: "Server error"});
	}
};

const logoutAllDevices = async (req, res) => {
	const {sessionToken, keepCurrent} = req.body;

	if (!sessionToken) {
		return res.status(400).json({
			ok: false,
			error: "Missing session token",
		});
	}

	try {
		// Verify the requesting session exists and get email
		const currentSession = await dbGet(
			"SELECT email FROM active_sessions WHERE session_token = ?",
			[sessionToken]
		);

		if (!currentSession) {
			return res.status(401).json({
				ok: false,
				error: "Invalid session",
			});
		}

		let removedCount;

		if (keepCurrent) {
			// Delete all sessions except current
			const result = await dbRun(
				"DELETE FROM active_sessions WHERE email = ? AND session_token != ?",
				[currentSession.email, sessionToken]
			);
			removedCount = result.changes;
		} else {
			// Delete all sessions including current
			removedCount = await deleteSessionByEmail(currentSession.email);
		}

		console.log(
			`🔄 Logout all devices for ${currentSession.email}: ${removedCount} session(s) removed`
		);

		res.json({
			ok: true,
			sessionsRemoved: removedCount,
			currentSessionActive: keepCurrent,
		});
	} catch (err) {
		console.error("Error during logout all:", err);
		res.status(500).json({ok: false, error: "Server error"});
	}
};

module.exports = {
	signIn,
	signOut,
	validateSession,
	getUserSessions,
	logoutAllDevices,
};
