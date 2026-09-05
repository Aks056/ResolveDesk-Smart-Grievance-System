# Smart Grievance System - Frontend Documentation

This document provides a comprehensive overview of the Smart Grievance System's frontend architecture, component structure, state management, and user interaction flows.

---

## 🚀 Technology Stack

* **Framework**: [React 19](https://react.dev/)
* **Build Tool & Bundler**: [Vite](https://vitejs.dev/) (dev server proxies `/api` and `/uploads` to the Spring Boot backend at `http://localhost:8081`)
* **Styling**:
  * [Tailwind CSS 3.4](https://tailwindcss.com/) with custom dimensional themes.
  * [Shadcn UI](https://ui.shadcn.com/) (Radix UI primitives for Sheet, Tabs, Table, Card, Dialog, Select, Badge, Input, Textarea).
  * [Lucide React](https://lucide.dev/) for icons.
  * [Sonner](https://sonner.emilkowal.ski/) for toast notifications.
* **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) (`authSlice`).
* **Routing**: [React Router DOM v7](https://reactrouter.com/) (Browser router with role-aware route guarding).
* **HTTP Client**: [Axios](https://axios-http.com/) with request/response interceptors.
* **Charts & Analytics**: [Recharts](https://recharts.org/).

---

## 📁 Component & Directory Structure

```text
Frontend/
├── src/
│   ├── components/
│   │   ├── layout/         # Navbar, Footer, MainLayout
│   │   ├── ui/             # Shadcn UI primitives (card, tabs, sheet, table, select, badge, button, input, textarea, checkbox, dropdown-menu, progress)
│   │   ├── CoreNarrative.jsx      # Product description / hero block
│   │   ├── NewGrievanceModal.jsx  # (shared) grievance creation UI used by pages
│   │   ├── ProtectedRoute.jsx     # Redux auth-guarded wrapper
│   │   └── ScrollToTop.jsx       # Route change scroll reset
│   ├── lib/
│   │   ├── api.js          # Axios instance + centralized API helpers (profile, dashboard, grievance ops)
│   │   └── utils.js        # Tailwind className merge helper (`cn`) + radix classnames
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx        # Citizen / student dashboard (recent feed, charts, stats)
│   │   ├── OfficerDashboardPage.jsx # Officer department console (KPI cards, 3-tab queue, resolution drawer)
│   │   ├── RecentGrievancesPage.jsx # Recent / global grievance gallery (admin triage UI)
│   │   ├── MyGrievancesPage.jsx     # Citizen submitted grievances list
│   │   ├── NewGrievancePage.jsx     # Multipart complaint submission form
│   │   ├── GrievanceDetailsPage.jsx # Individual ticket timeline & details
│   │   ├── ProfilePage.jsx          # User profile + credential management
│   │   └── PrivacyPolicyPage.jsx    # Privacy / redressal policy page
│   ├── store/
│   │   ├── authSlice.js    # JWT token, user object & login/logout reducers
│   │   └── index.js        # Redux store config
│   ├── App.jsx             # createBrowserRouter route definitions & role-aware guards
│   └── main.jsx            # Entry point
└── tailwind.config.js      # Custom theme colors and tokens
```

---

## 👮 Officer Portal (`OfficerDashboardPage.jsx`)

The Officer Dashboard is designed specifically for departmental grievance officers to manage, claim, and resolve grievances under their jurisdiction.

```mermaid
flowchart TD
    subgraph Dashboard [Officer Dashboard]
        KPI[4 Stat Cards: Pool, Active, Resolved, SLA Breach]
        Tabs[Shadcn Tabs: DEPT_POOL | MY_TASKS | RESOLVED]
    end

    subgraph Actions [Officer Operations]
        T1[Dept Queue ➔ 'Accept & Start']
        T2[My Workload ➔ 'Resolve / Reject']
        T3[Resolved History ➔ 'View Case']
    end

    subgraph Drawer [Resolution Slide-over Drawer]
        Summary[Ticket details & description]
        Attachment[Evidence attachment preview]
        Form[Outcome dropdown RESOLVED/REJECTED + mandatory resolution remarks]
        Submit[PUT /api/grievances/{id}/status]
    end

    Tabs --> T1
    Tabs --> T2
    Tabs --> T3
    T1 -->|Assign to me & set IN_PROGRESS| Tabs
    T2 --> Drawer
    Drawer --> Submit
    Submit -->|Refresh stats & workload| Dashboard
```

#### 1. KPI Stat Cards
* **Department Pool** — unassigned tickets waiting in the officer's department queue.
* **My Active Tasks** — tickets currently in progress by the logged-in officer.
* **Resolved by Me** — total cases resolved by the officer.
* **SLA Breached** — active tickets that have exceeded their priority turnaround window (`HIGH` 7 days, `MEDIUM` 15 days, `LOW` 30 days).

#### 2. Tabbed Workflow (`GET /api/grievances/assigned?scope=...`)
* **Department Queue** (`DEPT_POOL`) — table of unassigned department tickets with an **"Accept & Start"** button (transitions to `IN_PROGRESS`).
* **My Active Workload** (`MY_TASKS`) — table of active assigned cases with a **"Resolve / Reject"** button.
* **Resolved History** (`RESOLVED`) — historical archive of completed outcomes and recorded remarks.

#### 3. Resolution Slide-over Drawer (Shadcn `Sheet`)
* Shows ticket summary, description, and evidence attachment preview.
* Outcome dropdown (`RESOLVED` / `REJECTED`) with **mandatory resolution remarks** (live validation; server rejects missing remarks on `/api/grievances/{id}/status`).
* Status change is recorded in `grievance_history` and notifies the student via the async email service.
---

## 🔐 Role-Aware Navigation & Routing

In `App.jsx`, the `/dashboard` path renders the correct view based on the authenticated role (student dashboard vs officer dashboard):

```jsx
const DashboardRoute = () => {
  const { user } = useSelector((state) => state.auth);
  if (user?.role === 'OFFICER') {
    return <OfficerDashboardPage />;
  }
  return <DashboardPage />;
};
```

Other explicitly routed pages:
* `/officer` and `/officer-dashboard` → `OfficerDashboardPage`
* `/admin` and `/recent-grievances` → `RecentGrievancesPage` (recent gallery + admin triage UX)
* `/grievances` → `MyGrievancesPage`
* `/grievances/new` → `NewGrievancePage`
* `/grievances/:id` → `GrievanceDetailsPage`
* `/profile` → `ProfilePage`
* `/privacy-policy` → `PrivacyPolicyPage`
* `/login`, `/register` → public pages (guarded to redirect authenticated users)
