# Campus Life — Enterprise Campus Event & Ticketing Platform

> A production-ready, full-stack MERN event lifecycle, ticketing, and fraud-proof admission system engineered for universities and collegiate institutions.

---

## 🌟 Key Architecture & Capabilities

1. **Role-Based Access Control (RBAC):**
   - **Student:** Discover campus events, pick interactive seats, register for free or paid entry passes, download encrypted QR admission passes, submit post-event feedback, and download verified attendance certificates.
   - **Club Admin:** Create events with Google Gemini AI descriptions, configure custom auditorium seating layouts & tier prices, assign and revoke volunteer scanner staff, export attendee rosters to CSV, view sentiment analysis reports, and request bank payouts.
   - **Volunteer:** High-speed mobile QR code scanner with camera integration (`html5-qrcode`), offline PWA attendee caching with IndexedDB, and event-scoped check-in authorization.
   - **Super Admin:** Institution-wide event oversight, fraud detection logs, revenue reconciliation, and bank payout disbursement approval.

2. **Security & Cryptography:**
   - **HttpOnly Dual-Token Strategy:** Short-lived (15m) Access JWT + long-lived (7d) Refresh JWT with automated silent rotation interceptor.
   - **Tamper-Proof QR Codes:** Cryptographic HMAC SHA-256 and signed JWT tokens embedded directly into admission QR codes.
   - **Privileged Registration Protection:** Public signup is restricted to Students; Volunteer and Club Admin accounts require verification passkeys (`VOLUNTEER_INVITE_CODE`, `CLUB_ADMIN_INVITE_CODE`), while Super Admin accounts cannot be created via public registration.
   - **Volunteer Access Expiry:** Volunteers are bound to specific events; once an event status transitions to `COMPLETED`, volunteer scanner access is automatically revoked and staff are demoted back to `student`.

3. **Auditorium Seating & Flexible Payments:**
   - **Seat Selection Toggle:** Switch between General Admission and Reserved Seating per event.
   - **Dynamic Auditorium Arrangement:** Custom sections (VIP, General, Balcony, etc.), configurable rows, seat counts, and manual individual seat pricing.
   - **Pay-What-You-Want / Custom Contribution:** Allows attendees to enter custom donation amounts ($\ge$ base price) during checkout.
   - **Razorpay Payment Gateway:** Integrated order creation, signature verification, and PDF Tax Invoice generation via PDFKit.

4. **Offline Capability & Attendance Verification:**
   - **Progressive Web App (PWA):** Workbox service worker caching and offline scanner manifest storage using IndexedDB.
   - **Automated Certificate Generation:** Instant verifiable attendance certificates generated via PDFKit upon check-in verification.
   - **AI-Powered Sentiment Analysis:** Google Gemini analyzes post-event attendee reviews and ratings to produce executive perception summaries and actionable improvement reports.

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** v18+ (tested on Node v20 & v24)
- **MongoDB** local instance or MongoDB Atlas cluster

### 2. Environment Configuration

#### Backend (`server/.env`)

```ini
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/campus_life
JWT_ACCESS_SECRET=your_jwt_access_secret_key_32_bytes_min
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_32_bytes_min
JWT_QR_SECRET=your_jwt_qr_secret_key_tamper_proof_32_bytes
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
VOLUNTEER_INVITE_CODE=CAMPUS_VOLUNTEER_2026
CLUB_ADMIN_INVITE_CODE=CAMPUS_CLUB_ADMIN_2026
RAZORPAY_KEY_ID=rzp_test_campuslife123
RAZORPAY_KEY_SECRET=rzp_test_secret_campuslife456
GEMINI_API_KEY=your_gemini_api_key
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=test@ethereal.email
SMTP_PASS=ethereal_password
SMTP_FROM="Campus Life" <tickets@campuslife.edu>
```

#### Frontend (`client/.env.production`)

```ini
VITE_API_URL=https://your-backend-api.com/api
```

### 3. Running the Application

```bash
# Start Backend API
cd server
npm install
npm run dev

# Start Frontend Client (in a separate terminal)
cd client
npm install
npm run dev
```

- **Backend Server:** `http://localhost:3000`
- **Frontend App:** `http://localhost:5173`

---

