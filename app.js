const express = require("express");
const timeRouter = require("./routes/timeRoutes");

//Week 3
const userRouter = require("./routes/userRoutes");
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");

//week4//requiring the auth middleware and task router
const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routes/taskRoutes");


//prior week 2
const app = express();

//week 3
global.user_id = null;
global.users = [];
global.tasks = [];

app.use(express.json());

app.use("/api", timeRouter);
app.use("/api/users", userRouter); //wk3
app.use("/api/tasks", authMiddleware, taskRouter); //wk4//after the user router is mounted

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.post("/testpost", (req, res) => {
  res.status(200).json({
    message: "POST route works",
  });
});

app.use(notFound); //added not-found middleware after routes
app.use(errorHandler); //added error-handler middleware last

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

module.exports = { app, server };