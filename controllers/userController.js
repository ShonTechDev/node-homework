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

      // Fetch the created tasks to return them
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

    // Store the user ID globally for session management
    global.user_id = result.user.id;

    // Send response with status 201
    res.status(201);
    res.json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
    });
    return;
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