## 📡 Complete REST API Documentation

### 🔐 Authentication & Accounts (`/api/auth`)

| Method | Endpoint             | Access        | Description                                                    |
| :----- | :------------------- | :------------ | :------------------------------------------------------------- |
| `POST` | `/api/auth/register` | Public        | Register new user. Supports `inviteCode` for privileged roles. |
| `POST` | `/api/auth/login`    | Public        | Authenticate user & issue HttpOnly JWT cookies.                |
| `POST` | `/api/auth/refresh`  | Public        | Silently rotate access token using refresh cookie.             |
| `POST` | `/api/auth/logout`   | Authenticated | Revoke refresh token & clear cookies.                          |
| `GET`  | `/api/auth/me`       | Authenticated | Retrieve current user profile and role details.                |

### 🎭 Events Management (`/api/events`)

| Method   | Endpoint                                  | Access                   | Description                                                                     |
| :------- | :---------------------------------------- | :----------------------- | :------------------------------------------------------------------------------ |
| `GET`    | `/api/events`                             | Public                   | Filter and search published events (category, club, search term).               |
| `GET`    | `/api/events/:id`                         | Public                   | Retrieve event details including pricing, deadline, and seating requirements.   |
| `GET`    | `/api/events/admin/my-events`             | Club Admin / Super Admin | List all events organized by the authenticated club or campus.                  |
| `POST`   | `/api/events`                             | Club Admin / Super Admin | Create a new event with optional seating arrangement and registration deadline. |
| `PUT`    | `/api/events/:id`                         | Club Admin / Super Admin | Update event details, sync seat prices, or mark `status: COMPLETED`.            |
| `DELETE` | `/api/events/:id`                         | Club Admin / Super Admin | Delete an event.                                                                |
| `POST`   | `/api/events/:id/banner`                  | Club Admin / Super Admin | Upload event banner image (`multipart/form-data`).                              |
| `POST`   | `/api/events/ai/description`              | Club Admin / Super Admin | Generate rich marketing copy using Google Gemini AI.                            |
| `GET`    | `/api/events/:id/attendees/export`        | Club Admin / Volunteer   | Export checked-in and registered attendee rosters to CSV.                       |
| `POST`   | `/api/events/:id/volunteers`              | Club Admin / Super Admin | Assign a volunteer student by email to this event.                              |
| `DELETE` | `/api/events/:id/volunteers/:volunteerId` | Club Admin / Super Admin | Remove volunteer from this event and revoke scanning permissions.               |

### 🪑 Auditorium Seating (`/api/seats`)

| Method  | Endpoint                                  | Access                   | Description                                                         |
| :------ | :---------------------------------------- | :----------------------- | :------------------------------------------------------------------ |
| `GET`   | `/api/seats/event/:eventId`               | Authenticated            | Fetch interactive auditorium seat map and live availability status. |
| `POST`  | `/api/seats/hold`                         | Authenticated            | Temporarily hold a seat for 5 minutes during checkout.              |
| `POST`  | `/api/seats/release/:seatId`              | Authenticated            | Release a currently held seat.                                      |
| `POST`  | `/api/seats/event/:eventId/configure`     | Club Admin / Super Admin | Define custom sections, rows, seat quantities, and tier prices.     |
| `PATCH` | `/api/seats/:seatId/price`                | Club Admin / Super Admin | Update the individual price of a specific seat.                     |
| `PATCH` | `/api/seats/event/:eventId/section-price` | Club Admin / Super Admin | Update tier pricing across an entire seating section.               |

### 🎫 Registrations & Admissions (`/api/registrations`)

| Method   | Endpoint                        | Access                | Description                                                             |
| :------- | :------------------------------ | :-------------------- | :---------------------------------------------------------------------- |
| `POST`   | `/api/registrations`            | Authenticated         | Concurrency-safe ticket registration (enforces deadline & capacity).    |
| `GET`    | `/api/registrations/my-tickets` | Authenticated         | List all active and past admission passes for the logged-in student.    |
| `GET`    | `/api/registrations/:id`        | Authenticated / Staff | Get full ticket pass details including encrypted QR payload.            |
| `DELETE` | `/api/registrations/:id`        | Authenticated         | Cancel a booked registration (restores event capacity & releases seat). |

