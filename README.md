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
