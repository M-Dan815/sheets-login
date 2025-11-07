const express = require("express");
const router = express.Router();
const {requestDemo, giveFeedback} = require("../controllers/emailControllers");

router.post("/request-demo", requestDemo);
router.post("/give-feedback", giveFeedback);

module.exports = router;
