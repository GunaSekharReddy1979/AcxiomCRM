# AcxiomCRM - Enterprise Sales CRM Platform

AcxiomCRM is a full-stack, enterprise-grade Customer Relationship Management system built to support the complete customer-sales lifecycle with strict Role-Based Access Control (RBAC), analytical dashboards, client & server-side validation, append-only audit logging, and RESTful API architecture.

---

## Architecture Overview

```
Frontend (React 18 + Vite + Bootstrap 5 + Chart.js)
       │
       ▼ (REST API / JWT Bearer)
Express.js Server (Port 5000)
       │
       ├── Middleware (Auth, RBAC, Validation, Error Handling, Audit)
       ├── Controllers
       ├── Services & Business Logic Layer
       ├── Sequelize ORM
       └── MySQL Database (acxiomcrm_db, Port 3306)
```

---

## User Roles & Security Scope

1. **Admin** (`admin@acxiomcrm.com` / `Admin@123`)
   - Unrestricted global access to Dashboard KPIs, all Customers, Leads, Opportunities, Follow-Ups, and Activities.
   - Exclusive access to **User & Role Administration** (employee account creation, role assignments, activation/deactivation, account unlocking).
   - Full access to the immutable **System & Security Audit Log**.

2. **Manager** (`manager@acxiomcrm.com` / `Manager@123`)
   - Supervisory access over all sales pipeline deals, customer accounts, and team activities.
   - Access to management reports, conversion analytics, team activity summaries, and audit logs.
   - Restricted from user credential/role modifications.

3. **Sales Executive** (`sales@acxiomcrm.com` / `Sales@123`)
   - Territory-scoped access strictly limited to **assigned** customer accounts, owned leads, active opportunities, and personal follow-up schedules.
   - Enforced server-side: queries and mutations are filtered by `CreatedBy` or `AssignedTo`.

---

## Key Modules & Features

### 1. Authentication & Security
- **Bcrypt Password Hashing**: Adaptive salt hashing. Plain-text passwords never stored or logged.
- **Password Policy**: Minimum 8 characters, requiring uppercase, lowercase, numeric digits, and special characters (`@$!%*?&`).
- **Account Lockout**: Automatically locks an account for 15 minutes after 5 consecutive failed login attempts, recording security events in the audit log. Admins can manually unlock accounts.
- **JWT Authorization**: Stateless tokens with payload containing user role and identity.

### 2. Role-Based Dashboard
- **8 KPI Cards**:
  1. Total Customers
  2. Total Leads
  3. Open Leads
  4. Total Deals
  5. Open Deals
  6. Won Deals
  7. Lost Deals
  8. Total Pipeline Value (and Weighted Pipeline Value)
- **3 Chart.js Visualizations**:
  - Opportunity Pipeline Stages (Bar Chart)
  - Lead Qualification Status (Doughnut Chart)
  - Monthly Sales Revenue (Area Line Chart)
- **Upcoming Follow-Ups & Recent Activities**: Real-time operational widgets.
- **Date Filtering**: Today, This Week, This Month, All Time.

### 3. Customer Management
- **Master Data**: Customer Code (`CUST-1001`), Customer Name, Email, Phone, Company, Address, City, State, Status (`Active`/`Inactive`), Owner.
- **Validations**: Uniqueness on Email and Phone, duplicate company-customer prevention, format checks.
- **Customer Details**: Tabulated view with associated opportunities, scheduled follow-ups, and engagement timeline.

### 4. Lead Capture & Conversion Workflow
- **Lead Capture**: Source, status (`New`, `Contacted`, `Qualified`, `Unqualified`, `Converted`, `Lost`), priority, and expected value.
- **Conversion Workflow**: One-click promotion of Qualified leads into registered **Customer Accounts** and simultaneous creation of active **Opportunity Deals**, with full audit logging.

