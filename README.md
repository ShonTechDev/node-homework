# Node Task Management API
A deployed task-management backend application built with Node.js, Express, Prisma, and PostgreSQL.
The application provides authenticated users with REST API endpoints for creating, reading, updating, and deleting
their own tasks. It also includes authentication, authorization, validation, security protections, database
persistence, automated testing, and cloud deployment.

A provided React frontend was used as a client for testing the deployed backend.

## Deployed Backend
https://node-homework-g51m.onrender.com

Health check:
```text
GET /health
```
## Tech Stack
### Backend
- Node.js
- Express
- JavaScript
- Prisma ORM
- PostgreSQL
- Neon PostgreSQL
- Render

### Authentication and Security
- JSON Web Tokens (JWT)
- HttpOnly authentication cookies
- CSRF token protection
- Password hashing with Node's `crypto` module
- Joi request validation
- Helmet
- Express Rate Limit
- XSS sanitization
- reCAPTCHA protection for registration
- User-based authorization for task data

### Testing
- Jest
- Supertest
- Postman

## Features
### User Authentication
The API supports:
- User registration
- User logon
- User logoff
- JWT-based authentication
- Protected task routes

The JWT used for authentication is stored in an HttpOnly cookie. State-changing requests such as POST, PATCH, and DELETE
also require CSRF protection.

### Task CRUD Operations
Authenticated users can:
- Create tasks
- View their tasks
- View an individual task
- Update tasks
- Delete tasks

Task operations are limited to the authenticated user's records so users cannot access or modify another user's tasks.

### Task Fields
Tasks include:
- Title
- Completion status
- Priority
- Creation date

### Pagination and Search
The task index endpoint supports pagination and title searching.
Example:
```text
GET /api/tasks?page=1&limit=10
```
Search example:
```text
GET /api/tasks?find=meeting&page=1&limit=10
```
### Bulk Task Creation
Multiple tasks can be created in a single request.
```text
POST /api/tasks/bulk
```

### Updating Many Records with a Single Operation
The final project enhancement adds the ability to update multiple matching tasks with one API request using Prisma's
`updateMany()` method.

Example:
```text
PATCH /api/tasks?isCompleted=false
```

Request body:
```json
{
 "isCompleted": true
}
```
This request finds incomplete tasks belonging to the authenticated user and marks them complete in a single database
operation.
Example response:
```json
{
 "message": "Tasks updated successfully.",
 "tasksUpdated": 3
}
```
The query includes the authenticated user's ID so the operation cannot update another user's tasks.
## API Routes
### Users
```text
POST /api/users/register
POST /api/users/logon
POST /api/users/logoff
```
### Tasks
```text
POST /api/tasks
GET /api/tasks
GET /api/tasks/:id
PATCH /api/tasks/:id
DELETE /api/tasks/:id
POST /api/tasks/bulk
PATCH /api/tasks?isCompleted=true|false
```
### Health Check
```text
GET /health
```
## Local Setup
### Prerequisites
Install:
- Node.js
- npm
- PostgreSQL or access to a PostgreSQL database
- Git

### 1. Clone the repository
```bash
git clone https://github.com/ShonTechDev/node-homework.git
cd node-homework
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create an environment file
Create a `.env` file in the project root.
Do not commit `.env` to GitHub.
The application uses environment variables including:
```text
DATABASE_URL=
JWT_SECRET=
RECAPTCHA_SECRET=
RECAPTCHA_BYPASS=
```
`DATABASE_URL` should contain a valid PostgreSQL connection string.
`JWT_SECRET` should contain a private value used to sign authentication tokens.
`RECAPTCHA_SECRET` should contain the private server-side reCAPTCHA secret.
`RECAPTCHA_BYPASS` is used only for authorized testing and should not be exposed publicly.
Never commit real passwords, database credentials, JWT secrets, reCAPTCHA secrets, tokens, or other private values to
the repository.

### 4. Apply Prisma migrations
```bash
npx prisma migrate deploy
```

### 5. Start the application
```bash
npm start
```
The server runs locally at:
```text
http://localhost:3000
```
## Development
To run the server with Nodemon:
```bash
npm run dev
```
## Testing
Run the automated test suite with:
```bash
npm run test
```
The application was also tested manually with Postman against both the local server and the deployed Render service.
Testing included:
- Registration and logon
- Protected routes
- Task creation
- Task retrieval
- Task updates
- Task deletion
- CSRF protection
- User data isolation
- Multi-record updates
- Production database persistence

## Deployment
The backend is deployed on Render and connected to a Neon PostgreSQL database.
Production deployment uses the `main` branch.
Prisma migrations are applied during deployment so the production database schema remains synchronized with the
application.

## Project Structure
```text
node-homework/
|-- app.js
|-- controllers/
|-- db/
|-- middleware/
|-- prisma/
|-- routes/
|-- test/
|-- validation/
|-- project-summary.txt
|-- package.json
`-- README.md
```

## Final Project Enhancement
For the final project, I implemented **Updating Many Records with a Single Operation**.

The enhancement uses Prisma `updateMany()` with an `isCompleted` query parameter and the authenticated user's ID. 
This allows several matching task records to be updated efficiently while preserving user authorization boundaries. 

Additional API details are documented in `project-summary.txt`.

## Future Improvements
Possible future improvements include:
- A backend endpoint that calculates task completion progress
- A frontend progress bar that displays that completion data
- Additional task organization features
- Expanded automated testing
- API documentation with OpenAPI/Swagger

## About This Project
This project was developed throughout Code the Dream's Node/Express course and progressively expanded to include REST
APIs, PostgreSQL, Prisma, authentication, authorization, security, testing, and cloud deployment.

## License
MIT