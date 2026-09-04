import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { 
  getOfficerDashboardStats, 
  getAssignedGrievances, 
  acceptGrievance, 
  updateGrievanceStatus 
} from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { 
  Inbox, Clock, CheckCircle2, AlertTriangle, PlayCircle, CheckSquare, 
  Search, RefreshCw, Paperclip, ExternalLink, Calendar, User, Building2, 
  ShieldCheck, ArrowUpRight, Flame
} from 'lucide-react';

const OfficerDashboardPage = () => {
  const { user } = useSelector((state) => state.auth);

  // Stats state
  const [stats, setStats] = useState({
    deptUnassignedCount: 0,
    myActiveTasksCount: 0,
    myResolvedCount: 0,
    slaBreachedCount: 0,
    departmentName: user?.departmentName || ''
  });

  // Table & Tab state
  const [activeTab, setActiveTab] = useState("queue");
  const [deptQueue, setDeptQueue] = useState([]);
  const [myWorkload, setMyWorkload] = useState([]);
  const [resolvedHistory, setResolvedHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Resolution Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState("RESOLVED");
  const [resolutionRemarks, setResolutionRemarks] = useState("");
  const [submittingResolution, setSubmittingResolution] = useState(false);

  // Fetch Dashboard Stats & Lists
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, poolRes, workloadRes, resolvedRes] = await Promise.all([
        getOfficerDashboardStats().catch(() => ({ data: null })),
        getAssignedGrievances('DEPT_POOL').catch(() => ({ data: [] })),
        getAssignedGrievances('MY_TASKS').catch(() => ({ data: [] })),
        getAssignedGrievances('RESOLVED').catch(() => ({ data: [] }))
      ]);

      if (statsRes?.data) {
        setStats({
          deptUnassignedCount: statsRes.data.deptUnassignedCount ?? 0,
          myActiveTasksCount: statsRes.data.myActiveTasksCount ?? 0,
          myResolvedCount: statsRes.data.myResolvedCount ?? 0,
          slaBreachedCount: statsRes.data.slaBreachedCount ?? 0,
          departmentName: statsRes.data.departmentName || user?.departmentName || 'Assigned Department'
        });
      }

      setDeptQueue(poolRes.data || []);
      setMyWorkload(workloadRes.data || []);
      setResolvedHistory(resolvedRes.data || []);
    } catch (err) {
      toast.error("Failed to load officer data", { description: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle Accept & Start action
  const handleAcceptTicket = async (ticketId) => {
    try {
      setActionLoadingId(ticketId);
      await acceptGrievance(ticketId);
      toast.success("Grievance Accepted", { description: "Ticket is now under your Active Workload." });
      await loadDashboardData();
      setActiveTab("workload");
    } catch (err) {
      toast.error("Failed to accept grievance", { description: err.response?.data?.message || err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Resolution Drawer
  const openResolveDrawer = (ticket) => {
    setSelectedTicket(ticket);
    setResolutionStatus("RESOLVED");
    setResolutionRemarks("");
    setDrawerOpen(true);
  };

  // Submit Resolution / Rejection
  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!resolutionRemarks.trim()) {
      toast.error("Validation Error", { description: "Resolution remarks are compulsory." });
      return;
    }

    try {
      setSubmittingResolution(true);
      await updateGrievanceStatus(selectedTicket.id, {
        status: resolutionStatus,
        resolutionRemarks: resolutionRemarks.trim(),
        remarks: resolutionRemarks.trim()
      });
      toast.success(`Ticket ${resolutionStatus === 'RESOLVED' ? 'Resolved' : 'Rejected'}`, {
        description: `Case ${selectedTicket.grievanceNumber} marked as ${resolutionStatus}.`
      });
      setDrawerOpen(false);
      setSelectedTicket(null);
      await loadDashboardData();
    } catch (err) {
      toast.error("Action Failed", { description: err.response?.data?.message || err.message });
    } finally {
      setSubmittingResolution(false);
    }
  };

  // SLA Calculation helper
  const isSlaBreached = (ticket) => {
    if (!ticket?.createdAt) return false;
    const created = new Date(ticket.createdAt).getTime();
    const days = ticket.resolutionDays || (ticket.priority === 'HIGH' ? 1 : ticket.priority === 'MEDIUM' ? 3 : 7);
    const limitMs = days * 24 * 60 * 60 * 1000;
    return Date.now() - created > limitMs;
  };

  // Helpers for formatting
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPriorityBadge = (priority) => {
    const map = {
      HIGH: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      MEDIUM: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      LOW: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    };
    return (
      <Badge variant="outline" className={`font-bold tracking-wider text-[11px] ${map[priority] || ''}`}>
        {priority}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const map = {
      PENDING: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
      ASSIGNED: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      IN_PROGRESS: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      RESOLVED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      REJECTED: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
    };
    return (
      <Badge variant="outline" className={`font-bold uppercase tracking-wider text-[11px] ${map[status] || ''}`}>
        {status?.replace('_', ' ')}
      </Badge>
    );
  };

  // Filter list by search term
  const filterList = (list) => {
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(item => 
      item.grievanceNumber?.toLowerCase().includes(term) ||
      item.title?.toLowerCase().includes(term) ||
      item.citizenName?.toLowerCase().includes(term) ||
      item.priority?.toLowerCase().includes(term)
    );
  };

  const filteredQueue = useMemo(() => filterList(deptQueue), [deptQueue, searchTerm]);
  const filteredWorkload = useMemo(() => filterList(myWorkload), [myWorkload, searchTerm]);
  const filteredHistory = useMemo(() => filterList(resolvedHistory), [resolvedHistory, searchTerm]);

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in-50 duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-widest bg-primary/10 text-primary">
              <ShieldCheck className="w-3.5 h-3.5" /> Officer Redressal Console
            </span>
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-primary/70" /> {stats.departmentName}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Department Grievance Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review, claim, and process grievances submitted to your departmental jurisdiction.
          </p>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadDashboardData} 
          disabled={loading}
          className="rounded-xl border-border/60 hover:bg-muted font-bold tracking-wide"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync Console
        </Button>
      </div>

      {/* Top Stat Cards (4 KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Department Pool */}
        <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Department Pool</CardTitle>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Inbox className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-foreground">{stats.deptUnassignedCount}</div>
            <p className="text-xs text-muted-foreground mt-1.5">Unassigned tickets waiting for pickup</p>
          </CardContent>
        </Card>

        {/* KPI 2: My Active Tasks */}
        <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">My Active Tasks</CardTitle>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-blue-600 dark:text-blue-400">{stats.myActiveTasksCount}</div>
            <p className="text-xs text-muted-foreground mt-1.5">In Progress tickets assigned to me</p>
          </CardContent>
        </Card>

        {/* KPI 3: Resolved by Me */}
        <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Resolved by Me</CardTitle>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">{stats.myResolvedCount}</div>
            <p className="text-xs text-muted-foreground mt-1.5">Closed & Completed tickets</p>
          </CardContent>
        </Card>

        {/* KPI 4: SLA Warnings */}
        <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">SLA Warnings</CardTitle>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-rose-600 dark:text-rose-400">{stats.slaBreachedCount}</div>
            <p className="text-xs text-muted-foreground mt-1.5">Overdue / SLA breached cases</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Workspace Tabs */}
      <Card className="rounded-2xl border-border/40 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="bg-muted/60 p-1 rounded-xl w-full sm:w-auto grid grid-cols-3">
              <TabsTrigger value="queue" className="rounded-lg font-bold text-xs tracking-wider uppercase">
                Dept Queue ({deptQueue.length})
              </TabsTrigger>
              <TabsTrigger value="workload" className="rounded-lg font-bold text-xs tracking-wider uppercase">
                My Workload ({myWorkload.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg font-bold text-xs tracking-wider uppercase">
                Resolved History ({resolvedHistory.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search tickets, citizen..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl bg-background/50 border-border/60 text-xs"
            />
          </div>
        </div>

        {/* Tab 1: Department Queue */}
        {activeTab === "queue" && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Ticket ID</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Citizen</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Issue Title</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Priority</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Submitted</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">SLA Status</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQueue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-44 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Inbox className="w-8 h-8 opacity-40 text-muted-foreground" />
                        <p className="text-sm font-semibold">No unassigned tickets in departmental pool.</p>
                        <p className="text-xs text-muted-foreground">All grievances are currently claimed or resolved.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQueue.map((ticket) => {
                    const breached = isSlaBreached(ticket);
                    return (
                      <TableRow key={ticket.id} className="border-border/30 hover:bg-muted/30 transition-colors">
                        <TableCell className="font-black text-xs font-mono tracking-tight text-primary">
                          {ticket.grievanceNumber}
                        </TableCell>
                        <TableCell className="font-semibold text-xs text-foreground">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            {ticket.citizenName || "Anonymous"}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="font-bold text-xs text-foreground truncate" title={ticket.title}>{ticket.title}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{ticket.description}</div>
                        </TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(ticket.createdAt)}
                        </TableCell>
                        <TableCell>
                          {breached ? (
                            <Badge variant="destructive" className="text-[10px] font-bold uppercase tracking-wider animate-pulse">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Overdue
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground border-border/60">
                              Within SLA
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            disabled={actionLoadingId === ticket.id}
                            onClick={() => handleAcceptTicket(ticket.id)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-sm transition-all"
                          >
                            <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
                            {actionLoadingId === ticket.id ? "Assigning..." : "Accept & Start"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Tab 2: My Active Workload */}
        {activeTab === "workload" && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Ticket ID</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Citizen</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Issue Title</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Priority</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Assigned Date</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkload.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-44 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Clock className="w-8 h-8 opacity-40 text-blue-500" />
                        <p className="text-sm font-semibold">No active workload tasks assigned.</p>
                        <p className="text-xs text-muted-foreground">Switch to 'Dept Queue' to claim unassigned tickets.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWorkload.map((ticket) => (
                    <TableRow key={ticket.id} className="border-border/30 hover:bg-muted/30 transition-colors">
                      <TableCell className="font-black text-xs font-mono text-primary">
                        {ticket.grievanceNumber}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          {ticket.citizenName || "Anonymous"}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="font-bold text-xs text-foreground truncate" title={ticket.title}>{ticket.title}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{ticket.description}</div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(ticket.updatedAt || ticket.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          onClick={() => openResolveDrawer(ticket)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                        >
                          <CheckSquare className="w-3.5 h-3.5 mr-1.5" /> Resolve / Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Tab 3: Resolved History */}
        {activeTab === "history" && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Ticket ID</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Citizen</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Issue Title</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Outcome</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Closed Date</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Resolution Remarks</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-44 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <CheckCircle2 className="w-8 h-8 opacity-40 text-emerald-500" />
                        <p className="text-sm font-semibold">No resolved cases found in history.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((ticket) => (
                    <TableRow key={ticket.id} className="border-border/30 hover:bg-muted/30 transition-colors">
                      <TableCell className="font-black text-xs font-mono text-primary">
                        {ticket.grievanceNumber}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">
                        {ticket.citizenName || "Anonymous"}
                      </TableCell>
                      <TableCell className="max-w-xs font-bold text-xs text-foreground truncate">
                        {ticket.title}
                      </TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(ticket.updatedAt)}
                      </TableCell>
                      <TableCell className="max-w-xs text-xs text-muted-foreground italic truncate">
                        {ticket.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setDrawerOpen(true);
                          }}
                          className="rounded-xl text-xs font-bold hover:bg-muted"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Resolution Slide-over Drawer / Modal */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto flex flex-col justify-between">
          <div>
            <SheetHeader className="mb-6">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs font-black text-primary border-primary/30">
                  {selectedTicket?.grievanceNumber}
                </Badge>
                {selectedTicket && getPriorityBadge(selectedTicket.priority)}
              </div>
              <SheetTitle className="text-xl font-black mt-2">
                {selectedTicket?.status === 'RESOLVED' || selectedTicket?.status === 'REJECTED' 
                  ? "Ticket Case Record" 
                  : "Resolve or Reject Grievance"}
              </SheetTitle>
              <SheetDescription className="text-xs">
                Review citizen testimony, evidence, and record official departmental findings.
              </SheetDescription>
            </SheetHeader>

            {/* Ticket Details Summary */}
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-muted/40 border border-border/50 space-y-2">
                <div className="flex justify-between items-center text-muted-foreground pb-2 border-b border-border/40">
                  <span className="flex items-center gap-1 font-semibold"><User className="w-3.5 h-3.5" /> Citizen:</span>
                  <span className="font-bold text-foreground">{selectedTicket?.citizenName || 'Anonymous'}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground pb-2 border-b border-border/40">
                  <span className="flex items-center gap-1 font-semibold"><Calendar className="w-3.5 h-3.5" /> Submitted:</span>
                  <span className="font-bold text-foreground">{formatDate(selectedTicket?.createdAt)}</span>
                </div>
                <div className="pt-1">
                  <span className="font-semibold text-muted-foreground block mb-1">Subject:</span>
                  <p className="font-bold text-foreground text-sm leading-snug">{selectedTicket?.title}</p>
                </div>
                <div className="pt-1">
                  <span className="font-semibold text-muted-foreground block mb-1">Description:</span>
                  <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{selectedTicket?.description}</p>
                </div>
              </div>

              {/* Evidence Attachment */}
              {(selectedTicket?.attachmentUrl || selectedTicket?.imageUrl) && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                  <span className="font-bold uppercase tracking-wider text-[11px] text-primary flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" /> Attached Evidence
                  </span>
                  {selectedTicket.attachmentUrl?.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                    <div className="mt-2 rounded-lg overflow-hidden border border-border/40 max-h-48 bg-black/20">
                      <img 
                        src={selectedTicket.imageUrl || `/${selectedTicket.attachmentUrl}`} 
                        alt="Evidence" 
                        className="w-full h-auto object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : null}
                  <a 
                    href={selectedTicket.imageUrl || `/${selectedTicket.attachmentUrl}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline mt-1"
                  >
                    View / Download Full Attachment <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Status Update Form (Active Workload only) */}
              {selectedTicket?.status !== 'RESOLVED' && selectedTicket?.status !== 'REJECTED' && (
                <form id="resolution-form" onSubmit={handleSubmitResolution} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-xs">Official Redressal Action *</Label>
                    <Select value={resolutionStatus} onValueChange={setResolutionStatus}>
                      <SelectTrigger className="w-full rounded-xl bg-background border-border font-semibold">
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RESOLVED" className="font-bold text-emerald-600 dark:text-emerald-400">
                          RESOLVED - Issue Fixed & Rectified
                        </SelectItem>
                        <SelectItem value="REJECTED" className="font-bold text-rose-600 dark:text-rose-400">
                          REJECTED - Invalid / Out of Scope
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="font-bold text-xs">Resolution Remarks *</Label>
                      <span className="text-[10px] text-muted-foreground">{resolutionRemarks.length}/1000</span>
                    </div>
                    <Textarea 
                      required
                      rows={4}
                      value={resolutionRemarks}
                      onChange={(e) => setResolutionRemarks(e.target.value)}
                      placeholder="Specify corrective action taken, field report findings, or reasoning for rejection..."
                      className="rounded-xl bg-background border-border text-xs resize-none"
                    />
                  </div>
                </form>
              )}
            </div>
          </div>

          <SheetFooter className="mt-6 pt-4 border-t border-border/40 gap-2">
            <Button variant="outline" size="sm" onClick={() => setDrawerOpen(false)} className="rounded-xl font-bold">
              Close
            </Button>
            {selectedTicket?.status !== 'RESOLVED' && selectedTicket?.status !== 'REJECTED' && (
              <Button 
                type="submit" 
                form="resolution-form"
                disabled={submittingResolution || !resolutionRemarks.trim()}
                className={`rounded-xl font-bold text-xs text-white shadow-md transition-all ${
                  resolutionStatus === 'RESOLVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submittingResolution ? "Recording..." : `Confirm ${resolutionStatus}`}
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

    </div>
  );
};

export default OfficerDashboardPage;
