# BookVault — Book Management System

**Assessment 2 | IFN636: Software Development, Testing and Configuration**
**Full-Stack MERN Application with Admin-Mediated Workflows, OOP, Design Patterns, CI/CD & Load Balancing**

---

## Overview

BookVault is a full-stack library management system built with **React.js**, **Node.js**, **Express**, and **MongoDB**. It supports two roles — **Admin** and **Customer** — with full CRUD operations, JWT authentication, request-based borrow/return workflows, deletion audit logging, and CI/CD deployment on AWS EC2 behind an Application Load Balancer.

### Assessment 2 — Two New Functionalities

This iteration extends the original Assessment 1 BookVault project with two new functionalities:

1. **Request-Based Borrow/Return Workflow** — Replaces the previous instant borrow/return system with an admin-mediated approval workflow. Users submit borrow requests that admins must approve or decline. Returns must be confirmed by an admin before the book becomes available again.

2. **Deletion History / Audit Log** — Every deletion of a book or user is now automatically recorded in a persistent audit log with a full data snapshot, the identity of the deleting admin, and a timestamp. Admins can review the complete deletion history through a dedicated UI.

---

## Tech Stack

| Layer            | Technology                          |
| ---------------- | ----------------------------------- |
| Frontend         | React.js, Tailwind CSS (dark theme) |
| Backend          | Node.js, Express.js                 |
| Database         | MongoDB Atlas                       |
| Auth             | JWT (JSON Web Tokens, 30-day expiry)|
| Process Manager  | PM2 (cluster mode, `instances: 'max'`) |
| Web Server       | Nginx (reverse proxy)               |
| Load Balancer    | AWS Application Load Balancer       |
| Cloud            | AWS EC2 (Ubuntu, ap-southeast-2)    |
| CI/CD            | GitHub Actions                      |
| Testing          | Mocha, Chai, Sinon (38+ tests)      |
| API Testing      | Postman Collection Runner           |
| Load Testing     | Apache Benchmark (ab)               |

---

## Features

### Authentication & Authorization

- User registration and login with JWT (30-day expiry)
- Role-based access: `admin` and `customer`
- Protected routes via `authMiddleware` and `isAdmin` middleware chain
- Unauthenticated visitors can browse books publicly
- Frontend route protection via `<ProtectedRoute>` and `<AdminRoute>` wrappers

### Customer Panel

- Browse all books with search (title, author, category)
- View book details, reviews, and average rating
- **Submit borrow requests** (new) — status: pending → approved/declined
- **Submit return requests** (new) — status: return_pending → returned
- View own borrow requests in "My Borrow Requests" with colour-coded status badges
- Write reviews with 1–5 star ratings (one review per book)
- Delete own reviews

### Admin Panel

- Dashboard with live stats (total books, available, borrowed, users, **pending requests**)
- Full book CRUD (Create, Read, Update, Delete with **automatic audit logging**)
- **Approve / decline borrow requests** (new)
- **Confirm book returns** (new)
- View all borrow requests in tabbed interface (Pending / Pending Returns / All)
- Manage all users (view, delete with **automatic audit logging**)
- View all currently-borrowed books with borrower details
- **View deletion history** in a dedicated audit log page

---

## New Functionality #1 — Request-Based Borrow/Return Workflow

The previous instant borrow/return system was replaced with an admin-mediated request workflow.

### Status Flow

```
pending → approved or declined  (admin decision)
approved → return_pending        (user requests return)
return_pending → returned        (admin confirms return)
```

### Backend Implementation

**New Model: `BorrowRequest`**
- Fields: `book` (ref), `user` (ref), `status` (enum), `decidedAt`, `returnRequestedAt`, `returnConfirmedAt`, timestamps
- Status enum: `pending`, `approved`, `declined`, `return_pending`, `returned`

**New Controller: `BorrowRequestController`** (extends `BaseController` — OOP inheritance)

| Method            | Route                                                    | Access              |
| ----------------- | -------------------------------------------------------- | ------------------- |
| createRequest     | `POST /api/borrow-requests`                              | Authenticated user  |
| getUserRequests   | `GET /api/borrow-requests/my`                            | Authenticated user  |
| requestReturn     | `POST /api/borrow-requests/:id/return-request`           | Request owner only  |
| getAllRequests    | `GET /api/admin/borrow-requests`                         | Admin only          |
| approveRequest    | `PUT /api/admin/borrow-requests/:id/approve`             | Admin only          |
| declineRequest    | `PUT /api/admin/borrow-requests/:id/decline`             | Admin only          |
| confirmReturn     | `PUT /api/admin/borrow-requests/:id/confirm-return`      | Admin only          |

**Validation enforced:**
- Duplicate active requests → `400 Bad Request`
- Non-owner attempting return request → `403 Forbidden`
- Approving an unavailable book → `400 Bad Request`

