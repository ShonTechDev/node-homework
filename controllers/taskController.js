//week5
const pool = require("../db/pg-pool");

const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

// PostgreSQL now creates each task ID automatically

//controller functions
async function create(req, res) {
  if (!req.body) {
    req.body = {};
  }

  const { error, value } = taskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  // Store the task in PostgreSQL for the logged-in user
  const task = await pool.query(
    `INSERT INTO tasks (title, is_completed, user_id)
     VALUES ($1, $2, $3)
     RETURNING id, title, is_completed`,
    [value.title, value.isCompleted, global.user_id]
  );

  return res.status(201).json(task.rows[0]);
}

async function index(req, res) {
  // Find only tasks owned by the logged-in user
  const tasks = await pool.query(
    `SELECT id, title, is_completed
     FROM tasks
     WHERE user_id = $1`,
    [global.user_id]
  );

  // Return 404 when this user has no tasks
  if (tasks.rows.length === 0) {
    return res.status(404).json({
      message: "No tasks found.",
    });
  }

  // user_id was not selected, so it is not included in the response
  return res.status(200).json(tasks.rows);
}

async function show(req, res) {
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  // Find the task only when it belongs to the logged-in user
  const task = await pool.query(
    `SELECT id, title, is_completed
     FROM tasks
     WHERE id = $1 AND user_id = $2`,
    [taskId, global.user_id]
  );

  if (task.rows.length === 0) {
    return res.status(404).json({
      message: "Task not found.",
    });
  }

  return res.status(200).json(task.rows[0]);
}

async function update(req, res) {
  if (!req.body) {
    req.body = {};
  }

  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  // Convert the JavaScript isCompleted name to the SQL is_completed name
  const taskChange = value;
  let keys = Object.keys(taskChange);

  keys = keys.map((key) =>
    key === "isCompleted" ? "is_completed" : key
  );

  const setClauses = keys
    .map((key, index) => `${key} = $${index + 1}`)
    .join(", ");

  const idParm = `$${keys.length + 1}`;
  const userParm = `$${keys.length + 2}`;

  // Update only a task owned by the logged-in user
  const updatedTask = await pool.query(
    `UPDATE tasks
     SET ${setClauses}
     WHERE id = ${idParm} AND user_id = ${userParm}
     RETURNING id, title, is_completed`,
    [...Object.values(taskChange), taskId, global.user_id]
  );

  if (updatedTask.rows.length === 0) {
    return res.status(404).json({
      message: "Task not found.",
    });
  }

  return res.status(200).json(updatedTask.rows[0]);
}

async function deleteTask(req, res) {
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  // Delete only a task owned by the logged-in user
  const deletedTask = await pool.query(
    `DELETE FROM tasks
     WHERE id = $1 AND user_id = $2
     RETURNING id, title, is_completed`,
    [taskId, global.user_id]
  );

  if (deletedTask.rows.length === 0) {
    return res.status(404).json({
      message: "Task not found.",
    });
  }

  return res.status(200).json(deletedTask.rows[0]);
}

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
};