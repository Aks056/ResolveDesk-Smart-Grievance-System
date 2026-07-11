import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  LayoutDashboard, Clock, CheckCircle2, AlertCircle, FileText, Plus, Bell, MoreHorizontal,
  TrendingUp, TrendingDown, Layers, Building2, Ticket, ArrowRight, UserPlus, Search, Ghost,
  AlertTriangle, X, UserCheck, ArrowUp, ArrowDown, ArrowUpDown, ThumbsUp
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line
} from 'recharts';
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent 
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ 
    totalGrievances: 0, 
    resolvedGrievances: 0, 
    pendingGrievances: 0, 
    inProgressGrievances: 0 
  });
  const [recentGrievances, setRecentGrievances] = useState([]);
  const [allGrievances, setAllGrievances] = useState([]);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [sortField, setSortField] = useState(null); // 'date' or 'priority'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [selectedGrievanceIds, setSelectedGrievanceIds] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [activeQuickViewGrievance, setActiveQuickViewGrievance] = useState(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [searchTerm, setSearchTerm] = useState("");
  
  // Real-time Notification simulation
  useEffect(() => {
    if (!loading && recentGrievances.length > 0) {
      const timer = setTimeout(() => {
        toast.info(`System Update: Data Synchronized`, {
          description: `Active records refreshed successfully at ${new Date().toLocaleTimeString()}`,
          icon: <Bell className="w-4 h-4 text-primary" />
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, recentGrievances.length]);
  
  const parseDate = (date) => {
    if (Array.isArray(date)) {
      return new Date(date[0], date[1] - 1, date[2], date[3] || 0, date[4] || 0, date[5] || 0);
    }
    return new Date(date);
  };

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const role = user?.role?.toLowerCase() || 'user';
        // Cache-busting with a timestamp query param
        const statsRes = await api.get(`/dashboard/${role}?t=${refreshKey}`);
        setStats(statsRes.data || { 
          totalGrievances: 0, 
          resolvedGrievances: 0, 
          pendingGrievances: 0, 
          inProgressGrievances: 0 
        });
        
        const recentRes = await api.get(`/grievances/recent?t=${refreshKey}`);
        const sortedRecent = (recentRes.data || []).sort((a, b) => parseDate(b.createdAt) - parseDate(a.createdAt));
        setRecentGrievances(sortedRecent);

        // Fetch full grievances list based on user role to compute SLA breach & unassigned counts
        let grievancesData = [];
        if (user?.role === 'ADMIN') {
          const allRes = await api.get(`/grievances/all?t=${refreshKey}`);
          grievancesData = allRes.data || [];
          try {
            const officersRes = await api.get('/grievances/officers');
            setOfficers(officersRes.data || []);
          } catch (err) {
            console.error("Failed to fetch officers", err);
          }
        } else if (user?.role === 'OFFICER') {
          const assignedRes = await api.get(`/grievances/assigned?t=${refreshKey}`);
          grievancesData = assignedRes.data || [];
        } else if (user) {
          const myRes = await api.get(`/grievances/my?t=${refreshKey}`);
          grievancesData = myRes.data || [];
        }
        setAllGrievances(grievancesData);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, refreshKey]);

  // Calculate SLA-breached (escalated) grievances and unassigned pending grievances
  const SLA_LIMIT_MS = 48 * 60 * 60 * 1000; // 48 business/calendar hours
  
  const escalatedGrievances = useMemo(() => {
    return allGrievances.filter(g => {
      const isUnresolved = ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(g.status);
      const createdTime = parseDate(g.createdAt).getTime();
      return isUnresolved && (Date.now() - createdTime) > SLA_LIMIT_MS;
    });
  }, [allGrievances]);

  const escalatedCount = escalatedGrievances.length;

  const unassignedPendingCount = useMemo(() => {
    return allGrievances.filter(g => g.status === 'PENDING' && !g.assignedOfficerId).length;
  }, [allGrievances]);

  // Display officers list with fallback dummy values if empty
  const displayOfficers = useMemo(() => {
    return officers.length > 0 ? officers : [
      { id: 101, fullName: "Dr. Alok Mishra", departmentName: "Electricity Dept" },
      { id: 102, fullName: "Prof. Sunita Sharma", departmentName: "Academic Section" },
      { id: 103, fullName: "Er. Ramesh Verma", departmentName: "Water Works" },
      { id: 104, fullName: "Dr. Rajesh Gupta", departmentName: "Medical & Health" }
    ];
  }, [officers]);

  // Sort and Filter logic for the Recent Grievances table
  const processedGrievances = useMemo(() => {
    let result = recentGrievances.filter(g => 
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortField === 'date') {
      result.sort((a, b) => {
        const dateA = parseDate(a.createdAt);
        const dateB = parseDate(b.createdAt);
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else if (sortField === 'priority') {
      const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      result.sort((a, b) => {
        const weightA = priorityWeight[a.priority] || 0;
        const weightB = priorityWeight[b.priority] || 0;
        if (weightA === weightB) {
          return parseDate(b.createdAt) - parseDate(a.createdAt);
        }
        return sortDirection === 'asc' ? weightA - weightB : weightB - weightA;
      });
    }
    return result;
  }, [recentGrievances, searchTerm, sortField, sortDirection]);

  // Bulk Selection Helpers
  const isAllSelected = processedGrievances.length > 0 && processedGrievances.every(g => selectedGrievanceIds.includes(g.id));
  
  const handleSelectAll = () => {
    if (isAllSelected) {
      const visibleIds = processedGrievances.map(g => g.id);
      setSelectedGrievanceIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      const visibleIds = processedGrievances.map(g => g.id);
      setSelectedGrievanceIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleSelectRow = (id, event) => {
    event.stopPropagation();
    setSelectedGrievanceIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Sorting Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-50 ml-1 inline-block" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 text-primary ml-1 inline-block" /> 
      : <ArrowDown className="h-3 w-3 text-primary ml-1 inline-block" />;
  };

  // Action Handlers from Table
  const handleToggleUpvote = async (grievanceId) => {
    const grievance = recentGrievances.find(g => g.id === grievanceId);
    if (!grievance) return;

    const previouslyUpvoted = grievance.hasUpvoted || false;
    const previousCount = grievance.upvoteCount || 0;

    const nextUpvoted = !previouslyUpvoted;
    const nextCount = previouslyUpvoted ? Math.max(0, previousCount - 1) : previousCount + 1;

    const updateGrievanceState = (list) => 
      list.map(g => g.id === grievanceId ? { ...g, hasUpvoted: nextUpvoted, upvoteCount: nextCount } : g);

    setRecentGrievances(prev => updateGrievanceState(prev));
    setAllGrievances(prev => updateGrievanceState(prev));

    try {
      const response = await api.post(`/grievances/${grievanceId}/upvote`);
      const serverGrievance = response.data;
      const updateFromServer = (list) =>
        list.map(g => g.id === grievanceId ? { 
          ...g, 
          hasUpvoted: serverGrievance.hasUpvoted, 
          upvoteCount: serverGrievance.upvoteCount 
        } : g);
      setRecentGrievances(prev => updateFromServer(prev));
      setAllGrievances(prev => updateFromServer(prev));
    } catch (err) {
      console.error("Failed to toggle upvote", err);
      toast.error("Failed to update upvote. Please try again.");
      const revertGrievanceState = (list) =>
        list.map(g => g.id === grievanceId ? { ...g, hasUpvoted: previouslyUpvoted, upvoteCount: previousCount } : g);
      setRecentGrievances(prev => revertGrievanceState(prev));
      setAllGrievances(prev => revertGrievanceState(prev));
    }
  };

  const handleDeleteGrievanceFromTable = async (grievanceId) => {
    if (window.confirm(`Are you sure you want to delete ticket #GRV-${String(grievanceId).padStart(4, '0')}?`)) {
      try {
        setLoading(true);
        await api.delete(`/grievances/${grievanceId}`);
        toast.success("Ticket deleted successfully");
        setRefreshKey(Date.now());
        setSelectedGrievanceIds(prev => prev.filter(id => id !== grievanceId));
      } catch (err) {
        console.error("Failed to delete grievance", err);
        toast.error("Failed to delete ticket");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAssignOfficerFromTable = async (grievanceId, officerId) => {
    try {
      setLoading(true);
      if (officerId) {
        await api.post(`/admin/grievances/${grievanceId}/assign/${officerId}`);
        toast.success("Officer assigned successfully");
        setRefreshKey(Date.now());
      }
    } catch (err) {
      console.error("Failed to assign officer", err);
      toast.error("Failed to assign officer");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignOfficerFromDrawer = async () => {
    if (!activeQuickViewGrievance || !selectedAssigneeId) {
      toast.error("Please select an officer to assign");
      return;
    }
    try {
      setLoading(true);
      await api.post(`/admin/grievances/${activeQuickViewGrievance.id}/assign/${selectedAssigneeId}`);
      toast.success("Officer assigned successfully");
      
      const updatedOfficer = officers.find(o => o.id === parseInt(selectedAssigneeId));
      setActiveQuickViewGrievance(prev => ({
        ...prev,
        status: 'ASSIGNED',
        assignedOfficerId: selectedAssigneeId,
        assignedOfficerName: updatedOfficer ? updatedOfficer.fullName : prev.assignedOfficerName
      }));
      
      setRefreshKey(Date.now());
    } catch (err) {
      console.error("Failed to assign officer from drawer", err);
      toast.error("Failed to assign officer");
    } finally {
      setLoading(false);
    }
  };

  // Department Workload Data (Horizontal Bar Chart)
  const departmentWorkloadData = useMemo(() => [
    { name: 'Academic Section', active: 18, fill: '#6366f1' },
    { name: 'Electricity Dept', active: 12, fill: '#f59e0b' },
    { name: 'Water Works', active: 8, fill: '#3b82f6' },
    { name: 'Medical & Health', active: 15, fill: '#ef4444' }
  ], []);

  // Resolution Trend Data (Line Chart) over last 7 days
  const resolutionTrendData = useMemo(() => [
    { day: 'Mon', created: 12, resolved: 8 },
    { day: 'Tue', created: 19, resolved: 14 },
    { day: 'Wed', created: 15, resolved: 16 },
    { day: 'Thu', created: 22, resolved: 18 },
    { day: 'Fri', created: 30, resolved: 21 },
    { day: 'Sat', created: 18, resolved: 24 },
    { day: 'Sun', created: 14, resolved: 15 }
  ], []);

  // Chart Data
  const statusData = useMemo(() => [
    { name: 'Resolved', value: stats.resolvedGrievances || 0, color: '#22c55e' },
    { name: 'Pending', value: stats.pendingGrievances || 0, color: '#eab308' },
    { name: 'In Progress', value: stats.inProgressGrievances || 0, color: '#6366f1' },
    { name: 'Rejected', value: stats.rejectedGrievances || 0, color: '#ef4444' },
    { name: 'Archived', value: stats.closedByUserGrievances || 0, color: '#f43f5e' },
  ].filter(item => item.value > 0), [stats]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/80 backdrop-blur-md border border-border/50 p-3 rounded-xl shadow-2xl ring-1 ring-black/5 space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
          {payload.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
              <span className="text-sm font-bold">
                {item.value} <span className="text-[10px] text-muted-foreground font-medium">{item.name === 'created' ? 'Tickets Created' : item.name === 'resolved' ? 'Tickets Resolved' : 'Active Tickets'}</span>
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const premiumColors = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const departmentData = useMemo(() => {
    const counts = {};
    recentGrievances.forEach(g => {
      counts[g.departmentName] = (counts[g.departmentName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value], index) => ({ 
      name, 
      value,
      fill: premiumColors[index % premiumColors.length]
    }));
  }, [recentGrievances]);

  // Configuration lookup mappings for status and priority styling
  const statusConfig = {
    RESOLVED: {
      label: 'Resolved',
      classes: 'bg-emerald-100/80 text-emerald-800 border-emerald-200/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/30'
    },
    PENDING: {
      label: 'Pending',
      classes: 'bg-amber-100/80 text-amber-800 border-amber-200/30 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/30'
    },
    IN_PROGRESS: {
      label: 'In Progress',
      classes: 'bg-blue-100/80 text-blue-800 border-blue-200/30 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/30'
    },
    REJECTED: {
      label: 'Rejected',
      classes: 'bg-rose-100/80 text-rose-800 border-rose-200/30 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/30'
    },
    CLOSED_BY_USER: {
      label: 'Archived',
      classes: 'bg-slate-100/80 text-slate-700 border-slate-200/30 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/30'
    }
  };

  const priorityConfig = {
    HIGH: {
      label: 'High',
      dotClass: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
      classes: 'bg-rose-50/50 text-rose-700 border-rose-200/30 dark:bg-rose-950/10 dark:text-rose-300 dark:border-rose-900/20'
    },
    MEDIUM: {
      label: 'Medium',
      dotClass: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
      classes: 'bg-amber-50/50 text-amber-700 border-amber-200/30 dark:bg-amber-950/10 dark:text-amber-300 dark:border-amber-900/20'
    },
    LOW: {
      label: 'Low',
      dotClass: 'bg-slate-400',
      classes: 'bg-slate-50/50 text-slate-600 border-slate-200/30 dark:bg-slate-800/20 dark:text-slate-300 dark:border-slate-700/20'
    }
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || {
      label: status,
      classes: 'bg-slate-100 text-slate-800 border-slate-200'
    };
    return (
      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.classes} transition-all duration-300`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const config = priorityConfig[priority] || {
      label: priority,
      dotClass: 'bg-slate-400',
      classes: 'bg-slate-50 text-slate-600 border-slate-200'
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${config.classes} transition-all duration-300`}>
        <span className={`h-2 w-2 rounded-full ${config.dotClass}`} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <main className="container max-w-7xl mx-auto p-6 md:p-10 space-y-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-bold tracking-wider uppercase text-[10px]">
                AKTU Student Grievance Portal
              </Badge>
              <div className="h-4 w-[1px] bg-border mx-1" />
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                System Live
              </div>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tighter text-slate-900 dark:text-zinc-50">
              Welcome back, {user?.firstName || 'User'}!
            </h2>
            <p className="text-muted-foreground/80 max-w-lg text-sm font-medium">
              Your personalized grievance dashboard is up to date. 
              You have <span className="text-foreground font-bold">{(stats?.pendingGrievances || 0) + (stats?.inProgressGrievances || 0)}pending grievances</span> requiring attention.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              className="h-12 px-6 gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-lg shadow-indigo-500/20 hover:shadow-[0_0_20px_rgba(79,70,229,0.6)] transition-all font-bold text-sm active:scale-95 group border-none relative overflow-hidden"
              onClick={() => navigate(isAdmin ? '/recent-grievances' : '/grievances/new')}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              {isAdmin ? (
                <UserCheck className="w-4 h-4 transition-transform duration-300 relative z-10" />
              ) : (
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300 relative z-10" />
              )}
              <span className="relative z-10">
                {isAdmin ? 'Assign Pending Tickets' : 'Register New Grievance'}
              </span>
            </Button>
          </div>
        </header>

        {/* SLA Breach Alert Banner */}
        {isAdmin && escalatedCount > 0 && !alertDismissed && (
          <Alert variant="destructive" className="border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/10 text-rose-800 dark:text-rose-300 flex items-start gap-3 pr-12 relative animate-in fade-in slide-in-from-top-4 duration-300">
            <AlertTriangle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <AlertTitle className="text-sm font-extrabold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                SLA Breached Tickets Warning
              </AlertTitle>
              <AlertDescription className="text-xs font-semibold text-rose-700/90 dark:text-rose-400/90">
                There are <span className="font-extrabold underline">{escalatedCount} ticket{escalatedCount > 1 ? 's' : ''}</span> that have exceeded the 48-hour SLA resolution window. Please assign or resolve them immediately.
              </AlertDescription>
            </div>
            <button 
              onClick={() => setAlertDismissed(true)} 
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <Card className="relative overflow-hidden group border-none shadow-sm ring-1 ring-border hover:ring-red-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-500/10 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Escalated Tickets</CardTitle>
              <div className="p-2 rounded-lg bg-red-500/5 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                <AlertCircle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black tracking-tight text-red-500">{escalatedCount}</div>
                {isAdmin && escalatedCount > 0 && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full animate-pulse">
                    Critical
                  </div>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Overdue (&gt;48h)</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group border-none shadow-sm ring-1 ring-border hover:ring-green-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/10 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Resolved</CardTitle>
              <div className="p-2 rounded-lg bg-green-500/5 text-green-500 group-hover:bg-green-500 group-hover:text-white transition-all">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black tracking-tight text-green-500">{stats.resolvedGrievances || 0}</div>
                {isAdmin && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                    <TrendingUp className="h-3 w-3" /> ↑ 4
                  </div>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Successfully closed</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group border-none shadow-sm ring-1 ring-border hover:ring-indigo-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/10 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">In Progress</CardTitle>
              <div className="p-2 rounded-lg bg-indigo-500/5 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                <Clock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black tracking-tight text-indigo-500">{stats.inProgressGrievances || 0}</div>
                {isAdmin && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    Active
                  </div>
                )}
              </div>
              <Progress value={stats.totalGrievances ? (stats.inProgressGrievances / stats.totalGrievances) * 100 : 0} className="h-1.5 bg-indigo-500/10" />
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group border-none shadow-sm ring-1 ring-border hover:ring-yellow-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-500/10 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Pending</CardTitle>
              <div className="p-2 rounded-lg bg-yellow-500/5 text-yellow-500 group-hover:bg-yellow-500 group-hover:text-white transition-all">
                <AlertCircle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black tracking-tight text-yellow-500">{stats.pendingGrievances || 0}</div>
                {isAdmin && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                    <TrendingUp className="h-3 w-3" /> High
                  </div>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {unassignedPendingCount} are currently unassigned
              </p>
              <Progress value={stats.totalGrievances ? (stats.pendingGrievances / stats.totalGrievances) * 100 : 0} className="h-1.5 bg-yellow-500/10" />
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Department Workload - Horizontal Bar Chart */}
          <Card className="border-none shadow-sm ring-1 ring-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-indigo-500" />
                Department Workload
              </CardTitle>
              <CardDescription>Active tickets assigned per department node</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical" 
                  data={departmentWorkloadData}
                  margin={{ left: 10, right: 20, top: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted)/0.3)" />
                  <XAxis 
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={110}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'currentColor', opacity: 0.05 }}
                    content={<CustomTooltip />}
                  />
                  <Bar 
                    dataKey="active" 
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  >
                    {departmentWorkloadData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Resolution Trend - Line Chart */}
          <Card className="border-none shadow-sm ring-1 ring-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                Resolution Trend
              </CardTitle>
              <CardDescription>Comparison of tickets created vs resolved over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={resolutionTrendData}
                  margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted)/0.3)" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle" 
                    formatter={(value) => <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{value === 'created' ? 'Tickets Created' : 'Tickets Resolved'}</span>}
                  />
                  <Line 
                    type="monotone"
                    dataKey="created" 
                    name="created"
                    stroke="#6366f1" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line 
                    type="monotone"
                    dataKey="resolved" 
                    name="resolved"
                    stroke="#22c55e" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm ring-1 ring-border bg-card">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold">Recent Grievances</CardTitle>
              <CardDescription>Track your most recently submitted issues</CardDescription>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Filter by title, status..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/30"
                />
              </div>
              <Button variant="ghost" size="sm" className="hidden sm:flex text-primary hover:text-primary hover:bg-primary/5 font-bold shrink-0" onClick={() => navigate('/recent-grievances')}>
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium text-muted-foreground animate-pulse">Synchronizing records...</span>
                </div>
              </div>
            ) : recentGrievances.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      {isAdmin && (
                        <TableHead className="w-[50px] pl-4">
                          <Checkbox 
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                          />
                        </TableHead>
                      )}
                      <TableHead className="w-[120px]">ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead 
                        className="cursor-pointer select-none hover:bg-muted/30 transition-colors"
                        onClick={() => handleSort('priority')}
                      >
                        <div className="flex items-center gap-1">
                          Priority {getSortIcon('priority')}
                        </div>
                      </TableHead>
                      <TableHead className="text-center">Upvotes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead 
                        className="text-right cursor-pointer select-none hover:bg-muted/30 transition-colors"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Date {getSortIcon('date')}
                        </div>
                      </TableHead>
                      {isAdmin && (
                        <TableHead className="text-right pr-4">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedGrievances.map((g) => (
                      <TableRow 
                        key={g.id} 
                        className={cn(
                          "group hover:bg-primary/[0.02] active:bg-primary/[0.05] transition-colors cursor-pointer",
                          g.priority === 'HIGH' && "bg-red-50/50 dark:bg-red-950/10 hover:bg-red-100/50 dark:hover:bg-red-950/20"
                        )}
                        onClick={() => navigate(`/grievances/${g.id}`)}
                      >
                        {isAdmin && (
                          <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                            <Checkbox 
                              checked={selectedGrievanceIds.includes(g.id)}
                              onChange={(e) => handleSelectRow(g.id, e)}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-mono text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
                          #GRV-{String(g.id).padStart(4, '0')}
                        </TableCell>
                        <TableCell className="font-semibold max-w-[200px] truncate">{g.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {g.departmentName}
                          </div>
                        </TableCell>
                        <TableCell>{getPriorityBadge(g.priority)}</TableCell>
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 px-2.5 gap-1.5 rounded-lg font-bold text-xs transition-all duration-300",
                              g.hasUpvoted 
                                ? "text-primary bg-primary/10 hover:bg-primary/20 shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                            )}
                            onClick={() => handleToggleUpvote(g.id)}
                          >
                            <ThumbsUp className={cn("h-3.5 w-3.5", g.hasUpvoted && "fill-current")} />
                            <span>{g.upvoteCount || 0}</span>
                          </Button>
                        </TableCell>
                        <TableCell>{getStatusBadge(g.status)}</TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs font-medium">
                          {parseDate(g.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-3 text-xs font-bold uppercase tracking-wider border-primary/20 text-primary hover:bg-primary/5 rounded-lg"
                                onClick={() => {
                                  setActiveQuickViewGrievance(g);
                                  setSelectedAssigneeId(g.assignedOfficerId?.toString() || "");
                                }}
                              >
                                View
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted/80">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-card border">
                                  <DropdownMenuItem onClick={() => navigate(`/grievances/${g.id}`)} className="cursor-pointer font-bold text-xs uppercase tracking-wider">
                                    Full Details
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="cursor-pointer font-bold text-xs uppercase tracking-wider">
                                      Assign Officer
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="bg-card border max-h-60 overflow-y-auto w-56">
                                      {officers.length > 0 ? (
                                        officers.map(off => (
                                          <DropdownMenuItem 
                                            key={off.id} 
                                            onClick={() => handleAssignOfficerFromTable(g.id, off.id)}
                                            className="cursor-pointer text-xs font-semibold"
                                          >
                                            {off.fullName} ({off.departmentName || 'No Dept'})
                                          </DropdownMenuItem>
                                        ))
                                      ) : (
                                        <div className="p-2 text-center text-xs text-muted-foreground font-medium">No officers available</div>
                                      )}
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>

                                  <DropdownMenuSeparator />
                                  
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteGrievanceFromTable(g.id)}
                                    className="text-red-600 focus:text-red-600 cursor-pointer font-bold text-xs uppercase tracking-wider"
                                  >
                                    Delete Ticket
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-6 border-2 border-dashed rounded-xl border-muted/50 bg-muted/10">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                  <div className="p-5 rounded-full bg-background border shadow-sm relative z-10">
                    <Ghost className="h-10 w-10 text-muted-foreground/60 animate-bounce" style={{ animationDuration: '3s' }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-bold text-xl text-foreground/90">No Grievances Found</h3>
                  <p className="text-muted-foreground text-sm max-w-[320px] mx-auto leading-relaxed">
                    {searchTerm ? "No tickets match your search criteria. Try a different filter." : "The tracking system is currently clear. You haven't submitted any reports yet."}
                  </p>
                </div>
                {!searchTerm && (
                  <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all font-bold group" onClick={() => navigate('/grievances/new')}>
                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" /> Register New Grievance
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Quick View Drawer Sheet */}
      <Sheet open={!!activeQuickViewGrievance} onOpenChange={(open) => {
        if (!open) {
          setActiveQuickViewGrievance(null);
          setSelectedAssigneeId("");
        }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col h-full justify-between pb-8">
          <div className="space-y-6 overflow-y-auto pr-2 flex-1">
            <SheetHeader>
              <div className="flex items-center justify-between gap-4 mt-2">
                <span className="text-xs font-mono font-black text-primary/70 tracking-widest bg-primary/5 px-2 py-1 rounded-md">
                  #GRV-{activeQuickViewGrievance ? String(activeQuickViewGrievance.id).padStart(4, '0') : ""}
                </span>
                {activeQuickViewGrievance && getStatusBadge(activeQuickViewGrievance.status)}
              </div>
              <SheetTitle className="text-2xl font-black tracking-tight leading-tight mt-2">
                {activeQuickViewGrievance?.title}
              </SheetTitle>
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                {activeQuickViewGrievance?.departmentName}
              </div>
            </SheetHeader>

            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Grievance Description</h4>
              <p className="text-sm font-medium text-foreground/80 leading-relaxed bg-muted/20 border border-border/40 p-4 rounded-xl">
                {activeQuickViewGrievance?.description}
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <span>Date Filed</span>
                <span className="text-foreground">
                  {activeQuickViewGrievance && parseDate(activeQuickViewGrievance.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <span>Priority</span>
                <span className="text-foreground">
                  {activeQuickViewGrievance && getPriorityBadge(activeQuickViewGrievance.priority)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <span>Assigned Officer</span>
                <span className="text-foreground font-semibold">
                  {activeQuickViewGrievance?.assignedOfficerName || "Pending Assignment"}
                </span>
              </div>
            </div>
          </div>

          {/* Assignment Dropdown and Submit */}
          {isAdmin && activeQuickViewGrievance && (
            <div className="space-y-4 pt-4 border-t border-border/40 bg-card">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Assign To Officer</label>
                <Select value={selectedAssigneeId} onValueChange={setSelectedAssigneeId}>
                  <SelectTrigger className="w-full h-11 rounded-xl bg-background border border-border text-sm font-semibold">
                    <SelectValue placeholder="Select an officer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {displayOfficers.map(off => (
                      <SelectItem key={off.id} value={off.id.toString()} className="font-semibold text-xs cursor-pointer">
                        {off.fullName} ({off.departmentName || 'No Dept'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleAssignOfficerFromDrawer}
                disabled={loading || !selectedAssigneeId}
                className="w-full h-11 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg hover:shadow-primary/20 transition-all cursor-pointer"
              >
                {loading ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DashboardPage;