### Frontend Implementation

| File                          | Change                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| `BookDetail.jsx`              | "Borrow Book" button replaced with "Request to Borrow"; displays status badge if request exists |
| `MyBooks.jsx`                 | Redesigned as "My Borrow Requests"; active requests as cards, past requests in summary table   |
| `AdminBorrowRequests.jsx` ⭐  | **New page** with three tabs: Pending Requests, Pending Returns, All Requests                  |
| `AdminDashboard.jsx`          | Added "Pending Requests" stat card and "Borrow Requests" navigation button with badge          |
| `App.js`                      | Added route `/admin/borrow-requests` guarded by `AdminRoute`                                   |

---

## New Functionality #2 — Deletion History / Audit Log

Every deletion of a book or user is now recorded in a persistent audit log, providing accountability and audit compliance.

### Backend Implementation

**New Model: `DeletedRecord`**
- Fields: `recordType` (`'book'` or `'user'`), `data` (Mixed — full document snapshot via `toObject()`), `deletedBy` (ref to admin), timestamps

**Controller Changes**

- `BookController.deleteBook` — Before calling `book.deleteOne()`, creates a `DeletedRecord` entry with `recordType: 'book'` and the book's full data
- `AdminController.deleteUser` — Same pattern applied for user deletions
- `AdminController.getHistory` (new) — `GET /api/admin/history` returns all deletion records sorted newest-first, populated with the deleting admin's name and email

### Frontend Implementation

| File                  | Change                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `AdminHistory.jsx` ⭐ | **New page** with tabbed layout (All / Deleted Books / Deleted Users); shows record type, key data fields, deleting admin's name, and timestamp |
| `AdminDashboard.jsx`  | Added "Deletion History" navigation button                                                      |
| `App.js`              | Added route `/admin/history` guarded by `AdminRoute`                                            |

---

## Design Patterns Implemented

Five design patterns are implemented across the backend:

| Pattern        | File(s)                                                          | Purpose                                            |
| -------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| **Singleton**  | `backend/config/db.js`                                           | Guarantees one MongoDB connection ever exists      |
| **Repository** | `backend/repositories/BookRepository.js`, `UserRepository.js`    | Separates data access from controllers             |
| **Observer**   | `backend/events/bookEvents.js`                                   | `book:borrowed` / `book:returned` events           |
| **Adapter**    | `backend/adapters/ExternalBookAdapter.js`                        | Bridges external book sources to internal schema   |
| **Facade**     | `backend/facades/LibraryFacade.js`                               | Exposes high-level methods hiding multi-step logic |

## OOP Principles Implemented

All four OOP principles are demonstrated:

- **Encapsulation** — Private `_generateToken` in `AuthController`; bcrypt hashing hidden in `User` model pre-save hook
- **Inheritance** — `BaseController` parent class with four child controllers: `BookController`, `ReviewController`, `AuthController`, `AdminController`, plus the new `BorrowRequestController`
- **Polymorphism** — `ReviewController.handleError` overrides `BaseController.handleError`
- **Abstraction** — `BaseController` defines abstract-style interface; `LibraryFacade` hides multi-step workflows

---

## Project Structure

```
book-manegmentt/
├── backend/
│   ├── config/                # MongoDB connection (Singleton)
│   ├── controllers/           # BaseController + BookController, AuthController,
│   │                          # ReviewController, AdminController, BorrowRequestController ⭐
│   ├── middleware/            # authMiddleware, isAdmin, RequestLoggerMiddleware
│   ├── models/                # User, Book, Review, BorrowRequest ⭐, DeletedRecord ⭐
│   ├── repositories/          # BookRepository, UserRepository
│   ├── routes/                # authRoutes, bookRoutes, adminRoutes, borrowRequestRoutes ⭐
│   ├── adapters/              # ExternalBookAdapter
│   ├── facades/               # LibraryFacade
│   ├── events/                # bookEvents (Observer Pattern)
│   ├── utils/                 # ResponseFactory
│   ├── test/                  # Mocha test suites (38+ tests passing)
│   ├── .env.example
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, ProtectedRoute, AdminRoute
│   │   ├── context/           # AuthContext
│   │   └── pages/             # Home, Login, Register, BookDetail, MyBooks ⭐,
│   │                          # AdminDashboard ⭐, AdminBooks, AdminUsers, AdminBorrowed,
│   │                          # AdminBorrowRequests ⭐, AdminHistory ⭐, AddBook, EditBook, Browse
│   ├── postcss.config.js
│   └── tailwind.config.js
├── postman/                   # Postman API collection (30 assertions, 100% green)
├── .github/workflows/         # CI/CD pipeline (ci.yml)
├── ecosystem.config.js        # PM2 cluster mode config (instances: 'max')
└── README.md
```

