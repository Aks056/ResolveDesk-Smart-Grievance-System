# Smart Grievance System - Frontend (React + Vite)

A modern, responsive Single Page Application (SPA) for the **Smart Grievance Redressal System** — a college campus grievance redressal portal.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
The Vite development server starts on `http://localhost:5173` and proxies `/api` and `/uploads` to the Spring Boot backend at `http://localhost:8081`.

### 3. Build for Production
```bash
npm run build
```
Outputs to `Frontend/dist`.

---

## 🛠️ Tech Stack & Key Libraries

* **Core**: React 19 + Vite
* **UI Components**: shadcn-style components built on Radix UI (`radix-ui`) — Card, Sheet, Tabs, Table, Select, Badge, Button, Input, Textarea, Checkbox, Dropdown Menu, Progress
* **Styling**: Tailwind CSS + `tailwindcss-animate`
* **State Management**: Redux Toolkit (`@reduxjs/toolkit` + `react-redux`)
* **Routing**: React Router DOM v7 (`createBrowserRouter` data API)
* **API Client**: Axios (auto Bearer-token request interceptor + 401/403 logout interceptor)
* **Charts**: Recharts
* **Toast Notifications**: Sonner
* **Icons**: Lucide React

---

## 👥 Portals & Navigation

Routing in `App.jsx` is **role-aware**: once authenticated, `/dashboard` renders the citizen dashboard for students and the officer dashboard for officers.

* **Login & Registration**: `/login`, `/register` (public)
* **Citizen Dashboard**: `/dashboard` (when logged in as Student / `ROLE_USER`)
* **Officer Department Portal**: `/officer` or `/officer-dashboard` (Officer / Admin)
* **Admin Control Center**: `/admin` and `/recent-grievances` (recent feed, admin assignment & triage actions)
* **Grievances**: `/grievances` (mine), `/grievances/new` (submit), `/grievances/:id` (details + audit history)
* **Profile**: `/profile` (profile + password management)
