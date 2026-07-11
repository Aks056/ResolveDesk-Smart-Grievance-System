import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../lib/api';
import { 
  Card
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, ChevronRight, Building2, User2, Zap, Droplets, HeartPulse, GraduationCap, ShieldCheck, Wrench, ArrowUpDown,
  LayoutGrid, List, TableProperties, UserPlus, ThumbsUp
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

const RecentGrievancesPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'ADMIN';

  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterUrgency, setFilterUrgency] = useState('ALL');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('NEWEST');
  const [viewMode, setViewMode] = useState('list'); // 'grid', 'list', 'table'
  const [officers, setOfficers] = useState([]);
  
  const parseDate = (date) => {
    if (Array.isArray(date)) {
      return new Date(date[0], date[1] - 1, date[2], date[3] || 0, date[4] || 0, date[5] || 0);
    }
    return new Date(date);
  };

  useEffect(() => {
    const fetchGrievances = async () => {
      try {
        setLoading(true);
        const res = await api.get('/grievances/all');
        setGrievances(res.data || []);
      } catch (err) {
        console.error("Failed to fetch grievances", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrievances();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      const fetchOfficers = async () => {
        try {
          const res = await api.get('/api/grievances/officers');
          setOfficers(res.data || []);
        } catch (err) {
          console.error("Failed to fetch officers", err);
        }
      };
      fetchOfficers();
    }
  }, [isAdmin]);
  const getPriorityBorder = (priority) => {
    switch (priority) {
      case 'HIGH': return 'border-l-4 border-l-rose-500';
      case 'MEDIUM': return 'border-l-4 border-l-amber-500';
      case 'LOW': return 'border-l-4 border-l-emerald-500';
      default: return 'border-l-4 border-l-slate-300';
    }
  };

  const displayOfficers = useMemo(() => {
    return officers.length > 0 ? officers : [
      { id: 101, fullName: "Dr. Alok Mishra", departmentName: "Electricity Dept" },
      { id: 102, fullName: "Prof. Sunita Sharma", departmentName: "Academic Section" },
      { id: 103, fullName: "Er. Ramesh Verma", departmentName: "Water Works" },
      { id: 104, fullName: "Dr. Rajesh Gupta", departmentName: "Medical & Health" }
    ];
  }, [officers]);

  const handleAssignOfficer = async (grievanceId, officerId) => {
    try {
      if (officerId) {
        await api.post(`/admin/grievances/${grievanceId}/assign/${officerId}`);
        toast.success("Officer assigned successfully");
        
        setGrievances(prev => prev.map(g => {
          if (g.id === grievanceId) {
            const off = displayOfficers.find(o => o.id === parseInt(officerId));
            return {
              ...g,
              status: 'ASSIGNED',
              assignedOfficerId: officerId,
              assignedOfficerName: off ? off.fullName : 'Assigned'
            };
          }
          return g;
        }));
      }
    } catch (err) {
      console.error("Failed to assign officer", err);
      toast.error("Failed to assign officer");
    }
  };
  const handleToggleUpvote = async (grievanceId) => {
    const grievance = grievances.find(g => g.id === grievanceId);
    if (!grievance) return;

    const previouslyUpvoted = grievance.hasUpvoted || false;
    const previousCount = grievance.upvoteCount || 0;

    const nextUpvoted = !previouslyUpvoted;
    const nextCount = previouslyUpvoted ? Math.max(0, previousCount - 1) : previousCount + 1;

    setGrievances(prev => prev.map(g => 
      g.id === grievanceId ? { ...g, hasUpvoted: nextUpvoted, upvoteCount: nextCount } : g
    ));

    try {
      const response = await api.post(`/grievances/${grievanceId}/upvote`);
      const serverGrievance = response.data;
      setGrievances(prev => prev.map(g => 
        g.id === grievanceId ? { ...g, hasUpvoted: serverGrievance.hasUpvoted, upvoteCount: serverGrievance.upvoteCount } : g
      ));
    } catch (err) {
      console.error("Failed to toggle upvote", err);
      toast.error("Failed to update upvote. Please try again.");
      setGrievances(prev => prev.map(g => 
        g.id === grievanceId ? { ...g, hasUpvoted: previouslyUpvoted, upvoteCount: previousCount } : g
      ));
    }
  };

  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set(grievances.map(g => g.departmentName))).filter(Boolean).sort();
  }, [grievances]);

  const filteredGrievances = useMemo(() => {
    return grievances.filter(g => {
      const matchesSearch = g.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            g.id.toString().includes(searchTerm) ||
                            (g.citizenName && g.citizenName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = filterStatus === 'ALL' || g.status === filterStatus;
      const matchesUrgency = filterUrgency === 'ALL' || g.priority === filterUrgency;
      const matchesDept = filterDepartment === 'ALL' || g.departmentName === filterDepartment;
      return matchesSearch && matchesStatus && matchesUrgency && matchesDept;
    }).sort((a, b) => {
       if (sortOrder === 'NEWEST') {
         return parseDate(b.createdAt) - parseDate(a.createdAt);
       } else if (sortOrder === 'URGENCY') {
         const pLevel = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
         const vA = pLevel[a.priority] || 0;
         const vB = pLevel[b.priority] || 0;
         if (vA === vB) return parseDate(b.createdAt) - parseDate(a.createdAt);
         return vB - vA;
       }
       return 0;
    });
  }, [grievances, searchTerm, filterStatus, filterUrgency, filterDepartment, sortOrder]);

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

  const getStatusBorder = (status) => {
    switch (status) {
      case 'RESOLVED': return 'border-l-4 border-l-green-500';
      case 'PENDING': return 'border-l-4 border-l-yellow-500';
      case 'IN_PROGRESS': return 'border-l-4 border-l-indigo-500';
      case 'REJECTED': return 'border-l-4 border-l-red-500';
      case 'CLOSED_BY_USER': return 'border-l-4 border-l-rose-500';
      default: return 'border-l-4 border-l-transparent';
    }
  };

  const getDepartmentIcon = (deptName, sizeClass = "h-6 w-6") => {
    const name = (deptName || '').toLowerCase();
    if (name.includes('electr')) return <Zap className={sizeClass} />;
    if (name.includes('water')) return <Droplets className={sizeClass} />;
    if (name.includes('health') || name.includes('medical')) return <HeartPulse className={sizeClass} />;
    if (name.includes('academic') || name.includes('educat')) return <GraduationCap className={sizeClass} />;
    if (name.includes('security') || name.includes('police')) return <ShieldCheck className={sizeClass} />;
    if (name.includes('maintain') || name.includes('infrastructure')) return <Wrench className={sizeClass} />;
    return <Building2 className={sizeClass} />;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-5xl mx-auto p-4 md:p-10 space-y-8 animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
             <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 uppercase tracking-tighter font-bold text-[10px]">System Wide Gallery</Badge>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            Recent Grievances
          </h2>
          <p className="text-muted-foreground font-medium max-w-lg">Viewing real-time redressal activity across AKTU. Monitor, track, and review public issues.</p>
        </div>

        {/* Global Toolbar */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/40 p-4 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search by ID, keyword, or citizen name..." 
                className="pl-10 h-12 rounded-xl bg-background border-border/40 focus:ring-primary/20 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Top Level Dropdowns */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
               <Select value={filterStatus} onValueChange={setFilterStatus}>
                 <SelectTrigger className="h-12 rounded-xl bg-background border-border/40 font-bold text-xs uppercase tracking-wider min-w-[130px]">
                   <div className="flex items-center gap-2">
                     <span className="text-muted-foreground">Status:</span> {filterStatus === 'CLOSED_BY_USER' ? 'ARCHIVED' : filterStatus}
                   </div>
                 </SelectTrigger>
                 <SelectContent>
                   {['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED_BY_USER'].map(s => (
                     <SelectItem key={s} value={s} className="font-bold text-xs uppercase tracking-wider">{s === 'CLOSED_BY_USER' ? 'ARCHIVED' : s}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>

               <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                 <SelectTrigger className="h-12 rounded-xl bg-background border-border/40 font-bold text-xs uppercase tracking-wider min-w-[130px]">
                   <div className="flex items-center gap-2">
                     <span className="text-muted-foreground">Urgency:</span> {filterUrgency}
                   </div>
                 </SelectTrigger>
                 <SelectContent>
                   {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
                     <SelectItem key={s} value={s} className="font-bold text-xs uppercase tracking-wider">{s}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>

               <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                 <SelectTrigger className="h-12 rounded-xl bg-background border-border/40 font-bold text-xs uppercase tracking-wider min-w-[140px]">
                   <div className="flex items-center gap-2 truncate max-w-[150px]">
                     <span className="text-muted-foreground">Dept:</span> {filterDepartment}
                   </div>
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="ALL" className="font-bold text-xs uppercase tracking-wider">ALL DEPARTMENTS</SelectItem>
                   {uniqueDepartments.map(s => (
                     <SelectItem key={s} value={s} className="font-bold text-xs uppercase tracking-wider">{s}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>

               <Select value={sortOrder} onValueChange={setSortOrder}>
                 <SelectTrigger className="h-12 rounded-xl bg-background border-border/40 font-bold text-xs uppercase tracking-wider min-w-[150px]">
                   <div className="flex items-center gap-2">
                     <ArrowUpDown className="h-3.5 w-3.5 opacity-50" /> {sortOrder}
                   </div>
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="NEWEST" className="font-bold text-xs uppercase tracking-wider">NEWEST FIRST</SelectItem>
                   <SelectItem value="URGENCY" className="font-bold text-xs uppercase tracking-wider">HIGHEST URGENCY</SelectItem>
                 </SelectContent>
               </Select>

               {/* Grid / List / Table View Toggle */}
               <div className="flex items-center bg-background border border-border/40 p-1 rounded-xl h-12 shrink-0">
                 <Button
                   variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                   size="icon"
                   className="h-10 w-10 rounded-lg"
                   onClick={() => setViewMode('grid')}
                   title="Grid View"
                 >
                   <LayoutGrid className="h-4.5 w-4.5 text-muted-foreground" />
                 </Button>
                 <Button
                   variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                   size="icon"
                   className="h-10 w-10 rounded-lg"
                   onClick={() => setViewMode('list')}
                   title="List View"
                 >
                   <List className="h-4.5 w-4.5 text-muted-foreground" />
                 </Button>
                 <Button
                   variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                   size="icon"
                   className="h-10 w-10 rounded-lg"
                   onClick={() => setViewMode('table')}
                   title="Table View"
                 >
                   <TableProperties className="h-4.5 w-4.5 text-muted-foreground" />
                 </Button>
               </div>
            </div>
          </div>
        </div>

        {/* Grievances List */}
        <div>
          {loading ? (
            <div className="grid gap-4 mt-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-full h-[150px] bg-card/60 border rounded-2xl animate-pulse flex p-6 gap-6">
                   <div className="w-12 h-12 rounded-xl bg-muted/60 hidden sm:block shrink-0"></div>
                   <div className="flex-1 space-y-4">
                     <div className="w-full h-5 bg-muted/60 rounded max-w-[60%]"></div>
                     <div className="w-full h-4 bg-muted/40 rounded max-w-[90%]"></div>
                     <div className="w-full h-4 bg-muted/30 rounded max-w-[40%]"></div>
                   </div>
                </div>
              ))}
            </div>
          ) : filteredGrievances.length > 0 ? (
            viewMode === 'table' ? (
              <div className="rounded-xl border overflow-hidden bg-card/50 backdrop-blur-sm mt-8 shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[100px] pl-6">ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="text-center">Upvotes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGrievances.map((g) => (
                      <TableRow 
                        key={g.id} 
                        className="group hover:bg-primary/[0.02] active:bg-primary/[0.05] transition-colors cursor-pointer"
                        onClick={() => navigate(`/grievances/${g.id}`)}
                      >
                        <TableCell className="relative pl-6 font-mono text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
                          <div className={cn(
                            "absolute left-2.5 top-2.5 bottom-2.5 w-1 rounded-full",
                            g.priority === 'HIGH' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" :
                            g.priority === 'MEDIUM' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" :
                            "bg-emerald-500"
                          )} />
                          #GRV-{String(g.id).padStart(4, '0')}
                        </TableCell>
                        <TableCell className="font-semibold max-w-[200px] truncate">{g.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                            <span className="text-primary">{getDepartmentIcon(g.departmentName, "h-4 w-4")}</span>
                            <span className="truncate max-w-[120px]">{g.departmentName}</span>
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
                        <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {isAdmin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg border-primary/20 text-primary hover:bg-primary/5 cursor-pointer"
                                    title="Quick Assign"
                                  >
                                    <UserPlus className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 bg-card border max-h-60 overflow-y-auto">
                                  {displayOfficers.map(off => (
                                    <DropdownMenuItem 
                                      key={off.id} 
                                      onClick={() => handleAssignOfficer(g.id, off.id)}
                                      className="cursor-pointer text-xs font-semibold"
                                    >
                                      {off.fullName} ({off.departmentName || 'No Dept'})
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/5 rounded-lg flex items-center gap-1 cursor-pointer"
                              onClick={() => navigate(`/grievances/${g.id}`)}
                            >
                              <span>View Case</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className={cn(
                "grid gap-4 mt-8",
                viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
              )}>
                {filteredGrievances.map((g) => (
                  <Card 
                    key={g.id} 
                    className={`group border-y border-r shadow-sm ring-1 ring-border/30 hover:ring-primary/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)] transition-all duration-300 cursor-pointer overflow-hidden bg-card/50 backdrop-blur-sm -translate-y-0 hover:-translate-y-1 ${getPriorityBorder(g.priority)} rounded-xl`}
                    onClick={() => navigate(`/grievances/${g.id}`)}
                  >
                    <div className="flex flex-col p-5 sm:p-6 gap-4 h-full justify-between">
                      <div className="space-y-4">
                        {/* Row 1: ID & Date */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black font-mono text-primary/70 tracking-widest bg-primary/5 px-2 py-1 rounded-md">#GRV-{String(g.id).padStart(4, '0')}</span>
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground tracking-widest uppercase">
                            <User2 className="h-3 w-3 inline opacity-50" /> {g.citizenName || 'ANONYMOUS'}
                            <span className="mx-1 opacity-30">&bull;</span>
                            <span>{parseDate(g.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>

                        {/* Row 2: Title & Category Icon */}
                        <div className="flex items-center gap-4 py-1">
                           <div className={`hidden sm:flex h-12 w-12 items-center justify-center rounded-xl shrink-0 transition-all bg-muted/30 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-110 shadow-sm`}>
                             {getDepartmentIcon(g.departmentName)}
                           </div>
                           <div className="flex-1 space-y-1 shrink min-w-0">
                             <h3 className="text-xl md:text-2xl font-black tracking-tight group-hover:text-primary transition-colors line-clamp-1 leading-tight">{g.title}</h3>
                             <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase opacity-80 tracking-widest">
                               {g.departmentName}
                             </div>
                           </div>
                        </div>

                        {/* Row 3: Description preview */}
                        <p className="text-sm text-foreground/70 line-clamp-2 sm:pl-16 font-medium leading-relaxed">{g.description}</p>
                      </div>

                      {/* Row 4: Badges */}
                      <div className="flex flex-wrap items-center justify-between sm:pl-16 pt-3 mt-1 border-t border-border/30 gap-2">
                         <div className="flex items-center gap-2">
                           {getPriorityBadge(g.priority)}
                           {getStatusBadge(g.status)}
                         </div>
                         <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                           {isAdmin && (
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button 
                                   variant="outline" 
                                   size="sm" 
                                   className="h-8 gap-1.5 px-3 text-xs font-bold uppercase tracking-wider border-primary/20 text-primary hover:bg-primary/5 rounded-lg cursor-pointer"
                                 >
                                   <UserPlus className="h-3.5 w-3.5" />
                                   Assign
                                 </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end" className="w-56 bg-card border max-h-60 overflow-y-auto">
                                 {displayOfficers.map(off => (
                                   <DropdownMenuItem 
                                     key={off.id} 
                                     onClick={() => handleAssignOfficer(g.id, off.id)}
                                     className="cursor-pointer text-xs font-semibold"
                                   >
                                     {off.fullName} ({off.departmentName || 'No Dept'})
                                   </DropdownMenuItem>
                                 ))}
                               </DropdownMenuContent>
                             </DropdownMenu>
                           )}
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="h-8 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/5 rounded-lg flex items-center gap-1 cursor-pointer"
                             onClick={() => navigate(`/grievances/${g.id}`)}
                           >
                             <span>View Case</span>
                             <ChevronRight className="h-3.5 w-3.5" />
                           </Button>
                         </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <Card className="py-24 border-dashed border-2 bg-transparent text-center space-y-4 mt-8">
              <div className="flex justify-center">
                <div className="p-6 rounded-full bg-muted/30 animate-pulse">
                  <Search className="h-10 w-10 text-muted-foreground/30" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-2xl">No Outcomes Found</h3>
                <p className="text-muted-foreground text-sm max-w-[300px] mx-auto leading-relaxed">
                  The system hasn't recorded any public grievances matching your specific filters yet.
                </p>
              </div>
              <Button variant="outline" className="mt-4 border-primary/20 text-primary" onClick={() => {
                setSearchTerm('');
                setFilterStatus('ALL');
                setFilterUrgency('ALL');
                setFilterDepartment('ALL');
              }}>Clear Formatting</Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentGrievancesPage;
