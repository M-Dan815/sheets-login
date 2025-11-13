// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
const databaseRoutes = require("./routes/databaseRoutes");
const emailRoutes = require("./routes/emailRoutes");

const app = express();
app.use(bodyParser.json());
app.use(
	cors({
		origin: [
			"http://localhost:5173", // Vite default port
			"http://codepark.net", // production domain (if applicable)
		],
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);

app.use(express.json());
app.use("/api", authRoutes);
app.use("/api", databaseRoutes);
app.use("/api", emailRoutes);

app.listen(3000, () => console.log("listening on 3000"));
