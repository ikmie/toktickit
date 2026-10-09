# TokTickIT REST API Specification - Lab 04: Dashboards, Actions Taken & Resolution Gate

## 1. Overview, Security & Protocol Conventions

### 1.1 Base URL
All API endpoints are mounted under `/api`.

### 1.2 Authentication & Authorization Headers
- **Header**: `Authorization: Bearer <token>`
- Token contains signed JWT payload: `{ id, email, role, name, mustChangePassword }`.
- The server validates the token on all protected routes and populates `req.user`.
- Missing or invalid tokens return `401 Unauthorized`.
- Forbidden roles return `403 Forbidden` with a safe JSON response.

### 1.3 Safe Error Response Format
All error responses adhere to a consistent JSON structure:
```json
{
  "error": "Error title or code",
  "message": "Human-readable safe explanation",
  "details": []
}
```

---

## 2. Dashboard Endpoints

### 2.1 `GET /api/dashboards/requester`
- **Description**: Returns authoritative dashboard metrics and recent tickets for the authenticated Requester.
- **Authorization**: Role `REQUESTER` only. Requesters can only access their own data.
- **Headers**: `Authorization: Bearer <token>`
- **Response 200 OK**:
```json
{
  "metrics": {
    "totalOpenTickets": 3,
    "inProgress": 2,
    "resolved": 1,
    "closed": 5
  },
  "recentTickets": [
    {
      "id": "clx123abc",
      "ticketNumber": "TICK-20260910-0001",
      "title": "Laptop battery drains quickly",
      "status": "IN_PROGRESS",
      "requestedPriority": "MEDIUM",
      "itPriority": "MEDIUM",
      "updatedAt": "2026-09-12T09:14:00.000Z"
    }
  ]
}
```
- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid token.
  - `403 Forbidden`: User has role `IT_STAFF` or `ADMIN`.

---

### 2.2 `GET /api/dashboards/staff`
- **Description**: Returns operational queue metrics, status breakdown, and recent tickets for IT Staff and Administrators.
- **Authorization**: Roles `IT_STAFF` or `ADMIN`.
- **Headers**: `Authorization: Bearer <token>`
- **Response 200 OK**:
```json
{
  "metrics": {
    "new": 4,
    "open": 12,
    "inProgress": 8,
    "waitingForRequester": 3,
    "myAssigned": 5,
    "unassigned": 7,
    "urgentHigh": 6,
    "recentActionsCount": 14
  },
  "statusBreakdown": {
    "NEW": 4,
    "OPEN": 12,
    "IN_PROGRESS": 8,
    "WAITING_FOR_REQUESTER": 3,
    "RESOLVED": 9,
    "CLOSED": 15,
    "REOPENED": 1,
    "CANCELLED": 2
  },
  "recentTickets": [
    {
      "id": "clx123abc",
      "ticketNumber": "TICK-20260910-0001",
      "title": "VPN disconnects randomly",
      "status": "OPEN",
      "itPriority": "HIGH",
      "requesterName": "Jennifer Anderson",
      "ownerName": "Michael Scott",
      "actionsCount": 2,
      "updatedAt": "2026-09-12T10:05:00.000Z"
    }
  ]
}
```
- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid token.
  - `403 Forbidden`: User has role `REQUESTER`.

---

### 2.3 `GET /api/dashboards/admin`
- **Description**: Returns operational staff metrics augmented with user account distribution data.
- **Authorization**: Role `ADMIN` only.
- **Headers**: `Authorization: Bearer <token>`
- **Response 200 OK**:
```json
{
  "operational": {
    "new": 4,
    "open": 12,
    "inProgress": 8,
    "waitingForRequester": 3,
    "myAssigned": 2,
    "unassigned": 7,
    "urgentHigh": 6
  },
  "userStats": {
    "totalUsers": 9,
    "activeUsers": 8,
    "inactiveUsers": 1,
    "byRole": {
      "REQUESTER": 5,
      "IT_STAFF": 3,
      "ADMIN": 1
    }
  },
  "recentTickets": [ ... ]
}
```
- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid token.
  - `403 Forbidden`: User is not an Administrator.

---

## 3. Actions Taken Endpoints

### 3.1 `GET /api/tickets/:id/actions`
- **Description**: Retrieve all Actions Taken for a specific ticket, sorted chronologically (`actionDateTime ASC`).
- **Authorization**:
  - `REQUESTER`: Permitted ONLY if ticket was created by authenticated user (`ticket.requesterId === req.user.id`).
  - `IT_STAFF` / `ADMIN`: Permitted for all tickets.
- **Response 200 OK**:
```json
{
  "actions": [
    {
      "id": "act_991823",
      "ticketId": "clx123abc",
      "actionDateTime": "2026-09-12T09:30:00.000Z",
      "description": "Inspected battery health report and ran diagnostic cycle.",
      "result": "Battery cycles at 920; degradation confirmed below 70% threshold.",
      "performedBy": {
        "id": "usr_staff_1",
        "name": "David Miller",
        "email": "david.m@kmutt.ac.th",
        "role": "IT_STAFF"
      },
      "followUpRequired": true,
      "followUpNote": "Order replacement battery from authorized KMUTT vendor.",
      "attachmentNotes": "diagnostic_log.txt",
      "createdAt": "2026-09-12T09:32:00.000Z",
      "updatedAt": "2026-09-12T09:32:00.000Z"
    }
  ]
}
```
- **Error Responses**:
  - `401 Unauthorized`: Unauthenticated.
  - `403 Forbidden`: Requester attempting to view an unowned ticket.
  - `404 Not Found`: Ticket does not exist.

