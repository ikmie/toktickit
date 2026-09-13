# TokTickIT UI Specification - Lab 03

## 1. Design Language & System Tokens (Zen Green)

TokTickIT reuses the Zen Green design system established in Lab 2, expanding it for operational IT workflows and administrator screens.

### 1.1 Color Tokens
- **Primary Brand Green**: `#006B3C` (Header background, primary action buttons, main accent)
- **Interactive / Focus Green**: `#0B7A46` (Button hover, active links, focus outlines, selected navigation tabs)
- **Pale Accent Green**: `#EAF6EF` (Selected row background, active filter pill, success containers)
- **App Page Background**: `#F5F7F6` (Quiet, light neutral background)
- **Card Surface**: `#FFFFFF` with 1px border `#E2E8F0` and `0 2px 4px rgba(0,0,0,0.04)` box shadow
- **Text High-Contrast**: `#1A2E22` (Headings, primary body text)
- **Text Secondary / Muted**: `#4A5568` (Labels, metadata, timestamps)
- **Status / Alert Colors**:
  - **Error / Danger**: `#B91C1C` (Dark red text, validation messages, borders)
  - **Warning / Accent**: `#D97706` (Amber indicators)
  - **Success**: `#15803D` (Green badges, saved confirmations)
  - **Internal Note Callout**: `#FFFBEB` (Warm pale yellow background with `#F59E0B` / `#D97706` left border, clearly distinguishing private notes from public comments)

### 1.2 Status & Priority Badges

| Badge Type | Value | Background | Text Color | Border |
|---|---|---|---|---|
| **Status** | `NEW` | `#EBF8FF` (Light Blue) | `#2B6CB0` | 1px solid `#BEE3F8` |
| **Status** | `OPEN` | `#E6FFFA` (Teal) | `#234E52` | 1px solid `#B2F5EA` |
| **Status** | `IN_PROGRESS` | `#FEFCBF` (Yellow) | `#744210` | 1px solid `#FAF089` |
| **Status** | `WAITING_FOR_REQUESTER` | `#ED8936` (Orange Tint) | `#7B341E` | 1px solid `#FEEBC8` |
| **Status** | `RESOLVED` | `#C6F6D5` (Light Green) | `#22543D` | 1px solid `#9AE6B4` |
| **Status** | `CLOSED` | `#EDF2F7` (Light Gray) | `#4A5568` | 1px solid `#E2E8F0` |
| **Status** | `REOPENED` | `#FED7D7` (Light Red) | `#9B2C2C` | 1px solid `#FEB2B2` |
| **Status** | `CANCELLED` | `#E2E8F0` (Muted Gray) | `#718096` | 1px solid `#CBD5E0` |
| **Priority** | `LOW` | `#EDF2F7` | `#4A5568` | 1px solid `#E2E8F0` |
| **Priority** | `MEDIUM` | `#EBF8FF` | `#2B6CB0` | 1px solid `#BEE3F8` |
| **Priority** | `HIGH` | `#FEEBC8` | `#C05621` | 1px solid `#FBD38D` |
| **Priority** | `URGENT` | `#FED7D7` | `#9B2C2C` | 1px solid `#FEB2B2` |
| **Role** | `Requester` | `#EAF6EF` | `#006B3C` | 1px solid `#A7F3D0` |
| **Role** | `IT Staff` | `#EBF8FF` | `#1D4ED8` | 1px solid `#BFDBFE` |
| **Role** | `Administrator` | `#F3E8FF` | `#6B21A8` | 1px solid `#DDD6FE` |

---

## 2. Screen Specifications & Modes

### 2.1 Screen 1: Login & Mandatory Password Change

#### Layout & Controls
- **Card**: Centered container (max width 420px) on `#F5F7F6` background.
- **Header**: TokTickIT logo with green brand accent.
- **Fields**:
  - Email Address (`input[type="email"]`, placeholder `user@toktickit.com`, autocomplete `email`).
  - Password (`input[type="password"]` with show/hide toggle, autocomplete `current-password`).
- **Feedback**:
  - Invalid credentials error banner: "Invalid email or password. Please try again."
  - Inactive account banner: "Your account is deactivated. Please contact an administrator."
  - Loading / busy spinner on primary button during submission.
- **First-Login / Mandatory Password Change Mode**:
  - Triggered immediately when `mustChangePassword = true`.
  - Normal application navigation is blocked.
  - Fields: Current Password, New Password, Confirm New Password.
  - Live password requirements checklist:
    - At least 8 characters.
    - Includes uppercase and lowercase letters.
    - Includes a number and a special character.
  - Primary button: "Save & Continue" (disabled until rules pass and passwords match).

---

### 2.2 Screen 2: Requester Ticket Detail & Public Comments

#### Enhancements from Lab 2
- **Removed**: Development Requester selector modal and top bar selector dropdown.
- **Top Header**: Displays logged-in user name and role badge (`Requester`), plus a "Sign Out" button.
- **"Problem Appears Resolved" Action**:
  - Positioned prominently in the Ticket status card when ticket is `OPEN` or `IN_PROGRESS`.
  - Shows clear confirmation dialog: "Are you sure this problem is resolved? This will notify IT Staff."
  - When confirmed, visually displays a green badge: "Resolution Indicated by Requester".
