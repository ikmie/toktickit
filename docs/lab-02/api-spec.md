# TokTickIT REST API Specification - Lab 02

## 1. Overview & Headers
- **Base URL**: `/api`
- **Requester Identity Header**: `X-Requester-Id` (integer). Required for all user-specific endpoints (`/tickets`, `/attachments`).

---

## 2. API Endpoints

### 2.1 Requesters & Reference Data

#### `GET /api/requesters`
- **Description**: Retrieve active Development Requesters for session selector.
- **Headers**: None
- **Response 200 OK**:
```json
[
  {
    "id": 1,
    "name": "Jennifer Anderson",
    "email": "jennifer.a@kmutt.ac.th",
    "department": "Computer Engineering",
    "isActive": true
  },
  {
    "id": 2,
    "name": "Michael Brown",
    "email": "michael.b@kmutt.ac.th",
    "department": "IT Support",
    "isActive": true
  }
]
```

#### `GET /api/categories`
- **Description**: Retrieve active ticket categories.
- **Headers**: None
- **Response 200 OK**:
```json
[
  { "id": 1, "name": "Account and Access" },
  { "id": 2, "name": "Hardware" },
  { "id": 3, "name": "Software" },
  { "id": 4, "name": "Network" }
]
```

#### `GET /api/related-systems`
- **Description**: Retrieve active related systems.
- **Headers**: None
- **Response 200 OK**:
```json
[
  { "id": 1, "name": "Email", "code": "EMAIL" },
  { "id": 2, "name": "Campus Wi-Fi", "code": "WIFI" },
  { "id": 3, "name": "VPN", "code": "VPN" },
  { "id": 4, "name": "LEB2 App", "code": "LEB2" },
  { "id": 5, "name": "Grade Submission App", "code": "GRADE" },
  { "id": 6, "name": "Printer", "code": "PRINTER" },
  { "id": 7, "name": "Corporate Laptop", "code": "LAPTOP" }
]
```

---

### 2.2 Tickets Endpoint

#### `POST /api/tickets`
- **Description**: Create a new ticket for the active Development Requester.
- **Headers**: `X-Requester-Id: 1`
- **Request Body**:
```json
{
  "categoryId": 2,
  "relatedSystemId": 7,
  "summary": "Laptop battery drains quickly",
  "description": "My laptop battery is draining much faster than usual even when the system is idle.",
  "requestedPriority": "MEDIUM"
}
```
- **Response 201 Created**:
```json
{
  "id": 12,
  "ticketNumber": "TKT-2026-000012",
  "requesterId": 1,
  "categoryId": 2,
  "relatedSystemId": 7,
  "summary": "Laptop battery drains quickly",
  "description": "My laptop battery is draining much faster than usual even when the system is idle.",
  "requestedPriority": "MEDIUM",
  "itPriority": "MEDIUM",
  "currentStatus": "NEW",
  "ticketDate": "2026-08-22T13:30:00.000Z",
  "updatedAt": "2026-08-22T13:30:00.000Z",
  "category": { "id": 2, "name": "Hardware" },
  "relatedSystem": { "id": 7, "name": "Corporate Laptop" },
  "requester": { "id": 1, "name": "Jennifer Anderson" }
}
```
- **Response 400 Bad Request**:
```json
{
  "error": "Validation Error",
  "details": [
    { "field": "summary", "message": "Summary is required and must be 5-150 characters" },
    { "field": "description", "message": "Description must be 10-2000 characters" }
  ]
}
```

#### `GET /api/tickets`
- **Description**: Retrieve paginated list of tickets owned by the active Requester.
- **Headers**: `X-Requester-Id: 1`
- **Query Parameters**:
  - `search` (optional): Filter by ticket string matching ticketNumber or summary.
  - `categoryId` (optional): Filter by category ID.
  - `priority` (optional): Filter by requested priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  - `status` (optional): Filter by current status (`NEW`, `OPEN`, `IN_PROGRESS`, `PENDING`, `RESOLVED`, `CLOSED`).
  - `sort` (optional): Sort column (`ticketNumber`, `ticketDate`, `updatedAt`). Default `ticketDate`.
  - `order` (optional): Sort order (`asc`, `desc`). Default `desc`.
  - `page` (optional): Page number (1-indexed). Default `1`.
  - `limit` (optional): Items per page. Default `10`.
- **Response 200 OK**:
```json
{
  "data": [
    {
      "id": 12,
      "ticketNumber": "TKT-2026-000012",
      "summary": "Laptop battery drains quickly",
      "category": "Hardware",
      "relatedSystem": "Corporate Laptop",
      "requestedPriority": "MEDIUM",
      "itPriority": "MEDIUM",
      "currentStatus": "NEW",
      "ticketDate": "2026-08-22T13:30:00.000Z",
      "attachmentCount": 2
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

#### `GET /api/tickets/:id`
- **Description**: Retrieve detailed ticket information owned by the active Requester.
- **Headers**: `X-Requester-Id: 1`
- **Response 200 OK**: Complete ticket object including attachments list.
- **Response 403 Forbidden / 404 Not Found**:
```json
{
  "error": "Access Denied",
  "message": "Ticket not found or does not belong to the selected requester."
}
```

---

### 2.3 Attachments Endpoints

#### `POST /api/tickets/:id/attachments`
- **Description**: Upload attachment to ticket.
- **Headers**: `X-Requester-Id: 1`, `Content-Type: multipart/form-data`
- **Form Data**: `file` (File binary data)
- **Response 201 Created**:
```json
{
  "id": 5,
  "ticketId": 12,
  "originalName": "error_screenshot.png",
  "mimeType": "image/png",
  "fileSize": 245100,
  "isRemoved": false,
  "uploadedAt": "2026-08-22T13:35:00.000Z"
}
```
- **Response 400 Bad Request**: Invalid file type, file size > 5 MB, or ticket already has 5 active attachments.

#### `GET /api/tickets/:id/attachments`
- **Description**: Get metadata list of attachments for owned ticket.
- **Headers**: `X-Requester-Id: 1`
- **Response 200 OK**: Array of attachment metadata objects (including soft-removed items with removal reasons).

#### `GET /api/attachments/:id/download`
- **Description**: Download binary file for active attachment.
- **Headers**: `X-Requester-Id: 1`
- **Response 200 OK**: File stream (`Content-Disposition: attachment; filename="..."`).
- **Response 404 / 403**: Soft-removed attachment or access to another requester's attachment.

#### `PATCH /api/attachments/:id/soft-remove`
- **Description**: Soft-remove attachment with reason.
- **Headers**: `X-Requester-Id: 1`
- **Request Body**:
```json
{
  "reason": "Uploaded incorrect log file by mistake"
}
```
- **Response 200 OK**:
```json
{
  "id": 5,
  "isRemoved": true,
  "removedAt": "2026-08-22T13:40:00.000Z",
  "removedReason": "Uploaded incorrect log file by mistake"
}
```
- **Response 400 Bad Request**: Missing or empty removal reason.
