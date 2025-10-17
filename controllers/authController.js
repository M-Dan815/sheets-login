require("dotenv").config();
const { google } = require("googleapis");
const path = require("path");

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
const sheets = google.sheets("v4");

async function getAuthClient() {
  const keyFilePath = path.join(__dirname, "../service-account.json");
  
  const auth = new google.auth.GoogleAuth({
    keyFile: keyFilePath,
    scopes: SCOPES,
  });
  
  return await auth.getClient();
}

const signIn = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Missing email or password" });
  }

  try {
    const client = await getAuthClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const range = "allowed_emails!A:B"; // Get both email and password columns

    const response = await sheets.spreadsheets.values.get({
      auth: client,
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    
    // Find matching email and password
    const found = rows.some((row) => {
      const rowEmail = (row[0] || "").trim().toLowerCase();
      const rowPassword = (row[1] || "").trim();
      
      return (
        rowEmail === email.trim().toLowerCase() &&
        rowPassword === password
      );
    });

    console.log(`Email ${email} - Allowed: ${found}`);

    res.json({ ok: true, allowed: found });
  } catch (err) {
    console.error("Error during sign in:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
};

module.exports = { signIn };