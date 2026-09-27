# TokTickIT UI Specification - Lab 04: Dashboards, Actions Taken & Zen Green Polish

## 1. Design Language & System Tokens (Zen Green)

TokTickIT preserves and deepens the Zen Green design system established in Lab 2 and Lab 3, applying it consistently to the new Role Dashboards, Actions Taken management interfaces, and resolution workflows.

### 1.1 Color Tokens
- **Primary Brand Green**: `#006B3C` (Header navbar, primary buttons, card highlight headers)
- **Interactive / Focus Green**: `#0B7A46` (Button hover, active navigation tabs, interactive pills, focus rings)
- **Light Accent Green**: `#EAF6EF` (Active tab background, selected card backgrounds, success callouts)
- **App Page Background**: `#F5F7F6` (Calm, neutral gray-green surface for main layouts)
- **Card Surface Background**: `#FFFFFF` with 1px border `#E2E8F0` and subtle elevation `box-shadow: 0 2px 4px rgba(0,0,0,0.04)`
- **Text High-Contrast**: `#1A2E22` (Headers, metric values, primary labels)
- **Text Secondary / Muted**: `#4A5568` (Subtitles, table headers, timestamps, field hints)
- **Status & Warning Colors**:
  - **Error / Danger**: `#B91C1C` (Resolution gate warning, validation errors, cancel badges)
  - **Warning / Follow-up**: `#D97706` (Follow-up required badge, pending attention indicators)
  - **Success / Resolved**: `#15803D` (Resolved status, success checkmarks, completed actions)
  - **Internal Note / Confidential**: `#FFFBEB` with `#D97706` border (Private staff notes)

### 1.2 Status & Priority Badges

| Badge Type | Value | Background | Text Color | Border |
|---|---|---|---|---|
| **Status** | `NEW` | `#EBF8FF` (Soft Blue) | `#2B6CB0` | 1px solid `#BEE3F8` |
| **Status** | `OPEN` | `#E6FFFA` (Teal) | `#234E52` | 1px solid `#B2F5EA` |
| **Status** | `IN_PROGRESS` | `#FEFCBF` (Amber-Yellow) | `#744210` | 1px solid `#FAF089` |
| **Status** | `WAITING_FOR_REQUESTER` | `#ED8936` (Orange Tint) | `#7B341E` | 1px solid `#FEEBC8` |
| **Status** | `RESOLVED` | `#C6F6D5` (Soft Green) | `#22543D` | 1px solid `#9AE6B4` |
| **Status** | `CLOSED` | `#EDF2F7` (Neutral Gray) | `#4A5568` | 1px solid `#E2E8F0` |
| **Status** | `REOPENED` | `#FED7D7` (Soft Red) | `#9B2C2C` | 1px solid `#FEB2B2` |
| **Status** | `CANCELLED` | `#E2E8F0` (Muted Gray) | `#718096` | 1px solid `#CBD5E0` |
| **Priority** | `LOW` | `#EDF2F7` | `#4A5568` | 1px solid `#E2E8F0` |
| **Priority** | `MEDIUM` | `#EBF8FF` | `#2B6CB0` | 1px solid `#BEE3F8` |
| **Priority** | `HIGH` | `#FEEBC8` | `#C05621` | 1px solid `#FBD38D` |
| **Priority** | `URGENT` | `#FED7D7` | `#9B2C2C` | 1px solid `#FEB2B2` |
| **Follow-Up** | `Follow-Up Req.` | `#FFFBEB` | `#B45309` | 1px solid `#FCD34D` |

---

## 2. Screen Specifications & Layouts

### 2.1 Navigation Shell Updates
- **Top Bar**:
  - Logo: "TokTickIT" with leaf/shield brand mark.
  - Role-Aware Nav Links:
    - **Requester**: `Dashboard` (active/default), `My Tickets`, `Create Ticket`.
    - **IT Staff**: `Dashboard` (active/default), `Ticket Queue`.
    - **Administrator**: `Dashboard` (active/default), `Ticket Queue`, `User Management`.
  - Right Header: Authenticated user name, role badge pill (`Requester` / `IT Staff` / `Admin`), and Logout button.
