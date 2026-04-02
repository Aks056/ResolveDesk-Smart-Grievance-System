import { useEffect, useState } from 'react';
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
import { Input } from "@/components/ui/input";
import { 
  Search, Filter, ChevronRight, Building2, Clock, CheckCircle2, AlertCircle, FileText
} from "lucide-react";

const MyGrievancesPage = () => {
  const navigate = useNavigate();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
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
        const res = await api.get('/grievances/my');
        setGrievances(res.data || []);
      } catch (err) {
        console.error("Failed to fetch grievances", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrievances();
  }, []);

  const filteredGrievances = grievances.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          g.id.toString().includes(searchTerm);
    const matchesFilter = filterStatus === 'ALL' || g.status === filterStatus;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => parseDate(b.createdAt) - parseDate(a.createdAt));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED': return <Badge className="rounded-full bg-green-500/10 text-green-600 border-green-500/20 px-3">Resolved</Badge>;
      case 'PENDING': return <Badge className="rounded-full bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-3">Pending</Badge>;
      case 'IN_PROGRESS': return <Badge className="rounded-full bg-indigo-500/10 text-indigo-600 border-indigo-500/20 px-3">In Progress</Badge>;
      case 'CLOSED': return <Badge className="rounded-full bg-slate-500/10 text-slate-600 border-slate-500/20 px-3">Closed</Badge>;
      default: return <Badge variant="outline" className="rounded-full px-3">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH': return <Badge variant="outline" className="rounded-full border-red-500/20 text-red-600 bg-red-500/5 px-3">High</Badge>;
      case 'MEDIUM': return <Badge variant="outline" className="rounded-full border-orange-500/20 text-orange-600 bg-orange-500/5 px-3">Medium</Badge>;
      case 'LOW': return <Badge variant="outline" className="rounded-full border-green-500/20 text-green-600 bg-green-500/5 px-3">Low</Badge>;
      default: return <Badge variant="outline" className="rounded-full px-3">{priority}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-7xl mx-auto p-6 md:p-10 space-y-8 animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            My Grievances
          </h2>
          <p className="text-muted-foreground font-medium">Track and manage all your submitted redressal requests.</p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by title or ID..." 
              className="pl-10 h-11 rounded-xl bg-card border-border/40 focus:ring-primary/20 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className={`rounded-full px-4 h-9 font-bold uppercase tracking-widest text-[10px] transition-all ${
                  filterStatus === status ? 'bg-primary shadow-lg shadow-primary/20' : 'hover:bg-primary/5'
                }`}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Grievances List */}
        <div className="grid gap-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Retrieving records...</p>
            </div>
          ) : filteredGrievances.length > 0 ? (
            filteredGrievances.map((g) => (
              <Card 
                key={g.id} 
                className="group border-none shadow-sm ring-1 ring-border hover:ring-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer overflow-hidden bg-card/50 backdrop-blur-sm"
                onClick={() => navigate(`/grievances/${g.id}`)}
              >
                <div className="flex flex-col md:flex-row md:items-center p-6 gap-6">
                  {/* Status Icon */}
                  <div className={`hidden md:flex h-14 w-14 items-center justify-center rounded-2xl shrink-0 transition-colors ${
                    g.status === 'RESOLVED' ? 'bg-green-500/10 text-green-500' :
                    g.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' :
                    g.status === 'IN_PROGRESS' ? 'bg-indigo-500/10 text-indigo-500' :
                    'bg-slate-500/10 text-slate-500'
                  }`}>
                    {g.status === 'RESOLVED' ? <CheckCircle2 className="h-6 w-6" /> :
                     g.status === 'PENDING' ? <AlertCircle className="h-6 w-6" /> :
                     g.status === 'IN_PROGRESS' ? <Clock className="h-6 w-6" /> : 
                     <FileText className="h-6 w-6" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black font-mono text-muted-foreground/60 tracking-widest">#GRV-{String(g.id).padStart(4, '0')}</span>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground capitalize">
                        <Building2 className="h-3 w-3" />
                        {g.departmentName}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{g.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{g.description}</p>
                  </div>

                  {/* Actions & Badges */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 shrink-0">
                    <div className="flex flex-wrap gap-2">
                      {getPriorityBadge(g.priority)}
                      {getStatusBadge(g.status)}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <span>{parseDate(g.createdAt).toLocaleDateString()}</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="py-20 border-dashed border-2 bg-transparent text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-muted/50">
                  <Search className="h-10 w-10 text-muted-foreground/30" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xl">No Grievances Found</h3>
                <p className="text-muted-foreground text-sm max-w-[300px] mx-auto">
                  We couldn't find any grievances matching your criteria. Try adjusting your search or filters.
                </p>
              </div>
              <Button onClick={() => navigate('/grievances/new')} className="font-bold bg-[#4F46E5] text-white px-6">
                Submit New Grievance
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyGrievancesPage;
