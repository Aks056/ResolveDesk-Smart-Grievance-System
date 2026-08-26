# Smart Grievance System - Frontend Documentation

This document provides a comprehensive overview of the Smart Grievance System's frontend architecture, component structure, state management, and user interaction flows.

---

## 🚀 Technology Stack

* **Framework**: [React 18](https://reactjs.org/)
* **Build Tool & Bundler**: [Vite](https://vitejs.dev/)
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
├── public/                 # Static assets and icons
├── src/
│   ├── components/
│   │   ├── layout/         # Navbar, Footer, MainLayout
│   │   ├── ui/             # Shadcn UI primitives (card, tabs, sheet, table, etc.)
│   │   ├── ProtectedRoute.jsx # Redux auth-guarded wrapper
│   │   └── ScrollToTop.jsx # Route change scroll reset
│   ├── lib/
│   │   ├── api.js          # Axios instance and centralized API client methods
│   │   └── utils.js        # Tailwind className merge helper (cn)
│   ├── pages/
│   │   ├── DashboardPage.jsx        # Citizen & Admin central dashboard
│   │   ├── OfficerDashboardPage.jsx # Dedicated Officer Department Console
│   │   ├── GrievanceDetailsPage.jsx # Individual ticket timeline & details
│   │   ├── MyGrievancesPage.jsx     # Citizen submitted grievances list
│   │   ├── NewGrievancePage.jsx     # Multipart complaint submission form
│   │   ├── LoginPage.jsx            # User authentication
│   │   ├── RegisterPage.jsx         # Citizen registration form
│   │   └── ProfilePage.jsx          # User settings and credential management
│   ├── store/
│   │   ├── authSlice.js    # JWT token, user object & login/logout reducers
│   │   └── index.js        # Redux store config
│   ├── App.jsx             # Main Router configuration
│   └── main.jsx            # Entry point
└── tailwind.config.js      # Custom theme colors and tokens
```

---

## 👮 Officer Portal (`OfficerDashboardPage.jsx`)

The Officer Dashboard is designed specifically for departmental grievance officers to manage, claim, and resolve grievances under their jurisdiction.

```mermaid
flowchart TD
    subgraph Dashboard [Officer Dashboard]
        KPI[4 Stat Cards: Pool, Active, Resolved, SLA]
        Tabs[Shadcn Tabs: Queue | Workload | History]
    end

    subgraph Actions [Officer Operations]
        T1[Dept Queue ➔ 'Accept & Start']
        T2[My Workload ➔ 'Resolve / Reject']
        T3[Resolved History ➔ 'View Case']
    end

    subgraph Drawer [Resolution Slide-over Drawer]
        Summary[Citizen Info & Description]
        Attachment[Evidence Attachment Preview]
        Form[Outcome Dropdown + Mandatory Remarks]
        Submit[PUT /api/grievances/id/status]
    end

    Tabs --> T1
    Tabs --> T2
    Tabs --> T3
    T1 -->|Assign to Me & Set IN_PROGRESS| Tabs
    T2 --> Drawer
    Drawer --> Submit
    Submit -->|Refresh Stats & Workload| Dashboard
```

### Key Components of Officer Portal:
1. **KPI Stat Cards**:
   * **Department Pool**: Number of unassigned tickets waiting in queue.
   * **My Active Tasks**: Number of tickets currently in progress by the logged-in officer.
   * **Resolved by Me**: Total resolved cases.
   * **SLA Warnings**: Number of active tickets that have exceeded their priority turnaround time.
2. **Tabbed Workflow**:
   * **Department Queue**: Table of unassigned department tickets with an **"Accept & Start"** button.
   * **My Active Workload**: Table of active cases with a **"Resolve / Reject"** button.
   * **Resolved History**: Historical archive of completed outcomes and recorded remarks.
3. **Resolution Slide-over Drawer**:
   * Powered by Shadcn `Sheet`.
   * Displays full description, citizen testimony, and image/document attachment viewer.
   * Compulsory `resolutionRemarks` textarea with live character validation.

---

## 🔐 Role-Aware Navigation & Routing

In `App.jsx`, the `/dashboard` path dynamically renders the correct view based on the user's authenticated role:

```jsx
const DashboardRoute = () => {
  const { user } = useSelector((state) => state.auth);
  if (user?.role === 'OFFICER') {
    return <OfficerDashboardPage />;
  }
  return <DashboardPage />;
};
```

Explicit paths `/officer` and `/officer-dashboard` are also routed directly to `OfficerDashboardPage`.