### 5. Opportunity & Weighted Pipeline Management
- **Fields**: Opportunity Name, Customer, Amount, Stage (`Qualification`, `Proposal`, `Negotiation`, `Won`, `Lost`), Probability (0–100%), Expected Close Date.
- **Weighted Value Calculation**: `Weighted Value = Amount × Probability / 100` dynamically computed and displayed in table and detail views.
- **Business Rules**: Active opportunity Amount must be > 0; Probability must be between 0 and 100; Expected close date cannot be in the past.

### 6. Follow-Up Scheduling & Tracking
- **Interaction Types**: Call, Meeting, Email, Task.
- **Statuses**: Planned, Completed, Missed, Cancelled.
- **Business Rule**: New/planned follow-up cannot have a date earlier than today.
- **Lifecycle Actions**: Schedule, Mark as Completed, Reschedule, or Cancel with reason logging.

### 7. Activity Timeline
- Multi-channel touchpoint logging (Call, Meeting, Email, Task) with chronological timeline and tabular views.

### 8. Analytics & Reports
1. **Customer Report**: Status, owner, creation date.
2. **Lead Report**: Source, qualification status, conversion rate.
3. **Follow-Up Report**: Planned, completed, missed, and overdue activities.
4. **Opportunity Report**: Stage, deal value, probability, expected close date.
5. **Pipeline Report**: Stage-wise and owner-wise breakdown with weighted valuations.
6. **Conversion Report**: Lead-to-customer efficiency and opportunity win/loss metrics.
7. **User Activity Report**: Activity count breakdown per employee (Admin/Manager).
8. **Audit Report**: Searchable compliance log (Admin/Manager).
- **CSV Export**: One-click export for all reports.

### 9. Append-Only Audit Logging
- Immutable log recording User, Timestamp, Action (`LOGIN`, `FAILED_LOGIN`, `LOCKOUT`, `CREATE`, `UPDATE`, `DELETE`, `ROLE_CHANGE`, `LEAD_CONVERSION`, `COMPLETE_FOLLOWUP`, `RESCHEDULE_FOLLOWUP`), Module, Record ID, IP Address, and JSON diffs (`OldValue` vs `NewValue`).
- Built-in JSON payload inspector.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL Server (v8.0+) running on port 3306

### Database Configuration
Ensure MySQL has a database named `acxiomcrm_db` (or create via `CREATE DATABASE acxiomcrm_db;`).
Update `backend/.env` if your credentials differ:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=acxiomcrm_db
```

### Seeding Data
Run database synchronization and seed realistic enterprise CRM records:
```bash
cd backend
node utils/seed.js
```

### Running Backend API Server
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

### Running Frontend Application
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

---

## Automated Acceptance Test Suite

An automated test suite is included in `backend/utils/acceptanceTest.js` covering all 16 acceptance criteria specified in the project requirements:
```bash
cd backend
node utils/acceptanceTest.js
```

**Verification Results:**
- Scenario 1: Unauthenticated request rejected (401)
- Scenario 2: Valid Admin login succeeds with JWT
- Scenario 3: Invalid password rejected (401)
- Scenario 4: Account lockout triggers after 5 failed attempts (403)
- Scenario 6: Server-side validation rejects invalid email format (400)
- Scenario 7: Opportunity Amount <= 0 rejected (400)
- Scenario 8: Probability > 100 rejected (400)
- Scenario 9: Past close date for active opportunity rejected (400)
- Scenario 10: New follow-up with past date rejected (400)
- Scenario 11: Sales Executive blocked from admin endpoints (403) and scoped
- Scenario 12: Manager accesses team pipeline reports
- Scenario 13: Admin accesses user administration and audit logs
- Scenario 14: Mutation generates append-only AuditLog entry
- Scenario 15: Authorized `/api/customers` returns valid JSON array
- Scenario 16: Dashboard returns 8 KPI cards and 3 Chart.js datasets
- **Result:** `16 PASSED, 0 FAILED`
