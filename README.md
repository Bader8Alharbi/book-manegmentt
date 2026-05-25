# BookVault — Book Management System

**Assessment 1.2 | IFN636 | Full-Stack CRUD Application with DevOps Practices**

---

## Overview

BookVault is a full-stack library management system built with **React.js**, **Node.js**, **Express**, and **MongoDB**. It supports two roles — **Admin** and **Customer** — with full CRUD operations, JWT authentication, borrow/return workflows, and CI/CD deployment on AWS EC2.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Auth | JWT (JSON Web Tokens) |
| Process Manager | PM2 |
| Web Server | Nginx (reverse proxy) |
| Cloud | AWS EC2 (Ubuntu) |
| CI/CD | GitHub Actions |

---

## Features

### Authentication & Authorization
- User registration and login with JWT
- Role-based access: `admin` and `customer`
- Protected routes via `authMiddleware`
- Unauthenticated users can browse books publicly

### Customer Panel
- Browse all books with search (title, author, category)
- View book details
- Borrow available books
- Return borrowed books
- View personal borrowed books list (`My Books`)

### Admin Panel
- Dashboard with live stats (total books, available, borrowed, users)
- Full book CRUD (Create, Read, Update, Delete)
- Manage all users (view, delete)
- View all borrowed books

---

## Project Structure

```
book-manegmentt/
├── backend/
│   ├── config/          # MongoDB connection
│   ├── controllers/     # authController, bookController, reviewController
│   ├── middleware/      # authMiddleware, RequestLoggerMiddleware
│   ├── models/          # User, Book, Review schemas
│   ├── repositories/    # BookRepository, UserRepository
│   ├── routes/          # authRoutes, bookRoutes, adminRoutes
│   ├── adapters/        # ExternalBookAdapter
│   ├── facades/         # LibraryFacade
│   ├── events/          # bookEvents
│   ├── utils/           # ResponseFactory
│   ├── test/            # Jest test suites
│   ├── .env.example
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/  # Navbar, ProtectedRoute, AdminRoute
│   │   ├── context/     # AuthContext
│   │   └── pages/       # All page components
│   ├── postcss.config.js
│   └── tailwind.config.js
├── .github/workflows/   # CI/CD pipeline
├── ecosystem.config.js  # PM2 config
└── README.md
```

---

## API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |

### Books
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/books` | Public |
| GET | `/api/books/:id` | Public |
| POST | `/api/books` | Admin only |
| PUT | `/api/books/:id` | Admin only |
| DELETE | `/api/books/:id` | Admin only |
| POST | `/api/books/:id/borrow` | Customer only |
| POST | `/api/books/:id/return` | Customer only |

### Admin
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/admin/users` | Admin only |
| DELETE | `/api/admin/users/:id` | Admin only |
| GET | `/api/admin/borrowed` | Admin only |

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
npm start

# Frontend
cd frontend
npm install
npm start
```

---

## EC2 Deployment

The app runs on AWS EC2 (Ubuntu) behind Nginx as a reverse proxy.

### Nginx Config
```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://localhost:5001;
    }
}
```

### PM2 Process Manager
```bash
# Start all processes
pm2 start ecosystem.config.js --env production

# Serve frontend build
pm2 start serve --name qq-frontend -- -s frontend/build -p 3000

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
```

---

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) triggers on every push to `main`:

1. Checkout code
2. Setup Node.js 20
3. Install backend dependencies
4. Install frontend dependencies and build
5. Run backend tests
6. Create `.env` from GitHub secret `PROD`
7. Deploy with PM2

---

## Changes Made During Development

### 1. GitHub Setup
- Pushed codebase to `https://github.com/Bader8Alharbi/book-manegmentt.git`
- Confirmed `.env` is excluded via `.gitignore` (credentials protected)

### 2. EC2 Deployment Fixes
- Fixed 502 Bad Gateway caused by `qq-frontend` crashing
- Installed `serve` globally (`npm install -g serve`)
- Fixed PM2 frontend start command — replaced broken `-l 3000` flag with `-p 3000`:
  ```bash
  pm2 start serve --name qq-frontend -- -s frontend/build -p 3000
  ```

### 3. Tailwind CSS Fix
- Added missing `postcss.config.js` to frontend — without it Tailwind classes were not compiled into the production build

### 4. UI Redesign — Modern Dark Theme
Redesigned all pages from a plain white/blue theme to a modern dark slate/indigo theme:

| File | Changes |
|------|---------|
| `Navbar.jsx` | Dark gradient navbar, BookVault branding, cleaner nav links |
| `Home.jsx` | Dark hero with gradient, dark book cards with hover glow |
| `Login.jsx` | Dark glassmorphism card, indigo accents |
| `Register.jsx` | Matching dark card style |
| `BookDetail.jsx` | Dark layout, styled status badges |
| `AdminDashboard.jsx` | Dark stat cards with color-coded sections |
| `AdminBooks.jsx` | Dark table with hover rows, styled action buttons |
| `AdminUsers.jsx` | Dark table matching AdminBooks style |
| `MyBooks.jsx` | Dark book cards, orange return button |
| `AddBook.jsx` | Dark form with styled inputs |
| `EditBook.jsx` | Dark form matching AddBook |
| `Browse.jsx` | Dedicated browse page (accessible via `/browse`) |

### 5. Navigation Fix
- Removed duplicate "Books" navbar link that pointed to the same page as "Home"
- Added then removed "Browse" link after confirming it was redundant with Home

---

## Testing

Backend tests located in `backend/test/`:
- `bookController.test.js`
- `borrowReturn.test.js`
- `requestLogger.test.js`
- `reviewController.test.js`

Run tests:
```bash
cd backend
npm test
```

---

## Live URL

> http://\<your-ec2-public-ip\>
