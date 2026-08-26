const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma"); //week6

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

  const task = await prisma.task.create({
    data: {
      title: value.title,
      isCompleted: value.isCompleted,
      priority: value.priority,
      userId: req.user.id,
    },
    select: {
      title: true,
      isCompleted: true,
      priority: true,
      id: true,
    },
  });

  return res.status(201).json(task);
}

async function index(req, res) {
  const query = req.query || {};

  const page =
    query.page === undefined ? 1 : parseInt(query.page);

  const limit =
    query.limit === undefined ? 10 : parseInt(query.limit);

  // Validate pagination parameters
  if (
    Number.isNaN(page) ||
    page < 1 ||
    Number.isNaN(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    return res.status(400).json({
      error: "Invalid pagination parameters",
    });
  }

  const skip = (page - 1) * limit;

  // Build where clause with optional search filter
  const whereClause = {
    userId: req.user.id,
  };

  if (query.find) {
    whereClause.title = {
      contains: query.find,
      mode: "insensitive",
    };
  }

  // Get tasks with pagination, search, and eager loading
  const tasks = await prisma.task.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      User: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    skip: skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get total count using the same search filter
  const totalTasks = await prisma.task.count({
    where: whereClause,
  });

  if (tasks.length === 0) {
    return res.status(404).json({
      message: "No tasks found.",
    });
  }

  // Build pagination metadata
  const pagination = {
    page,
    limit,
    total: totalTasks,
    pages: Math.ceil(totalTasks / limit),
    hasNext: page * limit < totalTasks,
    hasPrev: page > 1,
  };

  return res.status(200).json({
    tasks,
    pagination,
  });
}

async function show(req, res, next) {
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  try {
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
        userId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    return res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        message: "Task not found.",
      });
    } else {
      return next(err);
    }
  }
}

async function update(req, res, next) {
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

  const id = parseInt(req.params?.id);

  if (!id) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  try {
    const task = await prisma.task.update({
      data: value,
      where: {
        id,
        userId: req.user.id,
      },
      select: {
        title: true,
        isCompleted: true,
        id: true,
        priority: true,
      },
    });

    return res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        message: "The task was not found.",
      });
    } else {
      return next(err);
    }
  }
}

async function deleteTask(req, res, next) {
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  try {
    const deletedTask = await prisma.task.delete({
      where: {
        id: taskId,
        userId: req.user.id,
      },
      select: {
        title: true,
        isCompleted: true,
        id: true,
      },
    });

    return res.status(200).json(deletedTask);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        message: "Task not found.",
      });
    } else {
      return next(err);
    }
  }
}

// Bulk create tasks
async function bulkCreate(req, res, next) {
  if (!req.body) {
    req.body = {};
  }

  const { tasks } = req.body;

  // Validate the tasks array
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Invalid request data. Expected an array of tasks.",
    });
  }

  // Validate all tasks before inserting anything
  const validTasks = [];

  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }

    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || "medium",
      userId: req.user.id,
    });
  }

  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });

    return res.status(201).json({
      message: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
  bulkCreate,
};