- **Active Navigation Pill**: `#0B7A46` text on `#EAF6EF` pill background with clear semantic focus border.

---

### 2.2 IT Staff Dashboard (`/dashboard`)

#### Header Area
- Title: "Welcome back, {User.name}!"
- Subtitle: "Here's what's happening with your queue today."
- Action: "Refresh" button with sync icon for on-demand metric updates.

#### Metrics Row (5 Responsive Metric Cards)
1. **New**: Count of `NEW` tickets. Accent border: `#2B6CB0`. Drill-down: `/staff/queue?status=NEW`.
2. **Open**: Count of `OPEN` tickets. Accent border: `#234E52`. Drill-down: `/staff/queue?status=OPEN`.
3. **In Progress**: Count of `IN_PROGRESS` tickets. Accent border: `#744210`. Drill-down: `/staff/queue?status=IN_PROGRESS`.
4. **Waiting for Requester**: Count of `WAITING_FOR_REQUESTER` tickets. Accent border: `#7B341E`. Drill-down: `/staff/queue?status=WAITING_FOR_REQUESTER`.
5. **My Assigned**: Count of tickets where `ownerId === user.id`. Accent border: `#006B3C`. Drill-down: `/staff/queue?ownership=my_assigned`.

*Card Visual Treatment*:
- Background: `#FFFFFF`, 1px solid border `#E2E8F0`, border-radius 8px.
- Value: 36px font-weight bold text `#1A2E22`.
- Hover Effect: subtle translateY(-2px), box-shadow 0 4px 12px rgba(0,107,60,0.08), pointer cursor.
- Focus Indicator: Visible 2px focus ring (`#0B7A46`).

#### Main Grid (Two Columns: 65% / 35%)
- **Left Column: "My Recent Tickets" Card**:
  - Card Header: "My Recent Tickets" with "View all" link leading to `/staff/queue`.
  - Data Table: Ticket Number (clickable), Summary (truncated at 45 chars), Status Badge, Updated Time.
  - Empty State: "No tickets in your queue. Great job!" with check icon.
- **Right Column: "Quick Actions" Card**:
  - Vertical list of accessible primary action triggers:
    - `+ Create Ticket` &rarr; Opens Ticket Creation dialog.
    - `🔍 Search Tickets` &rarr; Focuses Queue search.
    - `📋 My Queue` &rarr; Navigates to `/staff/queue?ownership=my_assigned`.

---

### 2.3 Requester Dashboard (`/dashboard`)

#### Header Area
- Title: "Welcome, {User.name}!"
- Subtitle: "Here's the latest on your requests."
- Action: "Refresh" button.

#### Metrics Row (4 Responsive Metric Cards)
1. **My Open Tickets**: Total active tickets owned by requester. Accent: `#006B3C`. Drill-down: `/requester/tickets?filter=open`.
2. **In Progress**: Count of requester's tickets currently being worked on. Accent: `#744210`. Drill-down: `/requester/tickets?status=IN_PROGRESS`.
3. **Resolved**: Count of tickets resolved awaiting confirmation. Accent: `#15803D`. Drill-down: `/requester/tickets?status=RESOLVED`.
4. **Closed**: Count of closed tickets. Accent: `#4A5568`. Drill-down: `/requester/tickets?status=CLOSED`.

#### Main Grid (Two Columns: 65% / 35%)
- **Left Column: "My Recent Tickets"**:
  - Displays top 5 tickets owned by requester, sorted by `updatedAt` desc.
  - Columns: Ticket Number (link to detail), Title, Status Badge, Last Updated.
  - Empty State: "You haven't submitted any tickets yet." with "Create your first ticket" button.
