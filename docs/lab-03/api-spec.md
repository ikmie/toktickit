# TokTickIT REST API Specification - Lab 03

## 1. Overview, Security & Protocol Conventions

### 1.1 Base URL
All API endpoints are mounted under `/api`.

### 1.2 Authentication & Authorization Headers
- **Header**: `Authorization: Bearer <token>`
- The token is a signed JWT containing user payload (`id`, `email`, `role`, `name`, `mustChangePassword`).
- The server validates the token on all protected routes and attaches `req.user`.
- If no token is supplied or token is invalid/expired, the server responds with `401 Unauthorized`.
- If an authenticated user's role is not permitted for the requested route, the server responds with `403 Forbidden`.

### 1.3 Safe Error & Security Philosophy
- Endpoints never leak confidential internal data.
- Requesters attempting to access internal notes receive `403 Forbidden` with a generic message `"Access denied"`.
- Requests for tickets not owned by the requester receive `403 Forbidden` or `404 Not Found`.
- Account inactivity returns `403 Forbidden` with message `"Account is inactive"`.

---

## 2. Authentication Endpoints

### 2.1 `POST /api/auth/login`
- **Description**: Authenticate user credentials and return session token.
- **Request Body**:
```json
{
  "email": "jennifer.a@kmutt.ac.th",
  "password": "Password123!"
}
```
- **Response 200 OK**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5c...",
  "user": {
    "id": 1,
    "name": "Jennifer Anderson",
    "email": "jennifer.a@kmutt.ac.th",
    "role": "REQUESTER",
    "mustChangePassword": false,
    "isActive": true
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Missing email or password.
  - `401 Unauthorized`: Invalid email or password.
  - `403 Forbidden`: Account is inactive (`isActive === false`).

### 2.2 `POST /api/auth/logout`
- **Description**: Invalidate authenticated session on client.
- **Headers**: `Authorization: Bearer <token>`
- **Response 200 OK**:
```json
{
  "message": "Logged out successfully"
}
```

### 2.3 `GET /api/auth/me`
- **Description**: Retrieve currently authenticated user profile.
- **Headers**: `Authorization: Bearer <token>`
- **Response 200 OK**:
```json
{
  "id": 1,
  "name": "Jennifer Anderson",
  "email": "jennifer.a@kmutt.ac.th",
  "role": "REQUESTER",
  "mustChangePassword": false,
  "isActive": true
}
```

### 2.4 `POST /api/auth/change-password`
- **Description**: Mandatory or optional password change for authenticated user.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "currentPassword": "InitialPassword123!",
  "newPassword": "MyNewSecurePassword88#"
}
```
- **Response 200 OK**:
```json
{
  "message": "Password changed successfully",
  "mustChangePassword": false
}
```
- **Error Responses**:
  - `400 Bad Request`: New password does not meet security requirements (min 8 chars, uppercase, lowercase, number, special char).
  - `401 Unauthorized`: Current password does not match.

---

## 3. Requester Ticket & Attachment Endpoints

### 3.1 `POST /api/tickets`
- **Description**: Create ticket for authenticated requester.
- **Headers**: `Authorization: Bearer <token>` (Role: `REQUESTER`)
- **Request Body**:
```json
{
  "categoryId": 1,
  "relatedSystemId": 1,
  "summary": "Cannot access campus WiFi",
  "description": "WiFi disconnects continuously in CB2 building.",
  "requestedPriority": "HIGH"
}
```
- **Response 201 Created**:
```json
{
  "id": 101,
  "ticketNumber": "TKT-2026-000101",
  "requesterId": 1,
  "categoryId": 1,
  "relatedSystemId": 1,
  "summary": "Cannot access campus WiFi",
  "description": "WiFi disconnects continuously in CB2 building.",
  "requestedPriority": "HIGH",
  "itPriority": "HIGH",
  "currentStatus": "NEW",
  "problemResolvedIndicated": false,
  "ticketDate": "2026-09-12T01:30:00.000Z"
}
```

### 3.2 `GET /api/tickets`
- **Description**: Paginated list of tickets owned by authenticated requester.
- **Headers**: `Authorization: Bearer <token>` (Role: `REQUESTER`)
- **Query Parameters**: `search`, `categoryId`, `requestedPriority`, `currentStatus`, `page`, `limit`
- **Response 200 OK**:
```json
{
  "data": [
    {
      "id": 101,
      "ticketNumber": "TKT-2026-000101",
      "summary": "Cannot access campus WiFi",
      "requestedPriority": "HIGH",
      "itPriority": "HIGH",
      "currentStatus": "NEW",
      "ticketDate": "2026-09-12T01:30:00.000Z",
      "category": { "name": "Network" }
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
}
```

### 3.3 `GET /api/tickets/:id`
- **Description**: Retrieve owned ticket detail.
- **Headers**: `Authorization: Bearer <token>` (Role: `REQUESTER`)
- **Error Responses**: `403 Forbidden` if ticket belongs to another requester.

### 3.4 `POST /api/tickets/:id/resolve-indication`
- **Description**: Requester indicates that problem appears resolved.
- **Headers**: `Authorization: Bearer <token>` (Role: `REQUESTER`, must own ticket)
- **Response 200 OK**:
```json
{
  "id": 101,
  "problemResolvedIndicated": true,
  "message": "Problem resolution indicated. IT Staff has been notified."
}
```

---

## 4. Comments & Internal Notes Endpoints

### 4.1 `GET /api/tickets/:id/comments`
- **Description**: Retrieve public comments on a ticket.
- **Headers**: `Authorization: Bearer <token>`
- **Authorization**: Owning Requester, any IT Staff, or Administrator.
- **Response 200 OK**:
```json
[
  {
    "id": 1,
    "ticketId": 101,
    "content": "We are looking into the CB2 access point.",
    "createdAt": "2026-09-12T02:00:00.000Z",
    "author": {
      "id": 2,
      "name": "Michael Brown",
      "role": "IT_STAFF"
    }
  }
]
```

### 4.2 `POST /api/tickets/:id/comments`
- **Description**: Post public comment on a ticket.
- **Headers**: `Authorization: Bearer <token>`
- **Authorization**: Owning Requester, any IT Staff, or Administrator.
- **Request Body**:
```json
{
  "content": "Thank you for the quick response!"
}
```
- **Response 201 Created**: Returns created comment object.

### 4.3 `GET /api/tickets/:id/notes`
- **Description**: Retrieve confidential internal notes on a ticket.
- **Headers**: `Authorization: Bearer <token>`
- **Authorization**: **IT Staff or Administrator ONLY**.
- **Error Responses**:
  - `403 Forbidden`: Requester receives 403 without any note content.
- **Response 200 OK**:
```json
[
  {
    "id": 1,
    "ticketId": 101,
    "content": "Switch port 12 on switch sw-cb2-01 was flapping.",
    "createdAt": "2026-09-12T02:05:00.000Z",
    "author": {
      "id": 2,
      "name": "Michael Brown",
      "role": "IT_STAFF"
    }
  }
]
```

### 4.4 `POST /api/tickets/:id/notes`
- **Description**: Post confidential internal note.
- **Headers**: `Authorization: Bearer <token>`
- **Authorization**: **IT Staff or Administrator ONLY**.
- **Request Body**:
```json
{
  "content": "Replaced patch cable, waiting for telemetry confirmation."
}
```
- **Response 201 Created**: Returns created internal note object.

---

## 5. IT Staff Queue & Operations Endpoints

### 5.1 `GET /api/staff/tickets`
- **Description**: Shared IT Staff Queue with search, multi-filter, sort, and pagination.
- **Headers**: `Authorization: Bearer <token>` (Role: `IT_STAFF` or `ADMIN`)
- **Query Parameters**:
  - `search`: Searches Ticket Number and Summary.
  - `categoryId`: Filter by category ID.
  - `itPriority`: Filter by IT Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  - `currentStatus`: Filter by status (`NEW`, `OPEN`, `IN_PROGRESS`, etc.).
  - `ownership`: `all`, `unassigned`, or `assignedToMe`.
  - `sortBy`: `ticketDate`, `ticketNumber`, `itPriority`, `currentStatus`, `updatedAt`.
  - `sortOrder`: `asc` or `desc` (default `desc`).
  - `page`: Page index (default 1).
  - `limit`: Page size (default 10).
- **Response 200 OK**:
```json
{
  "data": [
    {
      "id": 101,
      "ticketNumber": "TKT-2026-000101",
      "summary": "Cannot access campus WiFi",
      "requestedPriority": "HIGH",
      "itPriority": "HIGH",
      "currentStatus": "IN_PROGRESS",
      "ticketDate": "2026-09-12T01:30:00.000Z",
      "category": { "name": "Network" },
      "requester": { "id": 1, "name": "Jennifer Anderson", "email": "jennifer.a@kmutt.ac.th" },
      "owner": { "id": 2, "name": "Michael Brown", "email": "michael.b@kmutt.ac.th" },
      "problemResolvedIndicated": false
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
}
```

### 5.2 `GET /api/staff/tickets/:id`
- **Description**: Retrieve comprehensive ticket detail for IT Staff including requester details, owner details, attachments, comments count, and notes count.
- **Headers**: `Authorization: Bearer <token>` (Role: `IT_STAFF` or `ADMIN`)

### 5.3 `PATCH /api/staff/tickets/:id/assign`
- **Description**: Claim ticket or reassign ownership.
- **Headers**: `Authorization: Bearer <token>` (Role: `IT_STAFF` or `ADMIN`)
- **Request Body**:
```json
{
  "ownerId": 2
}
```
*(Passing `ownerId = null` unassigns the ticket).*
- **Response 200 OK**: Updated ticket with new owner.

### 5.4 `PATCH /api/staff/tickets/:id/priority`
- **Description**: Update operational IT Priority.
- **Headers**: `Authorization: Bearer <token>` (Role: `IT_STAFF` or `ADMIN`)
- **Request Body**:
```json
{
  "itPriority": "URGENT"
}
```
- **Response 200 OK**: Updated ticket.

### 5.5 `PATCH /api/staff/tickets/:id/status`
- **Description**: Update ticket lifecycle status according to transition rules.
- **Headers**: `Authorization: Bearer <token>` (Role: `IT_STAFF` or `ADMIN`)
- **Request Body**:
```json
{
  "status": "RESOLVED",
  "resolutionSummary": "Configured switch port duplex to auto; connection stable."
}
```
- **Error Responses**:
  - `400 Bad Request`: Disallowed status transition according to `BR-14`.

### 5.6 `GET /api/staff/assignees`
- **Description**: Retrieve active IT Staff and Administrators eligible for ticket assignment.
- **Headers**: `Authorization: Bearer <token>` (Role: `IT_STAFF` or `ADMIN`)
- **Response 200 OK**: List of active staff users (`id`, `name`, `email`, `role`).

---

## 6. Administrator User Management Endpoints

### 6.1 `GET /api/admin/users`
- **Description**: Retrieve user accounts with search and role filter.
- **Headers**: `Authorization: Bearer <token>` (Role: `ADMIN`)
- **Query Parameters**:
  - `search`: Matches Name or Email.
  - `role`: Filter by `REQUESTER`, `IT_STAFF`, or `ADMIN`.
- **Response 200 OK**:
```json
[
  {
    "id": 1,
    "name": "Jennifer Anderson",
    "email": "jennifer.a@kmutt.ac.th",
    "role": "REQUESTER",
    "isActive": true,
    "mustChangePassword": false,
    "createdAt": "2026-09-01T10:00:00.000Z"
  }
]
```

### 6.2 `POST /api/admin/users`
- **Description**: Create new user account with initial password.
- **Headers**: `Authorization: Bearer <token>` (Role: `ADMIN`)
- **Request Body**:
```json
{
  "name": "Alex Thompson",
  "email": "alex.thompson@toktickit.com",
  "role": "IT_STAFF",
  "isActive": true,
  "initialPassword": "InitialPassword123!"
}
```
- **Response 201 Created**: Returns created user (passwords omitted, `mustChangePassword: true`).
- **Error Responses**:
  - `409 Conflict`: Email address already in use (`BR-16`).
  - `400 Bad Request`: Missing mandatory fields or invalid role.

### 6.3 `PUT /api/admin/users/:id`
- **Description**: Update basic account information, role, or activation status.
- **Headers**: `Authorization: Bearer <token>` (Role: `ADMIN`)
- **Request Body**:
```json
{
  "name": "Alex Thompson Updated",
  "email": "alex.thompson@toktickit.com",
  "role": "IT_STAFF",
  "isActive": false
}
```
- **Safety Error Enforcements**:
  - `400 Bad Request`: Administrator attempting to deactivate own account (`BR-17`).
  - `400 Bad Request`: Attempting to deactivate or demote the system's last active Administrator (`BR-18`).
  - `409 Conflict`: Duplicate email update.

### 6.4 `POST /api/admin/users/:id/reset-password`
- **Description**: Assign new temporary password and mandate reset at next login.
- **Headers**: `Authorization: Bearer <token>` (Role: `ADMIN`)
- **Request Body**:
```json
{
  "newInitialPassword": "TemporaryPass123!"
}
```
- **Response 200 OK**:
```json
{
  "message": "Initial password reset successfully. User must change password at next login.",
  "mustChangePassword": true
}
```
