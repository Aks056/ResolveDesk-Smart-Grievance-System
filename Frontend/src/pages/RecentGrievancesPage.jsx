import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { 
  Card
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, ChevronRight, Building2, User2, Zap, Droplets, HeartPulse, GraduationCap, ShieldCheck, Wrench, ArrowUpDown
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RecentGrievancesPage = () => {
  const navigate = useNavigate();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterUrgency, setFilterUrgency] = useState('ALL');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('NEWEST');
  
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED': return <Badge className="rounded-full bg-green-500/10 text-green-600 border-green-500/20 px-3">Resolved</Badge>;
      case 'PENDING': return <Badge className="rounded-full bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-3">Pending</Badge>;
      case 'IN_PROGRESS': return <Badge className="rounded-full bg-indigo-500/10 text-indigo-600 border-indigo-500/20 px-3">In Progress</Badge>;
      case 'CLOSED_BY_USER': return <Badge className="rounded-full bg-rose-500/10 text-rose-600 border-rose-500/20 px-3">Archived</Badge>;
      default: return <Badge variant="outline" className="rounded-full px-3">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH': return <Badge className="rounded-full border text-white bg-red-500 border-red-600 px-3 hover:bg-red-600 transition-colors">High</Badge>;
      case 'MEDIUM': return <Badge variant="outline" className="rounded-full border-orange-500/20 text-orange-600 bg-orange-500/10 px-3">Medium</Badge>;
      case 'LOW': return <Badge variant="outline" className="rounded-full border-green-500/20 text-green-600 bg-green-500/10 px-3">Low</Badge>;
      default: return <Badge variant="outline" className="rounded-full px-3">{priority}</Badge>;
    }
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

  const getDepartmentIcon = (deptName) => {
    const name = (deptName || '').toLowerCase();
    if (name.includes('electr')) return <Zap className="h-6 w-6" />;
    if (name.includes('water')) return <Droplets className="h-6 w-6" />;
    if (name.includes('health') || name.includes('medical')) return <HeartPulse className="h-6 w-6" />;
    if (name.includes('academic') || name.includes('educat')) return <GraduationCap className="h-6 w-6" />;
    if (name.includes('security') || name.includes('police')) return <ShieldCheck className="h-6 w-6" />;
    if (name.includes('maintain') || name.includes('infrastructure')) return <Wrench className="h-6 w-6" />;
    return <Building2 className="h-6 w-6" />;
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full md:w-auto overflow-hidden">
               <Select value={filterStatus} onValueChange={setFilterStatus}>
                 <SelectTrigger className="h-12 rounded-xl bg-background border-border/40 font-bold text-xs uppercase tracking-wider">
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
                 <SelectTrigger className="h-12 rounded-xl bg-background border-border/40 font-bold text-xs uppercase tracking-wider">
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
                 <SelectTrigger className="h-12 rounded-xl bg-background border-border/40 font-bold text-xs uppercase tracking-wider hidden lg:flex">
                   <div className="flex items-center gap-2 truncate max-w-[120px]">
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
                 <SelectTrigger className="h-12 rounded-xl bg-background border-border/40 font-bold text-xs uppercase tracking-wider">
                   <div className="flex items-center gap-2">
                     <ArrowUpDown className="h-3.5 w-3.5 opacity-50" /> {sortOrder}
                   </div>
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="NEWEST" className="font-bold text-xs uppercase tracking-wider">NEWEST FIRST</SelectItem>
                   <SelectItem value="URGENCY" className="font-bold text-xs uppercase tracking-wider">HIGHEST URGENCY</SelectItem>
                 </SelectContent>
               </Select>
            </div>
          </div>
        </div>

        {/* Grievances List */}
        <div className="grid gap-4 mt-8">
          {loading ? (
            <div className="space-y-4">
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
            filteredGrievances.map((g) => (
              <Card 
                key={g.id} 
                className={`group border-y border-r shadow-sm ring-1 ring-border/30 hover:ring-primary/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)] transition-all duration-300 cursor-pointer overflow-hidden bg-card/50 backdrop-blur-sm -translate-y-0 hover:-translate-y-1 ${getStatusBorder(g.status)} rounded-xl`}
                onClick={() => navigate(`/grievances/${g.id}`)}
              >
                <div className="flex flex-col p-5 sm:p-6 gap-4">
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

                  {/* Row 4: Badges */}
                  <div className="flex flex-wrap items-center justify-between sm:pl-16 pt-3 mt-1 border-t border-border/30">
                     <div className="flex items-center gap-2">
                       {getPriorityBadge(g.priority)}
                       {getStatusBadge(g.status)}
                     </div>
                     <div className="p-2 sm:px-4 sm:py-2 rounded-full sm:rounded-lg sm:bg-muted/30 hover:bg-black/5 group-hover:translate-x-1 sm:group-hover:translate-x-0 sm:group-hover:bg-primary/10 transition-all flex items-center gap-2">
                       <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-widest text-primary/80">View Case</span>
                       <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:text-primary" />
                     </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="py-24 border-dashed border-2 bg-transparent text-center space-y-4">
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
