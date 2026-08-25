//connecting each route to task controller function

const express = require("express");

const taskController = require("../controllers/taskController");
const jwtMiddleware = require("../middleware/jwtMiddleware");

const router = express.Router();

// Protect all task routes with JWT authentication
router.use(jwtMiddleware);

//relative to /api/tasks

router.post("/", taskController.create);

router.get("/", taskController.index);

router.post("/bulk", taskController.bulkCreate);

router.get("/:id", taskController.show);

router.patch("/:id", taskController.update);

router.delete("/:id", taskController.deleteTask);

module.exports = router;