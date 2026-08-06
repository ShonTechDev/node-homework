const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
});

module.exports = pool;