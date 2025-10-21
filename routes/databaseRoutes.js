const router = require("express").Router();
const databaseControllers = require("../controllers/databaseControllers");
// Search endpoint
router.post("/crm/search", databaseControllers.search);

module.exports = router;
