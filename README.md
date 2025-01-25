CRM Backend Application

This is a backend application for a basic Customer Relationship Management (CRM) system. It is built using Node.js, Express.js, and SQLite, with authentication implemented using JWT.

Features

Customer Management: Create, read, update, and delete (CRUD) customer data.

User Authentication:

Register users with hashed passwords.

Login functionality with JWT-based authentication.

Search and Filtering:

Search customers by name, email, or phone.

Filter customers based on associated company.

Database Management: Uses Sequelize ORM with SQLite for data storage.

Error Handling: Proper validation and error messages with appropriate HTTP status codes.

Technologies Used

Node.js: Server-side JavaScript runtime.

Express.js: Web framework for Node.js.

Sequelize: ORM for SQLite.

SQLite: Lightweight SQL database.

JWT: For secure authentication.

bcryptjs: For password hashing.

Prerequisites

Node.js (v16 or later)

npm (comes with Node.js)

Installation

Clone the repository:

git clone <repository-url>
cd crm-backend

Install dependencies:

npm install

Set up the environment variables:

Create a .env file in the root directory and add the following:

PORT=3000
JWT_SECRET=your_secret_key



API Endpoints

User Authentication

### Register a New User
POST http://localhost:3000/register
Content-Type: application/json
{
  "username": "admin",
  "password": "admin123",
  "role": "admin"
}
### User Login
POST http://localhost:3000/login
Content-Type: application/json
{
  "username": "admin",
  "password": "admin123"
}

### Create a Customer
POST http://localhost:3000/customers
Content-Type: application/json
Authorization: Bearer {{jwtToken}}
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "1234567890",
  "company": "Acme Corp"
}
### Get All Customers
GET http://localhost:3000/customers?search=john&company=Acme
Authorization: Bearer {{jwtToken}}
### Update a Customer
PUT http://localhost:3000/customers/1
Content-Type: application/json
Authorization: Bearer {{jwtToken}}
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com",
  "phone": "9876543210",
  "company": "Acme Corp Updated"
}
### Delete a Customer
DELETE http://localhost:3000/customers/1
Authorization: Bearer {{jwtToken}}
### Unauthorized Test (Missing Token)
GET http://localhost:3000/customers
### Invalid Login Attempt
POST http://localhost:3000/login
Content-Type: application/json
{
  "username": "invalidUser",
  "password": "wrongpassword"
}
