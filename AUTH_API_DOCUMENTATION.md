# Authentication API Documentation

## Overview
JWT-based authentication system for the Client Portal API. Provides registration, login, logout, and user management endpoints.

## Endpoints

### 1. Register New Tenant
**POST** `/api/v1/auth/register`

**Request Body:**
```json
{
  "name": "Company Name",
  "email": "user@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Tenant registered successfully",
  "data": {
    "token": "jwt_token_here",
    "tenant": {
      "id": "tenant_id",
      "name": "Company Name",
      "email": "user@example.com",
      "phone": "+1234567890",
      "isActive": true
    }
  }
}
```

### 2. Login
**POST** `/api/v1/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "tenant": {
      "id": "tenant_id",
      "name": "Company Name",
      "email": "user@example.com",
      "phone": "+1234567890",
      "isActive": true
    }
  }
}
```

### 3. Logout
**POST** `/api/v1/auth/logout`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### 4. Get Current User
**GET** `/api/v1/auth/me`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "tenant_id",
    "name": "Company Name",
    "email": "user@example.com",
    "phone": "+1234567890",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. Update User Details
**PUT** `/api/v1/auth/updatedetails`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Updated Company Name",
  "email": "newemail@example.com",
  "phone": "+1234567890"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "tenant_id",
    "name": "Updated Company Name",
    "email": "newemail@example.com",
    "phone": "+1234567890",
    "isActive": true
  }
}
```

### 6. Update Password
**PUT** `/api/v1/auth/updatepassword`

**Headers Required:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password updated successfully",
  "data": {
    "token": "new_jwt_token_here"
  }
}
```

## Environment Variables

Add these to your `.env` file:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
```

## Using the Token

After successful login/register, you'll receive a JWT token. Include this token in all protected routes:

```
Authorization: Bearer <your_jwt_token>
```

## Protection Middleware

To protect any route, use the `protect` middleware:

```javascript
const { protect } = require('../middlewares/auth');

router.get('/protected-route', protect, yourControllerFunction);
```

This middleware will:
- Verify the JWT token
- Check if the tenant exists and is active
- Attach the tenant object to `req.tenant`
- Return 401 if unauthorized

## Error Responses

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation error message"
}
```

## Security Features

1. **Password Hashing**: Passwords are automatically hashed using bcrypt before saving
2. **Password Exclusion**: Password is excluded from JSON responses
3. **Token Expiration**: Tokens expire after 30 days (configurable)
4. **Active Check**: Inactive accounts cannot authenticate
5. **Validation**: All inputs are validated using Joi schemas

