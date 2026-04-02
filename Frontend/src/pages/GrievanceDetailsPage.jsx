import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../lib/api';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Building2, Clock, CheckCircle2, AlertCircle, Calendar, 
  User, MessageSquare, Image as ImageIcon, History, XCircle, MoreVertical,
  ExternalLink, Download, ShieldCheck
} from "lucide-react";
import ConfirmDialog from '../components/ConfirmDialog';

const GrievanceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [grievance, setGrievance] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [modal, setModal] = useState({ 
    isOpen: false, 
    title: "", 
    description: "", 
    type: "warning", 
    onConfirm: null 
  });

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        window.scrollTo(0, 0); // Reset scroll position to top
        const [detailsRes, historyRes] = await Promise.all([
          api.get(`/grievances/${id}`),
          api.get(`/grievances/${id}/history`)
        ]);
        setGrievance(detailsRes.data);
        setHistory(historyRes.data || []);
      } catch (err) {
        console.error("Failed to fetch grievance details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleClose = () => {
    setModal({
      isOpen: true,
      title: "Close Grievance",
      description: "Are you sure you want to close this grievance? This action signifies your satisfaction with the resolution or that you no longer require assistance.",
      type: "warning",
      onConfirm: executeClose
    });
  };

  const executeClose = async () => {
    try {
      setClosing(true);
      setModal(prev => ({ ...prev, isOpen: false })); // Close confirm modal
      
      await api.put(`/grievances/${id}/close`, { remarks: "Closed by user via portal" });
      const detailsRes = await api.get(`/grievances/${id}`);
      setGrievance(detailsRes.data);
      
      // Success notification
      setModal({
        isOpen: true,
        title: "Protocol Archived",
        description: "Grievance has been successfully closed by you. The record remains in the system for administrative audit, but no further escalation will occur.",
        type: "success",
        confirmText: "Acknowledge",
        onConfirm: () => {
          setModal(prev => ({ ...prev, isOpen: false }));
          fetchDetails(); // Refresh to show new status
        }
      });
    } catch (err) {
      console.error("Failed to close grievance", err);
      // Backend returns ApiError { message, status, timestamp, path }
      const errorData = err.response?.data;
      const errorMsg = errorData?.message || 
                      (typeof errorData === 'string' ? errorData : null) ||
                      "The secure uplink encountered a logic failure or permission mismatch.";

      setModal({
        isOpen: true,
        title: "Access Restricted",
        description: `Command Refused: ${errorMsg}. Please verify you are logged in as the original author.`,
        type: "error",
        confirmText: "Return",
        onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setClosing(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'RESOLVED': return { label: 'Resolved', color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle2 };
      case 'PENDING': return { label: 'Pending', color: 'text-yellow-600', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: AlertCircle };
      case 'IN_PROGRESS': return { label: 'In Progress', color: 'text-indigo-600', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: Clock };
      case 'CLOSED_BY_USER': return { label: 'Closed by User', color: 'text-rose-600', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: XCircle };
      case 'REJECTED': return { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle };
      default: return { label: status, color: 'text-muted-foreground', bg: 'bg-muted/10', border: 'border-border', icon: History };
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Decrypting Records...</p>
      </div>
    );
  }

  if (!grievance) {
    return (
      <div className="container max-w-4xl mx-auto p-10 text-center space-y-6">
        <XCircle className="w-16 h-16 text-destructive mx-auto opacity-20" />
        <h2 className="text-2xl font-bold tracking-tight">Record Not Found</h2>
        <p className="text-muted-foreground">The requested grievance record could not be retrieved from the server.</p>
        <Button onClick={() => navigate('/dashboard')} variant="outline" className="px-8 rounded-full">Return to Safety</Button>
      </div>
    );
  }

  const s = getStatusInfo(grievance.status);

  return (
    <div className="min-h-screen bg-background pb-20 selection:bg-indigo-500/30">
      <div className="container max-w-5xl mx-auto p-4 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Breadcrumbs & Actions */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)} 
            className="group gap-2 font-bold uppercase tracking-widest text-[10px] hover:text-indigo-600 transition-all px-0"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </Button>
          
          <div className="flex items-center gap-2">
            {user?.id === grievance.citizenId && grievance.status !== 'CLOSED_BY_USER' && grievance.status !== 'RESOLVED' && grievance.status !== 'REJECTED' && (
              <Button 
                onClick={handleClose} 
                disabled={closing}
                variant="outline"
                className="rounded-full h-9 px-6 border-red-500/20 text-red-600 hover:bg-red-500/5 font-bold uppercase tracking-widest text-[10px]"
              >
                {closing ? 'Processing...' : 'Close Grievance'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Context - Left Col */}
          <div className="lg:col-span-2 space-y-8">
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={`rounded-full px-4 py-1 font-bold uppercase tracking-widest text-[10px] ${s.bg} ${s.color} ${s.border}`}>
                  <s.icon className="w-3 h-3 mr-2" />
                  {s.label}
                </Badge>
                <Badge variant="outline" className="rounded-full px-4 py-1 font-bold uppercase tracking-widest text-[10px] border-primary/20 text-primary">
                  {grievance.priority} Priority
                </Badge>
                <span className="text-[10px] font-black font-mono text-muted-foreground/60 tracking-widest ml-auto">
                  #GRV-{String(id).padStart(4, '0')}
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tighter leading-tight">{grievance.title}</h1>
              <div className="flex items-center gap-6 text-sm text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {grievance.departmentName}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(grievance.createdAt).toLocaleDateString()}
                </div>
              </div>
            </header>

            <Card className="border-none shadow-sm ring-1 ring-border overflow-hidden bg-card/40 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Detailed Statement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-lg leading-relaxed font-medium whitespace-pre-wrap">
                  {grievance.description}
                </div>
                
                {/* Visual Evidence */}
                {grievance.imageUrl && (
                  <div className="space-y-3 pt-6 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                        Evidence Artifact
                      </h4>
                      <Button variant="ghost" size="sm" asChild className="h-8 text-primary hover:bg-primary/10">
                        <a href={grievance.imageUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-2" /> View Original
                        </a>
                      </Button>
                    </div>
                    <div className="relative group rounded-3xl overflow-hidden border border-border/40 bg-muted/20">
                      <img 
                        src={grievance.imageUrl} 
                        alt="Evidence" 
                        className="w-full object-cover max-h-[500px] transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <ShieldCheck className="h-10 w-10 text-white animate-pulse" />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resolution History / Timeline */}
            <div className="space-y-6">
              <h3 className="flex items-center gap-3 text-xl font-black tracking-tight">
                <History className="h-6 w-6 text-primary" />
                Processing Timeline
              </h3>
              <div className="space-y-0 pl-1">
                {history.length > 0 ? history.map((item, index) => (
                  <div key={item.id} className="relative pl-8 pb-8 last:pb-0">
                    {/* Vertical Line */}
                    {index !== history.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-indigo-600/20" />
                    )}
                    {/* Circle */}
                    <div className="absolute left-0 top-1 h-6 w-6 rounded-full bg-background border-2 border-indigo-600 flex items-center justify-center z-10">
                      <div className="h-2 w-2 rounded-full bg-indigo-600" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-[#4F46E5]">{item.status}</span>
                        <span className="text-[10px] font-bold text-muted-foreground">{new Date(item.updatedAt).toLocaleString()}</span>
                      </div>
                      <p className="font-bold text-base">{item.remarks || "No supplementary comment provided."}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/60 font-semibold">
                        <User className="h-3 w-3" />
                        Processed by {item.updatedBy || "System Core"}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-10 border-2 border-dashed rounded-3xl text-center space-y-2 opacity-50">
                    <p className="font-bold uppercase tracking-widest text-xs">Awaiting Escalation Activity</p>
                    <p className="text-[10px] font-medium italic">No status changes have been recorded yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Info - Right Col */}
          <div className="space-y-8">
            <Card className="border-none shadow-xl shadow-indigo-600/5 ring-1 ring-indigo-600/10 bg-[#4F46E5]/[0.02] overflow-hidden sticky top-24">
              <div className="h-1 bg-[#4F46E5]" />
              <CardHeader>
                <CardTitle className="text-base font-black uppercase tracking-wider flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#4F46E5]" />
                  Operational Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-semibold">Grievance ID</span>
                    <span className="font-black font-mono">#{id}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-semibold">Urgency Level</span>
                    {s && <Badge className={`${s.bg} ${s.color} border-none font-bold uppercase text-[9px] px-2`}>{grievance.priority}</Badge>}
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-semibold">SLA Window</span>
                    <span className="font-bold">48 Business Hours</span>
                  </div>
                </div>

                <Separator className="bg-indigo-600/10" />

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Assigned Officer</label>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-background border border-border/40">
                      <div className="h-8 w-8 rounded-full bg-indigo-600/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span className="text-sm font-bold truncate">{grievance.assignedOfficerName || "Pending Assignment"}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Department Node</label>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-background border border-border/40">
                      <div className="h-8 w-8 rounded-full bg-emerald-600/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-bold truncate">{grievance.departmentName}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  {grievance.status === 'RESOLVED' ? (
                    <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-center space-y-2">
                      <p className="text-sm font-bold text-green-600">Case Resolved Successfully</p>
                      <p className="text-[10px] text-green-600/80 font-medium">Please review the resolution and close the grievance if satisfied.</p>
                    </div>
                  ) : grievance.status === 'CLOSED_BY_USER' ? (
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-2">
                        <p className="text-sm font-black uppercase tracking-widest text-rose-600">Archived by User</p>
                        <p className="text-[9px] text-rose-600/70 font-bold uppercase tracking-tighter">Read-Only Protocol</p>
                    </div>
                  ) : grievance.status === 'REJECTED' ? (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                      <p className="text-sm font-black uppercase tracking-widest text-red-600">Case Rejected</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                       <Button className="w-full h-11 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-indigo-600/20">
                         Download Summary
                       </Button>
                       <p className="text-center text-[10px] text-muted-foreground font-bold">Protocol transmission active</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={modal.isOpen}
        title={modal.title}
        description={modal.description}
        type={modal.type}
        confirmText={modal.confirmText || "Confirm"}
        onConfirm={modal.onConfirm}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        loading={closing && modal.type === 'warning'}
      />
    </div>
  );
};

export default GrievanceDetailsPage;
