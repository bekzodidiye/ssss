# Product Requirements Document (PRD): Paynet Management Platform

## 1. Project Overview
The **Paynet Management Platform** is a comprehensive solution designed to streamline the operations of Paynet outlets. It enables managers to monitor employee performance, track SIM card sales, manage inventory, and maintain real-time communication with operators.

## 2. Target Audience
- **Managers**: Business owners or supervisors who oversee multiple outlets and employees.
- **Operators**: Front-line employees responsible for sales and daily operations at specific locations.

## 3. Technical Stack
- **Frontend**: React.js with Tailwind CSS and Framer Motion.
- **Backend**: Django with Django REST Framework (DRF).
- **Database**: PostgreSQL.
- **Authentication**: JWT (JSON Web Tokens).
- **Real-time**: WebSockets (Django Channels) for live monitoring and messaging.

## 4. User Roles & Permissions

### 4.1 Manager
- Approve/Reject new operator registrations.
- View global sales analytics and performance reports.
- Manage centralized SIM card inventory and distribute stock to operators.
- Set monthly sales targets and office counts.
- Create and update company rules/policies.
- Monitor real-time locations of all operators.
- Send messages to any operator.
- Recalculate monthly achievements and league rankings.

### 4.2 Operator
- Perform daily check-in/check-out with location verification.
- Record SIM card sales (Ucell, Mobiuz, Beeline, Uztelecom).
- View personal sales history and inventory.
- Access company rules and messages from managers.
- View personal rating and achievements.
- Update personal profile information.

## 5. Functional Requirements

### 5.1 Authentication & Profile
- **Registration**: Operators sign up and wait for Manager approval.
- **Login**: Secure login using phone number/email and password.
- **Profile**: Users can update their name, avatar, and contact details.

### 5.2 Attendance (Check-In System)
- Operators must check in upon arrival at their work location.
- System captures GPS coordinates and (optionally) a photo.
- Tracks working hours and late arrivals based on shift settings.

### 5.3 Sales & Inventory Management
- **Sales Logging**: Operators record sales by selecting the carrier, tariff, and count.
- **Inventory Sync**: Sales automatically deduct from the operator's assigned inventory.
- **Stock Distribution**: Managers assign SIM card batches to specific operators.
- **Tariff Management**: Managers define available tariffs for each carrier.

### 5.4 Performance & Ratings
- **League System**: Users are categorized into Gold, Silver, and Bronze leagues based on performance.
- **Achievements**: Automatic awarding of "Top 3" places in each league at the end of the month.
- **Leaderboard**: Real-time ranking of operators based on sales volume.

### 5.5 Communication & Rules
- **Internal Messaging**: Direct messaging between Managers and Operators.
- **Read Receipts**: Tracking if messages have been seen.
- **Rules Engine**: A central repository for company guidelines, accessible to all staff.

### 5.6 Real-time Monitoring
- **Live Map**: Managers can see the last known location of all checked-in operators.
- **Status Indicators**: Visual cues for active, inactive, or late operators.

## 6. Data Models (Django)

### 6.1 User Model
- `role`: ChoiceField (Manager, Operator)
- `is_approved`: BooleanField
- `phone`: CharField (Unique)
- `avatar`: ImageField
- `league`: ChoiceField (Gold, Silver, Bronze)
- `inventory`: JSONField (Stock counts per carrier)
- `working_hours`: JSONField (Shift start/end times)

### 6.2 CheckIn Model
- `user`: ForeignKey to User
- `timestamp`: DateTimeField
- `location_lat`: DecimalField
- `location_lng`: DecimalField
- `photo`: ImageField
- `date`: DateField (for easier querying)

### 6.3 Sale Model
- `user`: ForeignKey to User
- `company`: CharField (Ucell, Mobiuz, etc.)
- `count`: IntegerField
- `bonus`: IntegerField
- `tariff`: CharField
- `date`: DateField
- `created_at`: DateTimeField

### 6.4 InventoryTransaction Model
- `carrier`: CharField
- `count`: IntegerField
- `type`: ChoiceField (Inbound, Distribution, Sale)
- `from_user`: ForeignKey (optional)
- `to_user`: ForeignKey (optional)

### 6.5 Message Model
- `sender`: ForeignKey to User
- `recipient`: ForeignKey to User (or 'Manager' group)
- `text`: TextField
- `is_read`: BooleanField
- `timestamp`: DateTimeField

## 7. API Endpoints (DRF)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register/` | POST | Register new user |
| `/api/auth/login/` | POST | Obtain JWT tokens |
| `/api/users/me/` | GET/PATCH | Current user profile |
| `/api/users/approvals/` | GET/POST | List/Approve pending users (Manager) |
| `/api/checkins/` | GET/POST | Record or list check-ins |
| `/api/sales/` | GET/POST | Record or list sales |
| `/api/inventory/` | GET/POST | Manage stock and distributions |
| `/api/messages/` | GET/POST | Send/Receive messages |
| `/api/rules/` | GET/POST | Manage company rules |
| `/api/reports/daily/` | GET | Daily sales summary |
| `/api/reports/monthly/` | GET | Monthly performance analytics |

## 8. UI/UX Requirements
- **Dark Mode**: Default theme is dark with gold accents (Premium feel).
- **Responsiveness**: Fully functional on mobile and desktop.
- **Animations**: Smooth transitions using Framer Motion.
- **Accessibility**: High contrast text and clear touch targets.

## 9. Security & Compliance
- Data encryption at rest and in transit.
- Role-based access control (RBAC) enforced at the API level.
- Regular backups of the PostgreSQL database.