- **Public Comments Section**:
  - Tabbed or dedicated thread below ticket description.
  - Text area for adding a new comment (character counter, max 2000 chars).
  - Submit button: "Post Comment" with busy state.
  - Chronological message list: Author name, role badge, timestamp, and sanitized markdown/text message body.
  - Requesters **never** see Internal Notes tab or content.

---

### 2.3 Screen 3: IT Staff Ticket Queue

#### Layout & Controls
- **Header Navigation**: "Ticket Queue", user profile badge (`IT Staff`), "Sign Out".
- **Search & Filter Bar**:
  - Text search box (`placeholder="Search by ticket number or summary..."`) with instant or debounced search.
  - Filter dropdowns: Category, IT Priority, Status, Ownership (`All Tickets`, `Unassigned`, `Assigned to Me`).
  - "Clear Filters" link/button when filters are active.
- **Queue Table (Desktop >= 992px)**:
  - Columns: Ticket No., Created Date, Summary, Category, Req. Priority, IT Priority, Status, Ticket Owner, Action.
  - Clickable row or "View" button to navigate to Ticket Detail.
  - Column sort headers for Ticket No., Created Date, Priority, and Status.
  - Pagination controls: "Showing X of Y tickets", page size selector, Previous/Next and page numbers.
- **Queue Cards (Mobile < 768px)**:
  - Table transforms to responsive card list with status/priority badges clearly visible on top right, summary in bold, and owner at the footer.
- **Empty / Feedback States**:
  - "No tickets in queue" when empty.
  - "No matching tickets found" with a "Reset Filters" action when query yields 0 results.
  - Loading skeleton or spinner during search/filter fetch.

---

### 2.4 Screen 4: IT Staff Ticket Detail

#### Layout & Operational Controls
- **Breadcrumbs**: `Ticket Queue > Ticket Detail (TKT-YYYY-XXXXXX)` with "Back to Queue" button.
- **Operational Sidebar / Controls Card**:
  - **Ticket Ownership**:
    - Displays current owner.
    - If unassigned: Prominent "Claim Ticket" primary action.
    - Dropdown to reassign to any active IT Staff or Administrator.
  - **IT Priority**:
    - Editable dropdown (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) with save feedback.
    - Visually distinct from read-only Requested Priority.
  - **Current Status**:
    - Permitted status transition dropdown based on current status.
    - Confirmation prompt when transitioning to `RESOLVED`, `CLOSED`, or `CANCELLED`.
  - **Requester Resolution Callout**:
    - If `problemResolvedIndicated = true`, displays highlighted callout: "Requester has indicated this problem appears resolved."
- **Communication Threads (Tabbed Interface)**:
  - **Tab 1: Public Comments**:
    - Visible to both Requester and IT Staff.
    - Clearly labeled with green icon and note: "Visible to Requester".
  - **Tab 2: Internal Notes**:
    - Visually distinct pale-yellow/amber theme (`#FFFBEB`, border `#F59E0B`).
    - Prominent banner: "CONFIDENTIAL INTERNAL NOTE - Visible only to IT Staff and Administrators".
    - Append-only form: Textarea + "Save Internal Note" button.
  - **Tab 3: Attachments**:
    - Preserves Lab 2 attachment listing, download, and soft-removal reason audit trail.

---

### 2.5 Screen 5: Administrator User Management

#### Layout & Controls
- **Header Navigation**: "User Management", user profile badge (`Administrator`), "Sign Out".
- **Top Actions**:
  - Search input (`Search by name or email...`).
  - Role filter dropdown (`All Roles`, `Requester`, `IT Staff`, `Administrator`).
  - Primary button: "+ Create New User".
- **Users Table**:
  - Columns: Name, Email, Role, Status (`Active` green badge / `Inactive` gray badge), Actions.
  - Action: "Edit" button opens Edit User modal/drawer.
- **Create User Modal**:
  - Full Name (`input[type="text"]`, required).
  - Email Address (`input[type="email"]`, required, validates format).
  - Role (`select`: `Requester`, `IT Staff`, `Administrator`, required).
  - Active Toggle / Checkbox (default checked/true).
  - Initial Password (`input[type="text"]` with auto-generate option, default marked `mustChangePassword = true`).
  - "Create User" submit button with loading state.
- **Edit User Modal / Drawer**:
  - Edit Name, Email, Role, and Active switch.
  - **"Reset Initial Password"** section: Button to set new temporary password that forces password change on next login.
  - **Deactivate Button**:
    - Disabled if user is currently logged-in Admin (`BR-17: Cannot deactivate own account`).
    - Blocked with error message if user is the last active Administrator in the system (`BR-18`).
  - Save Changes button.

---

## 3. Responsive Rules & Viewport Adaptations

| Viewport Breakpoint | Layout Behavior |
|---|---|
| **Desktop (>= 992px)** | Full multi-column grids, comprehensive data tables, two-column detail views (metadata left, communications right), modals centered. |
| **Tablet (768px - 991px)** | Queue table retains primary columns; Ticket Detail stacks operational controls above communications; User Management table wraps metadata cleanly. |
| **Mobile (< 768px)** | Tables collapse into stacked cards; full-screen dialogs for modals; touch targets >= 44px; hamburger navigation for header on small devices. |