⭐ = New or significantly updated in Assessment 2

---

## API Endpoints

### Authentication

| Method | Endpoint              | Access     | Description                          |
| ------ | --------------------- | ---------- | ------------------------------------ |
| POST   | `/api/auth/register`  | Public     | Register new user (default: customer)|
| POST   | `/api/auth/login`     | Public     | Login and receive JWT + role         |
| GET    | `/api/auth/profile`   | Protected  | Get current user profile             |
| PUT    | `/api/auth/profile`   | Protected  | Update profile                       |

### Books

| Method | Endpoint              | Access     | Description                          |
| ------ | --------------------- | ---------- | ------------------------------------ |
| GET    | `/api/books`          | Public     | List all books                       |
| GET    | `/api/books/:id`      | Public     | Get book detail                      |
| POST   | `/api/books`          | Admin only | Create book                          |
| PUT    | `/api/books/:id`      | Admin only | Update book                          |
| DELETE | `/api/books/:id`      | Admin only | Delete book (creates `DeletedRecord` automatically) ⭐ |

### Borrow Requests ⭐ (New)

| Method | Endpoint                                              | Access              | Description                       |
| ------ | ----------------------------------------------------- | ------------------- | --------------------------------- |
| POST   | `/api/borrow-requests`                                | Authenticated user  | Create a borrow request           |
| GET    | `/api/borrow-requests/my`                             | Authenticated user  | List my borrow requests           |
| POST   | `/api/borrow-requests/:id/return-request`             | Request owner only  | Submit a return request           |
| GET    | `/api/admin/borrow-requests`                          | Admin only          | List all borrow requests          |
| PUT    | `/api/admin/borrow-requests/:id/approve`              | Admin only          | Approve a pending request         |
| PUT    | `/api/admin/borrow-requests/:id/decline`              | Admin only          | Decline a pending request         |
| PUT    | `/api/admin/borrow-requests/:id/confirm-return`       | Admin only          | Confirm a return request          |

### Reviews

| Method | Endpoint                                | Access     | Description                          |
| ------ | --------------------------------------- | ---------- | ------------------------------------ |
| GET    | `/api/books/:id/reviews`                | Public     | List reviews + average rating        |
| POST   | `/api/books/:id/reviews`                | Protected  | Add a review (rating 1-5)            |
| DELETE | `/api/books/:id/reviews/:reviewId`      | Protected  | Delete own review                    |

### Admin

| Method | Endpoint                  | Access     | Description                                          |
| ------ | ------------------------- | ---------- | ---------------------------------------------------- |
| GET    | `/api/admin/users`        | Admin only | List all users                                       |
| DELETE | `/api/admin/users/:id`    | Admin only | Delete user (creates `DeletedRecord` automatically) ⭐ |
| GET    | `/api/admin/borrowed`     | Admin only | List all currently-borrowed books                    |
| GET    | `/api/admin/history` ⭐   | Admin only | View deletion audit log (sorted newest-first)        |

---

## Environment Variables

Create `backend/.env` based on `backend/.env.example`:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5001
```

---

## Local Development

```bash
# Backend
cd backend
npm install
npm start              # runs on http://localhost:5001

# Frontend (separate terminal)
cd frontend
npm install
npm start              # runs on http://localhost:3000

# Run tests
cd backend
npm test               # 38+ Mocha tests
```

---

## EC2 Deployment with Load Balancing

The app runs on **two AWS EC2 instances** (ap-southeast-2a and ap-southeast-2b) behind an **AWS Application Load Balancer**, with **Nginx** on each instance as a reverse proxy and **PM2** in **cluster mode** (`instances: 'max'`) for per-host concurrency.

### Topology

```
Client → AWS Application Load Balancer → Nginx (EC2 instance 1 or 2)
                                              ↓
                                      PM2 Cluster Workers (one per CPU)
                                              ↓
                                          MongoDB Atlas
```

### Nginx Config (on each EC2 instance)

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;   # React build (qq-frontend)
    }

    location /api {
        proxy_pass http://localhost:5001;   # Node backend (qq-backend)
    }
}
```

### PM2 Process Manager

```bash
# Start all processes (uses ecosystem.config.js — cluster mode)
pm2 start ecosystem.config.js --env production

# Verify cluster mode
pm2 list                    # qq-backend should show multiple instances
pm2 save
```

### Manual Deployment Steps (via PuTTY)

```bash
cd ~/book-manegmentt
git stash
git pull origin main
cd frontend
npm install --include=dev
npm run build
cd ..
pm2 restart qq-frontend
pm2 restart qq-backend
pm2 save
```

---

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) triggers on every push to `main` and runs on a self-hosted runner attached to the EC2 instance:

