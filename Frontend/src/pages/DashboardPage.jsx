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
  TrendingUp, TrendingDown, Layers, Building2, Ticket, ArrowRight, UserPlus
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

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
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  
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
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, refreshKey]);

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
        <div className="bg-background/80 backdrop-blur-md border border-border/50 p-3 rounded-xl shadow-2xl ring-1 ring-black/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color || payload[0].fill }} />
            <span className="text-sm font-bold">{payload[0].value} <span className="text-[10px] text-muted-foreground font-medium">Tickets</span></span>
          </div>
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED': return <Badge className="rounded-full bg-green-500/10 text-green-600 border-green-500/20 px-3 truncate">Resolved</Badge>;
      case 'PENDING': return <Badge className="rounded-full bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-3 truncate">Pending</Badge>;
      case 'IN_PROGRESS': return <Badge className="rounded-full bg-indigo-500/10 text-indigo-600 border-indigo-500/20 px-3 truncate">In Progress</Badge>;
      case 'REJECTED': return <Badge className="rounded-full bg-red-500/10 text-red-600 border-red-500/20 px-3 truncate">Rejected</Badge>;
      case 'CLOSED_BY_USER': return <Badge className="rounded-full bg-rose-500/10 text-rose-600 border-rose-500/20 px-3 truncate">Archived</Badge>;
      default: return <Badge variant="outline" className="rounded-full px-3">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH': return <Badge className="rounded-full bg-red-500/10 text-red-600 border-red-500/20 px-3">High</Badge>;
      case 'MEDIUM': return <Badge className="rounded-full bg-orange-500/10 text-orange-600 border-orange-500/20 px-3">Medium</Badge>;
      case 'LOW': return <Badge className="rounded-full bg-green-500/10 text-green-600 border-green-500/20 px-3">Low</Badge>;
      default: return <Badge variant="outline" className="rounded-full px-3">{priority}</Badge>;
    }
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
            <h2 className="text-4xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/80 to-foreground/50">
              Welcome back, {user?.firstName || 'User'}!
            </h2>
            <p className="text-muted-foreground/80 max-w-lg text-sm font-medium">
              Your personalized grievance dashboard is synchronized. 
              You have <span className="text-foreground font-bold">{(stats?.pendingGrievances || 0) + (stats?.inProgressGrievances || 0)} active tickets</span> requiring attention.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              title="Refresh Data"
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-xl border-border/40 hover:bg-muted/50 transition-all"
              onClick={() => setRefreshKey(Date.now())}
            >
              <Bell className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              className="h-12 px-6 gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-lg shadow-indigo-500/20 transition-all font-bold text-sm active:scale-95 group border-none"
              onClick={() => navigate('/grievances/new')}
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" /> 
              Register New Grievance
            </Button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden group border-none shadow-sm ring-1 ring-border hover:ring-primary/30 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Total Grievances</CardTitle>
              <div className="p-2 rounded-lg bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <FileText className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black tracking-tight">{stats.totalGrievances || 0}</div>
                {isAdmin && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                    <TrendingUp className="h-3 w-3" /> +12%
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Lifetime records</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group border-none shadow-sm ring-1 ring-border hover:ring-green-500/30 transition-all duration-300">
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
              <p className="text-xs text-muted-foreground">Successfully closed</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group border-none shadow-sm ring-1 ring-border hover:ring-indigo-500/30 transition-all duration-300">
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

          <Card className="relative overflow-hidden group border-none shadow-sm ring-1 ring-border hover:ring-yellow-500/30 transition-all duration-300">
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
              <Progress value={stats.totalGrievances ? (stats.pendingGrievances / stats.totalGrievances) * 100 : 0} className="h-1.5 bg-yellow-500/10" />
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Status Breakdown - Donut Chart */}
          <Card className="border-none shadow-sm ring-1 ring-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-indigo-500" />
                Status Breakdown
              </CardTitle>
              <CardDescription>Visual representation of your ticket status distribution</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1500}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle" 
                      formatter={(value) => <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center space-y-2 opacity-50">
                  <p className="text-sm font-medium italic">No data available to chart</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Department Trends - Bar Chart */}
          <Card className="border-none shadow-sm ring-1 ring-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-indigo-500" />
                Recent Department Trends
              </CardTitle>
              <CardDescription>Commonly reported departments in your recent activity</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {departmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.3)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'currentColor', opacity: 0.05, radius: 8 }}
                      content={<CustomTooltip />}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[4, 4, 0, 0]} 
                      barSize={40}
                      animationDuration={1500}
                    >
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center opacity-50">
                   <p className="text-sm font-medium italic">Insufficient data for trend analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Grievances Table */}
        <Card className="border-none shadow-sm ring-1 ring-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold">Recent Grievances</CardTitle>
              <CardDescription>Track your most recently submitted issues</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5 font-bold" onClick={() => navigate('/recent-grievances')}>
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
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
                      <TableHead className="w-[120px]">ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentGrievances.map((g) => (
                      <TableRow 
                        key={g.id} 
                        className="group hover:bg-primary/[0.02] active:bg-primary/[0.05] transition-colors cursor-pointer"
                        onClick={() => navigate(`/grievances/${g.id}`)}
                      >
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
                        <TableCell>{getStatusBadge(g.status)}</TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs font-medium">
                          {parseDate(g.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed rounded-xl border-muted/50">
                <div className="p-4 rounded-full bg-muted/30">
                  <Ticket className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">No Recent Grievances</h3>
                  <p className="text-muted-foreground text-sm max-w-[300px]">
                    You haven't submitted any grievances yet. Click the button below to report your first issue.
                  </p>
                </div>
                <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold" onClick={() => navigate('/grievances/new')}>
                  <Plus className="h-4 w-4" /> Register New Grievance
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DashboardPage;