- **Right Column: "Quick Actions"**:
  - `+ Create Ticket` (primary green CTA button).
  - `📁 View My Tickets` (secondary outline button).

---

### 2.4 Administrator Dashboard Extension
- Renders the complete IT Staff operational dashboard plus an additional **"User Accounts Overview"** section:
  - Metric 1: **Total Users** (Count of all system accounts).
  - Metric 2: **Active Users** (Count of `isActive === true`).
  - Metric 3: **Requesters** (Count of role `REQUESTER`).
  - Metric 4: **IT Staff & Admins** (Count of role `IT_STAFF` + `ADMIN`).
  - Quick Link: "Manage Users &rarr;" leading directly to `/admin/users`.

---

### 2.5 Actions Taken UI on Ticket Detail

The Actions Taken module is positioned prominently on the Ticket Detail screen, beneath the Ticket Metadata bar and above the Public Comments/Internal Notes tabs.

#### Section Header
- Title: "Actions Taken" with item counter pill (e.g., `Actions Taken (3)`).
- Subtitle: "Audit trail of technical actions performed to investigate and resolve this ticket."
- Action: `+ Record Action Taken` button (visible strictly to IT Staff and Administrators; hidden for Requesters).

#### List / Table Presentation
- Table Columns:
  1. **Date / Time**: Formatted localized date & time (`MMM D, YYYY h:mm A`).
  2. **Description**: Concise summary of what was done.
  3. **Result**: Resulting state, diagnostic observation, or outcome.
  4. **Performed By**: User name with role pill badge (`IT Staff` / `Admin`).
  5. **Follow-Up**: Badge (`Follow-Up Req.` in amber) accompanied by tooltip or displayed note; or "None" in muted gray.
  6. **Attachment Notes**: Note describing reference logs/screenshots, or "-" if empty.
  7. **Actions**: "Edit" button (pencil icon) for IT Staff/Admin.
- Read-Only Mode (for Requesters):
  - Requesters see all rows and columns except the "Actions / Edit" column.
  - No "+ Record Action" button is rendered.
- Empty State:
  - Container with dashed neutral border, wrench icon, and text: *"No actions recorded yet. At least one Action Taken is required before this ticket can be resolved."*

#### Record / Edit Action Modal Dialog
- Dialog Title: "Record Action Taken" (or "Edit Action Taken" if editing).
- Form Fields:
  1. **Action Date/Time**: `<input type="datetime-local">` (Required, defaults to current time).
  2. **Performed By**: `<select>` (Required, auto-selected to logged-in user, lists active staff members).
  3. **Action Description**: `<textarea>` (Required, min 5 chars, max 2000 chars, placeholder: "Describe the diagnostic steps, software fix, or hardware service performed...").
  4. **Result**: `<input type="text">` or `<select>` with common choices + custom entry (Required, e.g., "Issue reproduced", "Configuration updated", "Patch applied", "Vendor ticket opened").
  5. **Follow-Up Required?**: Toggle switch / Checkbox.
  6. **Follow-Up Note**: `<textarea>` (Conditionally displayed when Follow-Up is true; required with validation error if empty).
  7. **Attachment Notes**: `<input type="text">` (Optional, placeholder: "e.g., Refer to error_screenshot.png attached above").
- Dialog Footer:
  - "Cancel" button (secondary neutral).
  - "Save Action" button (primary Zen green with loading indicator).

---

### 2.6 Ticket Resolution Gate & Workflow Feedback

#### Visual Indicators & Guard Rails
1. **Disabled Resolution Button with Tooltip**:
   - When a ticket has `0` Actions Taken, the "Resolve Ticket" button or status option in the triage dropdown shows an informative disabled cue or tooltip:
     *"⚠️ At least one Action Taken is required before a ticket can be resolved."*
2. **Resolution Attempt Error Banner**:
   - If an API or user action attempts to set status to `RESOLVED` while actions count is zero:
     - Danger alert banner appears at top of form:
       *"Cannot resolve ticket: You must record at least one Action Taken describing the technical resolution before closing or resolving this ticket."*