1. **Checkout** code
2. **Setup** Node.js 20
3. **Install** backend dependencies (clean `node_modules`, `npm install`, ensure Mocha binary executable)
4. **Install** frontend dependencies and run `npm run build`
5. **Run** the 38+ test backend test suite via `npm test`
6. **Write** a fresh `.env` file from GitHub secret `PROD`
7. **Deploy** with `pm2 reload ecosystem.config.js --env production` (falls back to `pm2 start` on first run)
8. **Persist** PM2 process list with `pm2 save`
9. **Verify** with `pm2 list`

Because the workflow runs on a self-hosted runner, the same job that builds and tests also deploys — giving genuine continuous deployment, not just continuous integration.

---

## Testing

### Automated Backend Tests (Mocha + Chai + Sinon)

Located in `backend/test/`:

- `bookController.test.js` — Book CRUD + deletion audit logging ⭐
- `borrowReturn.test.js` — Borrow/return workflow
- `requestLogger.test.js` — Request logger middleware
- `reviewController.test.js` — Reviews CRUD
- `adminController.test.js` — Admin user management + deletion audit logging ⭐ + getHistory ⭐
- `borrowRequestController.test.js` ⭐ — New BorrowRequest workflow tests

**Total: 38+ tests, all passing.**

Run tests:

```bash
cd backend
npm test
```

### Postman API Collection

Located in `postman/BookManager_API_Collection.json`:
- 21 requests across 5 folders (Auth, Books, Reviews, Admin, Cleanup)
- 30 automated assertions
- Auto-captures customer and admin JWTs into collection variables
- Pre-request scripts set up test data on the fly
- **Last run: 30/30 passing in 3.97 seconds**

---

## Load Testing

Apache Benchmark (`ab`) used to test the deployed system through the Application Load Balancer.

### Baseline Test
```bash
ab -n 100 -c 10 http://<alb-dns>/api/books
```
**Result:** 63.70 req/s, 156.99 ms mean response time, 0 connection errors

### Higher Load Test
```bash
ab -n 500 -c 50 http://<alb-dns>/api/books
```
**Result:** 95.31 req/s, 524.6 ms mean response time, 0 connection errors

Throughput scales with concurrency; the system demonstrates linear capacity scaling with zero connection errors at both load levels.

---

## Key Changes During Development

### Assessment 2 Iteration

1. **Request-Based Borrow/Return** — Replaced instant borrow with admin-approval workflow (new `BorrowRequest` model + `BorrowRequestController` + 7 endpoints + 4 frontend changes)
2. **Deletion Audit Log** — All book and user deletions now create a `DeletedRecord` snapshot before deletion (new `DeletedRecord` model + updated `BookController`/`AdminController` + new `AdminHistory.jsx` page + new `GET /api/admin/history` endpoint)
3. **AdminController Refactor** — Inline admin route handlers promoted into a proper `AdminController` class extending `BaseController`, with 8 new Mocha tests (FT-24 through FT-31)
4. **PM2 Cluster Mode** — Switched from fork mode (`instances: 1`) to cluster mode (`instances: 'max'`) for true horizontal scaling on each EC2 host
5. **AWS Application Load Balancer** — Deployed across two EC2 instances in different availability zones (ap-southeast-2a and ap-southeast-2b)
6. **CI/CD Hardening** — Expanded from install+test+build into a full continuous-deployment pipeline with PM2 reload step

### Assessment 1 Foundations (Retained)

- Tailwind CSS dark theme across all pages
- `postcss.config.js` for production Tailwind compilation
- PM2 frontend served via `serve -s frontend/build -p 3000`
- Nginx reverse proxy on each EC2 host
- 5 design patterns (Singleton, Repository, Observer, Adapter, Facade) and 4 OOP principles in production code

---

## Group Members

| Name              | Student ID  | Role                                                      |
| ----------------- | ----------- | --------------------------------------------------------- |
| Bader Alharbi     | N11866951   | Team Leader — Backend, Design Patterns, DevOps, Testing   |
| Yuchen Lu         | —           | Frontend Lead — UI, MongoDB Integration, Reviews          |
| Shri Manikandaraj | —           | SRS Lead — Documentation, Postman, Acceptance Testing     |

**Tutorial Group:** Group 33 | **Tutor:** Dr. Ranesh Naha | **Tutorial:** Tuesday 11 AM

---

## Live URL

> http://bookmanager-1596291518.ap-southeast-2.elb.amazonaws.com

(AWS Application Load Balancer DNS — distributes traffic across both EC2 instances)

---

## Repository

> https://github.com/Bader8Alharbi/book-manegmentt

---

## License

This project is developed for academic purposes as part of **IFN636: Software Development, Testing and Configuration** at QUT.
