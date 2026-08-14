//week4
const crypto = require("crypto");
const util = require("util");
const { userSchema } = require("../validation/userSchema");

//week5
const pool = require("../db/pg-pool");

const scrypt = util.promisify(crypto.scrypt);

//week4
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);

  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);

  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

//export the three given functions register, logon, logoff
async function register(req, res, next) {
  // Make sure Joi receives an object
  if (!req.body) {
    req.body = {};
  }

  // Validate and clean the submitted user information
  const { error, value } = userSchema.validate(req.body, {
    abortEarly: false,
  });

  // Stop if the submitted information is invalid
  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  try {
    // Hash the validated password
    value.hashed_password = await hashPassword(value.password);

    // Store the hash instead of the original password
    const result = await pool.query(
      `INSERT INTO users (email, name, hashed_password)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [value.email, value.name, value.hashed_password]
    );

    global.user_id = result.rows[0].id;

    return res.status(201).json({
      name: result.rows[0].name,
      email: result.rows[0].email,
    });
  } catch (e) {
    // PostgreSQL error code for a duplicate unique value
    if (e.code === "23505") {
      return res.status(400).json({
        message: "A user with this email already exists.",
      });
    }

    return next(e);
  }
}

async function logon(req, res, next) {
  const { email, password } = req.body;

  try {
    // Find the registered user by email
    const result = await pool.query(
      `SELECT id, email, name, hashed_password
       FROM users
       WHERE email = $1`,
      [email]
    );

    const matchingUser = result.rows[0];

    const goodCredentials =
      matchingUser &&
      (await comparePassword(password, matchingUser.hashed_password));

    if (!goodCredentials) {
      return res.sendStatus(401);
    }

    global.user_id = matchingUser.id;

    return res.status(200).json({
      name: matchingUser.name,
      email: matchingUser.email,
    });
  } catch (e) {
    return next(e);
  }
}

function logoff(req, res) {
  global.user_id = null;

  return res.sendStatus(200);
}

module.exports = {
  register,
  logon,
  logoff,
};