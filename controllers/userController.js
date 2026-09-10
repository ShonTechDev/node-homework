//week4
const crypto = require("crypto");
const util = require("util");
const { userSchema } = require("../validation/userSchema");

//week5
const prisma = require("../db/prisma"); //week 6

//week8
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

const scrypt = util.promisify(crypto.scrypt);

//week8
const cookieFlags = (req) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only when HTTPS is available
    sameSite: "Strict",
  };
};

const setJwtCookie = (req, res, user) => {
  // Sign JWT
  const payload = { id: user.id, csrfToken: randomUUID() };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiration

  // Set cookie
  res.cookie("jwt", token, {
    ...cookieFlags(req),
    maxAge: 3600000,
  });

  return payload.csrfToken;
};

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

  let isPerson = false;
  if (req.body.recaptchaToken) {
    const token = req.body.recaptchaToken;
    const params = new URLSearchParams();
    params.append("secret", process.env.RECAPTCHA_SECRET);
    params.append("response", token);
    params.append("remoteip", req.ip);
    const response = await fetch(
      // might throw an error that would cause a 500 from the error handler
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        body: params.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    const data = await response.json();
    if (data.success) isPerson = true;
    delete req.body.recaptchaToken;
  } else if (
    process.env.RECAPTCHA_BYPASS &&
    req.get("X-Recaptcha-Test") === process.env.RECAPTCHA_BYPASS
  ) {
    // might be a test environment
    isPerson = true;
  }
  if (!isPerson) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Bot verification failed. Please complete the reCAPTCHA." });
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

  const email = value.email;
  const name = value.name;
  const hashedPassword = value.hashedPassword;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create user account
      const newUser = await tx.user.create({
        data: {
          email,
          name,
          hashedPassword,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      // Create 3 welcome tasks using createMany
      const welcomeTaskData = [
        {
          title: "Complete your profile",
          userId: newUser.id,
          priority: "medium",
        },
        {
          title: "Add your first task",
          userId: newUser.id,
          priority: "high",
        },
        {
          title: "Explore the app",
          userId: newUser.id,
          priority: "low",
        },
      ];

      await tx.task.createMany({
        data: welcomeTaskData,
      });

      // Fetch the created tasks
      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: {
            in: welcomeTaskData.map((t) => t.title),
          },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true,
        },
      });

      return {
        user: newUser,
        welcomeTasks,
      };
    });

    // Create the JWT and store it in the cookie
    const csrfToken = setJwtCookie(req, res, result.user);

    return res.status(201).json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
      csrfToken,
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({
        error: "Email already registered",
      });
    } else {
      return next(err);
    }
  }
}

async function logon(req, res, next) {
  let { email, password } = req.body;

  try {
    // Find the registered user by email
    email = email.toLowerCase();

    const matchingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        hashedPassword: true,
      },
    });

    const goodCredentials =
      matchingUser &&
      (await comparePassword(password, matchingUser.hashedPassword));

    if (!goodCredentials) {
      return res.sendStatus(401);
    }

    // Create the JWT and store it in the cookie
    const csrfToken = setJwtCookie(req, res, matchingUser);

    return res.status(200).json({
      name: matchingUser.name,
      email: matchingUser.email,
      csrfToken,
    });
  } catch (e) {
    return next(e);
  }
}

function logoff(req, res) {
  res.clearCookie("jwt", cookieFlags(req));

  return res.sendStatus(200);
}

module.exports = {
  register,
  logon,
  logoff,
};