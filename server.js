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
app.use(cors({origin: true}));
app.use(express.json());
app.use("/api", authRoutes);
app.use("/api", databaseRoutes);
app.use("/api", emailRoutes);

app.listen(3000, () => console.log("listening on 3000"));
