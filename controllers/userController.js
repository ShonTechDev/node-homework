//week4
const crypto = require("crypto");
const util = require("util");
const { userSchema } = require("../validation/userSchema");

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
async function register(req, res) {
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

  // Check whether this email is already registered
  const existingUser = global.users.find((user) => {
    return user.email === value.email;
  });

  if (existingUser) {
    return res.status(400).json({
      message: "A user with this email already exists.",
    });
  }

  // Hash the validated password
  const hashedPassword = await hashPassword(value.password);

  // Store the hash instead of the original password
  const newUser = {
    name: value.name,
    email: value.email,
    hashedPassword,
  };

  global.users.push(newUser);
  global.user_id = newUser;

  return res.status(201).json({
    name: newUser.name,
    email: newUser.email,
  });
}

async function logon(req, res) {
  const { email, password } = req.body;

  const matchingUser = global.users.find((user) => {
    return user.email === email;
  });

  const goodCredentials =
    matchingUser &&
    (await comparePassword(password, matchingUser.hashedPassword));

  if (!goodCredentials) {
    return res.sendStatus(401);
  }

  global.user_id = matchingUser;

  return res.status(200).json({
    name: matchingUser.name,
    email: matchingUser.email,
  });
}

function logoff (req, res) {
    global.user_id = null;

    return res.sendStatus(200);
}

module.exports = {
    register,
    logon,
    logoff,
};

