const express = require("express");
const timeRouter = require("./routes/timeRoutes");

const prisma = require("./db/prisma"); //week 6

//Week 3
const userRouter = require("./routes/userRoutes");

//week 3
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");

//task routes
const taskRouter = require("./routes/taskRoutes");

//week 7
const analyticsRoutes = require("./routes/analyticsRoutes");

//week 8
const jwtMiddleware = require("./middleware/jwtMiddleware");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimiter = require("express-rate-limit");

//prior week 2
const app = express();

//week 8
app.set("trust proxy", 1);

// Rate limiting comes before any other app.use()
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);

// Security headers
app.use(helmet());

// Body and cookie parsers
app.use(express.json());
app.use(cookieParser());

// XSS protection must come after the parsers
app.use(xss());

app.use("/api", timeRouter);
app.use("/api/users", userRouter); //wk3

// JWT protection is inside taskRoutes
app.use("/api/tasks", taskRouter);

// Preserve authentication on Week 7 analytics routes
app.use("/api/analytics", jwtMiddleware, analyticsRoutes);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.post("/testpost", (req, res) => {
  res.status(200).json({
    message: "POST route works",
  });
});

//week 6
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({
      status: "error",
      db: "not connected",
      error: err.message,
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
  await prisma.$disconnect();
  console.log("Prisma disconnected");

  server.close(() => {
    console.log("Server closed.");
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = { app, server };