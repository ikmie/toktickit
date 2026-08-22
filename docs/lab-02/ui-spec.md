# Zen Green Theme UI Specification - Lab 02

## 1. Design System & Theme Palette

### Color Tokens
| Token | Hex / Value | Purpose & Application |
|---|---|---|
| `primary-green` | `#006B3C` | App header background, primary buttons (`.btn-primary`), strong emphasis |
| `secondary-green` | `#0B7A46` | Active tab highlights, focus rings, link hover states, action accents |
| `pale-green` | `#EAF6EF` | Selected item highlight, subtle section containers, success backgrounds |
| `page-bg` | `#F5F7F6` | Main page body background (quiet near-white neutral) |
| `surface-card` | `#FFFFFF` | Form cards, ticket tables, modal containers with 1px border (`#E2E8F0`) |
| `text-primary` | `#1A2E22` | High contrast dark charcoal-green for body text and headings |
| `text-muted` | `#64748B` | Secondary label text, timestamps, subtitle captions |
| `field-editable-bg` | `#FFFFFF` | Input fields background with 1px neutral border (`#CBD5E1`) |
| `field-readonly-bg` | `#F0F4F1` | Read-only input fields shading |
| `error-red` | `#B91C1C` | Field error message, invalid field border, destructive action button |
| `warning-amber` | `#D97706` | Warning callout background & amber badges |
| `success-green` | `#15803D` | Success alert background, green badges |

---

## 2. Typography & Form Layout Rules

### Typography
- Font Family: Inter, system-ui, -apple-system, sans-serif
- Headings: Bold, `#1A2E22` (h1: 1.75rem, h2: 1.35rem, h3: 1.15rem)
- Field Labels: Medium weight (500), 0.875rem, text-primary, positioned directly above input controls.

### Required Fields & Validation
- Mandatory fields display a red asterisk (`*`) immediately after the field label text.
- Validation messages appear directly beneath the input field in red text (`#B91C1C`, 0.8rem).
- Inputs with errors display a 1.5px red border (`#B91C1C`).

### Form Control States
- **Editable**: White background, 1px `#CBD5E1` border, 6px border-radius, 8px 12px padding.
- **Focused**: 2px `#0B7A46` outline/ring with zero outline offset.
- **Read-Only**: `#F0F4F1` shading, disabled cursor/pointer events, neutral border.
- **Disabled / Busy**: 50% opacity, `not-allowed` cursor, disabled submission button displays a spinner indicator and text "Submitting...".

---

## 3. Button Hierarchy & Badge System

### Button Hierarchy
1. **Primary Button**: `#006B3C` background, white text. Used for "Create Ticket", "Submit Ticket", "Continue".
2. **Secondary Button**: White background, `#006B3C` border & text. Used for "Clear Filters", "Cancel", "Back to My Tickets".
3. **Destructive Button**: `#B91C1C` background or border, red/white text. Used for "Soft Remove Attachment".
4. **Disabled Button**: `#94A3B8` background, cursor `not-allowed`.

### Priority Badges
- **Low**: Background `#F1F5F9`, Text `#475569`
- **Medium**: Background `#FEF3C7`, Text `#D97706` (Amber)
- **High**: Background `#FFEDD5`, Text `#C2410C` (Orange)
- **Urgent**: Background `#FEE2E2`, Text `#991B1B` (Red)

### Status Badges
- **New**: Background `#E0F2FE`, Text `#0369A1` (Blue)
- **In Progress**: Background `#FEF3C7`, Text `#B45309` (Amber)
- **Open**: Background `#EAF6EF`, Text `#006B3C` (Green)
- **Pending**: Background `#F3E8FF`, Text `#6B21A8` (Purple)
- **Resolved**: Background `#DCFCE7`, Text `#15803D` (Dark Green)
- **Closed**: Background `#F1F5F9`, Text `#475569` (Gray)

---

## 4. Screen Layout Specifications

### Screen 1: Development Requester Selection Modal / Banner
- Displays centered card overlay or banner with header "Select Development Requester".
- Informational callout: "Choose a development requester to simulate user context for Lab 2. This is for testing only."
- Dropdown populated with active `RequesterUser` records.
- "Continue" primary button.

### Screen 2: Create Ticket Page
- Top breadcrumb: `My Tickets > Create Ticket`.
- Card container with grid layout:
  - System-generated fields (Read-Only Ticket Number preview `TKT-YYYY-XXXXXX`, Ticket Date).
  - Classification group: Category dropdown & Related System dropdown side-by-side.
  - Requested Priority selection (Radio buttons or Select).
  - Summary input (Single line text).
  - Description input (Multiline textarea, min-height 120px).
  - Attachment Upload section (Drag-and-drop or File input, allowed formats indicator, file preview list with remove trigger).
- Form actions: "Submit Ticket" (Primary), "Cancel" (Secondary).

### Screen 3: My Tickets Screen
- Top section: Search bar input, Category filter, Priority filter, Status filter, "Clear Filters" button, "Create Ticket" primary button.
- Desktop Table View (>= 768px):
  - Columns: Ticket No., Created Date, Summary, Category, Requested Priority, IT Priority, Current Status, Actions.
- Mobile Card View (< 768px):
  - Vertical card stack showing Ticket No., Status Badge, Priority Badge, Category, Summary preview, Created Date.
- Bottom section: Result count (e.g. "Showing 1-10 of 24 tickets") and Pagination controls (Previous, Page Numbers, Next).
- Empty states:
  - "No tickets found" when filters return 0 results (with "Clear Filters" button).
  - "No tickets created yet" when requester has no tickets (with "Create Ticket" button).

### Screen 4: Ticket Detail (View Mode)
- Header breadcrumb: `My Tickets > Ticket Details`.
- Ticket Info Card (Read-Only):
  - Ticket No, Date, Requester Name, Category, Related System, Requested Priority Badge, IT Priority Badge, Current Status Badge.
  - Summary & Description display fields.
- Attachments Card:
  - Active Attachments list: File name, file size, upload date, Download button, Soft-Remove button.
  - Soft-Removed Attachments list: File name, "Removed" badge, Removal reason, timestamp (Download button disabled/hidden).
  - "Add Attachment" trigger modal/button for ticket owner.

---

## 5. Responsive Breakpoint Rules
- **Desktop (>= 992px)**: Multi-column responsive layout, 1200px container width.
- **Tablet (768px - 991px)**: 2-column stacked form, full-width filters, responsive table.
- **Mobile (< 768px)**: Stacked single column, full-width inputs, touch targets >= 44px, table transforms to card stack. No horizontal scrolling.

---

## 6. Visual Inspection Checklist
- [x] Header primary green `#006B3C` applied to app bar.
- [x] Read-only fields shaded `#F0F4F1`.
- [x] Required field asterisks rendered in red `#B91C1C`.
- [x] Field errors appear directly under inputs.
- [x] Priority & Status badges render correct color contrast.
- [x] Mobile viewport displays cards without clipping or overflow.
