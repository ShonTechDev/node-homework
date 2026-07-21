//set up POST /register, POST /logon, POST /logoff

const express = require("express"); //import/initiate express
const userController = require("../controllers/userController"); //import the controller

const router = express.Router(); //create the router

//set up the 3 post routes
router.post("/register", userController.register);
router.post("/logon", userController.logon);
router.post("/logoff", userController.logoff);

module.exports = router;