### 💳 Payments & Invoicing (`/api/payments`)

| Method | Endpoint                            | Access        | Description                                                              |
| :----- | :---------------------------------- | :------------ | :----------------------------------------------------------------------- |
| `POST` | `/api/payments/order`               | Authenticated | Initialize checkout order (supports manual "Pay What You Want" amount).  |
| `POST` | `/api/payments/verify`              | Authenticated | Verify Razorpay HMAC signature and generate encrypted QR admission pass. |
| `GET`  | `/api/payments/:identifier/invoice` | Authenticated | Generate and download official PDF Tax Invoice.                          |

### 📷 Check-In & Scanner (`/api/checkin`)

| Method | Endpoint                         | Access            | Description                                                     |
| :----- | :------------------------------- | :---------------- | :-------------------------------------------------------------- |
| `POST` | `/api/checkin/verify`            | Volunteer / Staff | Verify signed QR token, validate event status, and grant entry. |
| `GET`  | `/api/checkin/manifest/:eventId` | Volunteer / Staff | Download attendee roster for offline PWA scanner caching.       |
| `POST` | `/api/checkin/sync-offline`      | Volunteer / Staff | Batch-sync offline check-ins recorded in IndexedDB.             |
| `GET`  | `/api/checkin/history`           | Volunteer / Staff | View chronological scan history and audit trail.                |

### 📜 Attendance Certificates (`/api/certificates`)

| Method | Endpoint                                     | Access        | Description                                                               |
| :----- | :------------------------------------------- | :------------ | :------------------------------------------------------------------------ |
| `GET`  | `/api/certificates/:registrationId/download` | Authenticated | Download official PDF attendance certificate with verification signature. |
| `GET`  | `/api/certificates/verify/:ticketCode`       | Public        | Publicly verify legitimacy of a student attendance certificate.           |

### 💬 Post-Event Feedback & AI Sentiment (`/api/feedback`)

| Method | Endpoint                                     | Access                   | Description                                                                 |
| :----- | :------------------------------------------- | :----------------------- | :-------------------------------------------------------------------------- |
| `POST` | `/api/feedback`                              | Authenticated            | Submit star rating (1–5) and written attendee review for checked-in events. |
| `GET`  | `/api/feedback/registration/:registrationId` | Authenticated            | Retrieve submitted feedback for a specific pass.                            |
| `GET`  | `/api/feedback/event/:eventId/report`        | Club Admin / Super Admin | Gemini AI executive perception analysis and sentiment breakdown.            |

### 💰 Financial Ledger & Payout Settlements (`/api/settlements`)

| Method  | Endpoint                            | Access                   | Description                                                                 |
| :------ | :---------------------------------- | :----------------------- | :-------------------------------------------------------------------------- |
| `GET`   | `/api/settlements/summary`          | Club Admin / Super Admin | View gross revenue, platform fee deduction (5%), and net available balance. |
| `POST`  | `/api/settlements/request`          | Club Admin / Super Admin | Submit a wire transfer payout request to society bank account.              |
| `PATCH` | `/api/settlements/:payoutId/status` | Super Admin              | Review, approve, or disburse bank payouts.                                  |

### 📊 Dashboard & System (`/api/dashboard`, `/health`)

| Method | Endpoint                 | Access        | Description                                                           |
| :----- | :----------------------- | :------------ | :-------------------------------------------------------------------- |
| `GET`  | `/api/dashboard/summary` | Authenticated | Role-scoped analytical dashboard counters and activity summaries.     |
| `GET`  | `/health`                | Public        | Healthcheck endpoint for container orchestration and uptime monitors. |

---

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite, React Router v7, Tailwind CSS v4 (`@theme`), Lucide Icons, HTML5-QRCode, Vite PWA (Workbox).
- **Backend:** Node.js, Express.js (ES Modules), Mongoose, Helmet, Cookie-Parser, Nodemailer, Mailgen, PDFKit, QRCode, Razorpay SDK.
- **AI Integration:** Google Gemini API (`@google/generative-ai`) for description generation and attendee sentiment reports.
- **Database:** MongoDB / MongoDB Atlas.

---

## 📄 License

MIT License. Designed and maintained for university event management and collegiate organizations.