3. **Advisory Requester Indication**:
   - When Requester clicks "Problem Appears Resolved", a prominent green banner appears:
     *"Requester indicated this issue appears resolved. Please verify actions taken and formally resolve the ticket."*
   - Status badge remains in current state (`IN_PROGRESS`, `OPEN`, etc.) until staff formally transitions it.

---

## 3. Responsive Rules & Breakpoints

| Viewport Breakpoint | Dashboard Adaptations | Actions Taken Adaptations |
|---|---|---|
| **Desktop (>= 1200px)** | 5-column metric grid. 65%/35% two-column split for Recent Tickets and Quick Actions. | Full 7-column data table with generous padding. Modals centered at max-width 600px. |
| **Tablet (768px - 1199px)** | 2 or 3-column metric card wrapping. Stacked Recent Tickets above Quick Actions. | Horizontally scrollable table or compact multi-row rows. Preserves all data fields. |
| **Mobile (< 768px / 375px)** | Single-column stacked metric cards (full width). Single-column recent ticket cards. | Cards stack vertically. Each action rendered as an individual card with badge tags. Fullscreen modal. |

---

## 4. Visual Inspection & Responsive Checklist

This checklist directly supports **Rubric Part 9 (Zen Green UI, Responsive, Accessibility, and Final Polish)**.

### 4.1 Design Consistency & Zen Green Palette
- [x] **Primary Brand Green**: `#006B3C` used for header, primary buttons, and active tabs.
- [x] **Card Styling**: Consistent white cards with `#E2E8F0` border, 8px border-radius, and subtle elevation.
- [x] **Background Harmony**: Main page background consistently set to neutral `#F5F7F6`.
- [x] **Typography & Hierarchy**: Inter / system-ui typography with bold values for metric counters and crisp metadata labels.

### 4.2 Dashboards & Drill-Downs
- [x] **Requester Metrics**: Accurate counts for Open, In Progress, Resolved, and Closed.
- [x] **Staff Metrics**: Accurate counts for New, Open, In Progress, Waiting for Requester, and My Assigned.
- [x] **Clickable Drill-Downs**: Metric cards navigate to pre-filtered Queue or My Tickets view with active filter indicators.
- [x] **Zero / Empty States**: Clean, friendly empty placeholders displayed when counts are zero or lists are empty.

### 4.3 Actions Taken Table & Form
- [x] **Field Completeness**: All required fields (Date/Time, Description, Result, Performed By, Follow-Up, Attachment Notes) displayed cleanly.
- [x] **Requester Read-Only View**: Requesters can inspect all actions but cannot see edit or create controls.
- [x] **Role Restrictions**: Only active IT Staff and Admins can access create/edit dialogs.
- [x] **Conditional Validation**: Follow-Up Note is strictly validated when Follow-Up Required is checked.

### 4.4 Resolution Gate & Workflow Cues
- [x] **Visual Gate Warning**: Clear warning displayed when attempting to resolve a ticket with zero actions.
- [x] **Status Badges**: Distinct, accessible colors for all 8 statuses.
- [x] **Advisory Requester Flag**: Distinct notice shown when requester indicates issue is resolved.

### 4.5 Responsive Layout & Overflow
- [x] **Desktop (1280px+)**: Spacious layouts with zero clipping or text wrapping defects.
- [x] **Tablet (768px)**: Smooth wrapping of metric cards and side-by-side elements.
- [x] **Mobile (375px)**: Zero horizontal page overflow (`overflow-x: hidden`), full touch targets &ge; 44px, readable stacked cards.

### 4.6 Accessibility & Polish
- [x] **Focus Indicators**: High-visibility focus outline (`#0B7A46`) on all interactive buttons, cards, and inputs.
- [x] **WCAG Contrast**: All text elements exceed WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text).
- [x] **Zero Console Errors**: Clean runtime execution in browser developer tools across all flows.
