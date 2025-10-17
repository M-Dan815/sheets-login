const Router = require("express").Router();
const authControllers = require("../controllers/authController")

Router.post("/login", authControllers.signIn);

module.exports = Router;