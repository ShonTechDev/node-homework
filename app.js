const express = require("express");
const timeRouter = require("./routes/timeRoutes");
//week 5
const pool = require("./db/pg-pool");

//Week 3
const userRouter = require("./routes/userRoutes");

//week 3
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");

//week4//requiring the auth middleware and task router
const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routes/taskRoutes");


//prior week 2
const app = express();

//week 3
global.user_id = null; //tracks logged in user

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

//week 5
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({
      message: `db not connected, error: ${err.message}`,
    });
  }
});

app.use(notFound); //added not-found middleware after routes
app.use(errorHandler); //added error-handler middleware last

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

//closes neon database connections when the server stops
// & prevents Node from hanging

const shutdown = async () => { 
  await pool.end();

  server.close(() => {
    console.log("Server closed.");
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = { app, server };