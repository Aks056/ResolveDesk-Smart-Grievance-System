import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Search
} from "lucide-react";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

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
    ASSIGNED: {
      label: 'Assigned',
      classes: 'bg-blue-100/80 text-blue-800 border-blue-200/30 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/30'
    },
    IN_PROGRESS: {
      label: 'In Progress',
      classes: 'bg-indigo-100/80 text-indigo-800 border-indigo-200/30 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/30'
    },
    REJECTED: {
      label: 'Rejected',
      classes: 'bg-rose-100/80 text-rose-800 border-rose-200/30 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/30'
    },
    CLOSED_BY_USER: {
      label: 'Closed',
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
            {['ALL', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED_BY_USER'].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className={`rounded-full px-4 h-9 font-bold uppercase tracking-widest text-[10px] transition-all ${
                  filterStatus === status ? 'bg-primary shadow-lg shadow-primary/20' : 'hover:bg-primary/5'
                }`}
              >
                {status === 'CLOSED_BY_USER' ? 'CLOSED' : status}
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
                    g.status === 'ASSIGNED' ? 'bg-blue-500/10 text-blue-500' :
                    g.status === 'IN_PROGRESS' ? 'bg-indigo-500/10 text-indigo-500' :
                    g.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                    'bg-slate-500/10 text-slate-500'
                  }`}>
                    {g.status === 'RESOLVED' ? <CheckCircle2 className="h-6 w-6" /> :
                     g.status === 'PENDING' ? <AlertCircle className="h-6 w-6" /> :
                     g.status === 'ASSIGNED' ? <Clock className="h-6 w-6" /> :
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
