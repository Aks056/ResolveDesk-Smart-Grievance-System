# Smart Grievance System - Frontend (React 18 + Vite)

A modern, responsive Single Page Application (SPA) for the **Smart Grievance Redressal System**.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
The Vite development server will start on `http://localhost:5173`.

### 3. Build for Production
```bash
npm run build
```

---

## 🛠️ Tech Stack & Key Libraries

* **Core**: React 18 + Vite
* **UI Components**: Shadcn UI (Card, Sheet, Tabs, Table, Select, Badge, Button, Input, Textarea)
* **Styling**: Tailwind CSS + `tailwindcss-animate`
* **State Management**: Redux Toolkit (`@reduxjs/toolkit` + `react-redux`)
* **Routing**: React Router DOM v7
* **API Client**: Axios (with auto Bearer token interceptor)
* **Toast Notifications**: Sonner
* **Icons**: Lucide React

---

## 👥 Portals & Navigation

* **Citizen Dashboard**: `/dashboard` (when logged in as Citizen / User)
* **Officer Department Portal**: `/dashboard` or `/officer` (when logged in as Officer)
* **Admin Control Center**: `/admin` (when logged in as Admin)
* **Login & Registration**: `/login`, `/register`
