//week4
const crypto = require("crypto");
const util = require("util");
const { userSchema } = require("../validation/userSchema");

//week5
const prisma = require("../db/prisma"); //week 6

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

  // Hash the validated password
  value.hashedPassword = await hashPassword(value.password);

  // Store the hash instead of the original password
  delete value.password;

  let user = null;

  try {
    user = await prisma.user.create({
      data: {
        name: value.name,
        email: value.email,
        hashedPassword: value.hashedPassword,
      },
      select: {
        name: true,
        email: true,
        id: true,
      },
    });
  } catch (err) {
    if (
      err.name === "PrismaClientKnownRequestError" &&
      err.code === "P2002"
    ) {
      return res.status(400).json({
        message: "A user with this email already exists.",
      });
    } else {
      return next(err);
    }
  }

  global.user_id = user.id;

  return res.status(201).json({
    name: user.name,
    email: user.email,
  });
}

async function logon(req, res, next) {
  let { email, password } = req.body;

  try {
    // Find the registered user by email
    email = email.toLowerCase();

    const matchingUser = await prisma.user.findUnique({
      where: { email },
    });

    const goodCredentials =
      matchingUser &&
      (await comparePassword(password, matchingUser.hashedPassword));

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