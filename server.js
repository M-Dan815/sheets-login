// server.js
require('dotenv').config();
const express = require('express');
const cors = require("cors")
const authRoutes = require("./routes/authRoutes")

const app = express();
app.use(cors({origin: true}))
app.use(express.json());
app.use("/api", authRoutes)



app.listen(3000, () => console.log('listening on 3000'));