---

### 3.2 `POST /api/tickets/:id/actions`
- **Description**: Record a new Action Taken under a ticket.
- **Authorization**: Roles `IT_STAFF` or `ADMIN`.
- **Request Body**:
```json
{
  "actionDateTime": "2026-09-12T09:30:00.000Z",
  "description": "Replaced laptop battery and tested charging circuit.",
  "result": "Device holds full charge under peak load.",
  "performedById": "usr_staff_1",
  "followUpRequired": false,
  "followUpNote": null,
  "attachmentNotes": "receipt_battery.pdf"
}
```
- **Validation Rules**:
  - `description`: Required string, 1–2000 characters.
  - `result`: Required string, 1–2000 characters.
  - `performedById`: Optional; if omitted, defaults to `req.user.id`. If supplied, must reference an active `IT_STAFF` or `ADMIN` user.
  - `followUpRequired`: Boolean (default `false`).
  - `followUpNote`: Mandatory if `followUpRequired === true` (1–2000 characters).
  - `actionDateTime`: Optional ISO date-time; defaults to `now()`. Cannot be > 24 hours in future.
- **Response 201 Created**:
```json
{
  "message": "Action taken recorded successfully",
  "action": {
    "id": "act_991824",
    "ticketId": "clx123abc",
    "actionDateTime": "2026-09-12T09:30:00.000Z",
    "description": "Replaced laptop battery and tested charging circuit.",
    "result": "Device holds full charge under peak load.",
    "performedBy": {
      "id": "usr_staff_1",
      "name": "David Miller",
      "role": "IT_STAFF"
    },
    "followUpRequired": false,
    "followUpNote": null,
    "attachmentNotes": "receipt_battery.pdf",
    "createdAt": "2026-09-12T09:35:00.000Z",
    "updatedAt": "2026-09-12T09:35:00.000Z"
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Validation failure (empty description/result, missing followUpNote when required, or inactive performedBy).
  - `401 Unauthorized`: Unauthenticated.
  - `403 Forbidden`: Requester role attempting to create actions.
  - `404 Not Found`: Ticket does not exist.

---

### 3.3 `PUT /api/tickets/:id/actions/:actionId`
- **Description**: Update an existing Action Taken record.
- **Authorization**: Roles `IT_STAFF` or `ADMIN`.
- **Request Body**:
```json
{
  "actionDateTime": "2026-09-12T09:30:00.000Z",
  "description": "Updated diagnostic steps taken.",
  "result": "Resolved with firmware update.",
  "performedById": "usr_staff_2",
  "followUpRequired": true,
  "followUpNote": "Verify stability after 48 hours."
}
```
- **Response 200 OK**:
```json
{
  "message": "Action taken updated successfully",
  "action": { ... }
}
```
- **Error Responses**:
  - `400 Bad Request`: Validation failure.
  - `403 Forbidden`: Requester role.
  - `404 Not Found`: Ticket or Action not found.

---

## 4. Ticket Status & Resolution Gate Contract

### 4.1 `PATCH /api/staff/tickets/:id/status`
- **Description**: Update ticket status through permitted transitions. Enforces the **Resolution Gate**.
- **Authorization**: Roles `IT_STAFF` or `ADMIN`.
- **Request Body**:
```json
{
  "status": "RESOLVED",
  "expectedUpdatedAt": "2026-09-12T08:00:00.000Z"
}
```
- **Resolution Gate Invariant (`BR-09`)**:
  - If `status === "RESOLVED"`, the server counts `ActionTaken` records associated with `:id`.
  - If count is `0`, the request is rejected with `400 Bad Request`:
  ```json
  {
    "error": "ResolutionGateBlocked",
    "message": "Cannot resolve ticket without at least one recorded Action Taken."
  }
  ```
- **Permitted Transitions (`BR-12`)**:
  - Transition must be valid per the permitted transition matrix. Invalid transitions return `400 Bad Request`.
- **Concurrency Check (`BR-14`)**:
  - If `expectedUpdatedAt` is provided and does not match the current `ticket.updatedAt`, the server rejects with `409 Conflict`:
  ```json
  {
    "error": "Conflict",
    "message": "This ticket has been modified by another user. Please refresh and review current state."
  }
  ```
- **Response 200 OK**:
```json
{
  "message": "Ticket status updated successfully",
  "ticket": {
    "id": "clx123abc",
    "status": "RESOLVED",
    "updatedAt": "2026-09-12T10:00:00.000Z"
  }
}
```

---

## 5. Summary of HTTP Status Codes Used

| Code | Meaning | Context |
|---|---|---|
| `200 OK` | Success | Metric retrieval, action list, action update, ticket update |
| `201 Created` | Resource Created | Action Taken recorded |
| `400 Bad Request` | Validation Failure | Resolution gate blocked (zero actions), missing follow-up note, invalid dates |
| `401 Unauthorized` | Auth Required | Missing, invalid, or expired JWT |
| `403 Forbidden` | Access Denied | Role unauthorized, requester viewing unowned ticket or attempting staff actions |
| `404 Not Found` | Not Found | Ticket ID or Action ID does not exist |
| `409 Conflict` | Concurrency Conflict | Stale update detected via `updatedAt` mismatch |
| `500 Server Error` | Internal Failure | Unexpected database or system error |
