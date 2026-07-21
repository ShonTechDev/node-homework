const express = require("express");
const { randomUUID } = require("crypto"); //crypto import
const dogsRouter = require("./routes/dogs");

const app = express();

//Request-Id middleware (create a request ID)
app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

//logging middleware (log the request using above ID)
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}]: ${req.method} ${req.path} (${req.requestId})`
  );

  next();
});

// Assignment 3b and 3c ask you to add middleware in this file.

app.use(express.json());
app.use(express.static("week-3-middleware/public"));

//dog routes
app.use("/", dogsRouter); // Do not remove this line

app.use((req, res) => {
  return res.status(404).json({
    error: "Route not found",
    requestId: req.requestId,
  });
});

app.use((err, req, res, next) => {
  return res.status(500).json({
    error: "Internal Server Error",
    requestId: req.requestId,
  });
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Dog rescue app is listening on port 3000...");
  });
}

module.exports = app;

