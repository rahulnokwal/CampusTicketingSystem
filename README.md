# Campus Life — Event Management & QR Ticketing Platform

> A production-grade Event Management & QR Ticketing Platform designed for university campuses.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC):**
   - **Student:** Discover events, register for free or paid tickets, view high-resolution QR admission passes, manage attendance.
   - **Club Admin:** Create and manage club events, set seat capacity, upload banners, generate rich descriptions with **Google Gemini AI**.
   - **Volunteer:** High-speed QR admission scanner powered by device camera (`html5-qrcode`) with real-time green/red admission feedback and fraud prevention.
   - **Super Admin:** Campus-wide event oversight, check-in audit records, and revenue tracking.

2. **Security & Authentication Architecture:**
   - **HttpOnly Dual-Token Strategy:** Short-lived (15 min) Access JWT + Long-lived (7 day) Refresh JWT with SHA-256 token hashing and rotation.
   - **Silently Retried Axios Interceptor:** Catches 401 errors, auto-refreshes tokens, and replays pending API calls.
   - **Tamper-Proof QR Tickets:** Signed cryptographic JWT embedded in QR codes; verified on arrival to prevent duplicate entries.

3. **Payments & Email Dispatch:**
   - Simulated payment order workflow for paid tickets with instant concurrency lock (`$lt: capacity`).
   - Transactional email dispatch via **Nodemailer** & **Mailgen** with embedded QR pass attachment.

4. **Modern UI/UX:**
   - Styled with **Tailwind CSS v4 `@theme`** tokens (`--color-brand`, `--color-canvas`, etc.).
   - Reusable primitives: `<Button>`, `<Input>`, `<Card>`, `<Badge>`, and global `ToastContext`.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **MongoDB** running locally on port 27017

### 2. Start the Backend API
```bash
cd server
npm install
npm run dev
```
*API runs on `http://localhost:5000`*

### 3. Start the Frontend Application
```bash
cd client
npm install
npm run dev
```
*Vite client runs on `http://localhost:5173`*

---

## 🔑 Demo Accounts (Pre-Seeded)

| Role | Email | Password |
|---|---|---|
| **Student** | `student@campus.edu` | `password123` |
| **Club Admin** | `club@campus.edu` | `password123` |
| **Volunteer** | `volunteer@campus.edu` | `password123` |
| **Super Admin** | `admin@campus.edu` | `password123` |

*(Quick demo buttons are also provided directly on the Login screen for 1-click access)*

---

## 📡 API Endpoints Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new campus user |
| `POST` | `/api/auth/login` | Public | Authenticate and issue httpOnly cookies |
| `POST` | `/api/auth/refresh` | Public | Rotate refresh token |
| `POST` | `/api/auth/logout` | Authenticated | Revoke refresh token & clear cookies |
| `GET` | `/api/auth/me` | Authenticated | Fetch current profile |
| `GET` | `/api/events` | Public | Search & list events with filters |
| `GET` | `/api/events/:id` | Public | Get single event details |
| `POST` | `/api/events` | Club Admin | Create a new event |
| `POST` | `/api/events/ai/description` | Club Admin | Generate description with Google Gemini AI |
| `POST` | `/api/payments/order` | Student | Initialize checkout order |
| `POST` | `/api/registrations` | Student | Concurrency-safe ticket registration & QR generation |
| `GET` | `/api/registrations/my-tickets` | Student | List user's booked tickets |
| `POST` | `/api/checkin/verify` | Volunteer | Verify QR payload & grant venue entry |
| `GET` | `/api/dashboard/summary` | Authenticated | Role-scoped aggregate metrics |

