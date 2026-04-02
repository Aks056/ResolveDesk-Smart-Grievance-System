import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, Link as LinkIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import ConfirmDialog from '../components/ConfirmDialog';

const NewGrievancePage = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDeps, setFetchingDeps] = useState(true);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: '',
    departmentId: '',
    imageUrl: '',
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [modal, setModal] = useState({ 
    isOpen: false, 
    title: "", 
    description: "", 
    type: "warning" 
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/grievances/departments');
        setDepartments(response.data);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      } finally {
        setFetchingDeps(false);
      }
    };
    fetchDepartments();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description + (formData.imageUrl ? `\n\nReference Image URL: ${formData.imageUrl}` : ''));
      data.append('departmentId', formData.departmentId);
      data.append('priority', formData.priority);
      if (file) {
        data.append('file', file);
      }

      await api.post('/grievances', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      console.error("Submission failed", err);
      setModal({
        isOpen: true,
        title: "Submission Error",
        description: "Failed to transmit your grievance protocol. Please verify your details and network connection, then try again.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
        <Card className="w-full max-w-md text-center py-12 shadow-[0_0_50px_rgba(182,160,255,0.2)] border-primary/20 backdrop-blur-xl bg-card/50">
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in duration-500">
                <CheckCircle2 className="w-12 h-12 text-primary animate-bounce shadow-[0_0_20px_rgba(182,160,255,0.5)]" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Transmission Successful</CardTitle>
            <CardDescription className="text-base text-muted-foreground font-medium">
              Your grievance has been securely registered. Redirecting to dashboard...
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20 px-4 md:px-8 relative selection:bg-primary/30 overflow-hidden transition-colors duration-700">
      {/* Brand Vignette Layers */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-[180px] -z-10 mix-blend-screen opacity-40 dark:opacity-60 animate-pulse" />
      <div className="absolute bottom-[-20%] -left-[-10%] w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[140px] -z-10 opacity-30 dark:opacity-50" />

      <div className="w-full max-w-4xl mx-auto space-y-8 relative animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        <Card className="border-border/40 shadow-[0_0_100px_rgba(0,0,0,0.4)] dark:shadow-[0_0_100px_rgba(126,81,255,0.06)] bg-card/60 dark:bg-card/30 backdrop-blur-3xl ring-1 ring-white/10 dark:ring-white/5 overflow-hidden transform transition-all duration-700">
          <div className="h-2 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:400%_auto] animate-gradient shadow-[0_4px_20px_rgba(126,81,255,0.3)]" />
          
          <CardHeader className="space-y-3 pb-8 border-b border-border/10 bg-muted/5">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-primary/80 mb-1 drop-shadow-[0_0_8px_rgba(182,160,255,0.4)]">
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_rgba(182,160,255,1)]" />
              Secure Portal / Operational Escalation
            </div>
            <CardTitle className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/50">Submit Grievance</CardTitle>
            <CardDescription className="text-lg text-muted-foreground/80 font-semibold leading-relaxed">
              Initiate a high-priority redressal request. Your case will be tracked with end-to-end auditability.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-10 px-6 md:px-10 pb-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* SECTION: IDENTIFICATION */}
              <div className="p-6 md:p-8 rounded-3xl border border-border/10 bg-muted/5 space-y-6 transition-all hover:border-primary/30 hover:shadow-[0_0_30px_rgba(126,81,255,0.05)] group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="title" className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2 group-hover:text-primary transition-colors">
                      <div className="w-1 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(126,81,255,0.5)]" />
                      Designation Identifier
                    </Label>
                    <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Priority Field</span>
                  </div>
                  <Input 
                    id="title" 
                    placeholder="Summarize the core concern..." 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="h-16 border-border/40 bg-background/20 dark:bg-black/40 focus:border-primary/60 focus:ring-primary/5 focus:shadow-[0_0_25px_rgba(126,81,255,0.15)] transition-all font-bold text-xl placeholder:text-muted-foreground/20 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* SECTION: CLASSIFICATION */}
              <div className="p-6 md:p-8 rounded-3xl border border-border/10 bg-muted/5 grid grid-cols-1 md:grid-cols-2 gap-10 transition-all hover:border-secondary/30 hover:shadow-[0_0_30px_rgba(0,212,236,0.05)] group">
                <div className="space-y-4">
                  <Label htmlFor="department" className="text-[11px] font-black uppercase tracking-[0.25em] text-secondary/60 flex items-center gap-2 group-hover:text-secondary transition-colors">
                    <div className="w-1 h-3 bg-secondary rounded-full shadow-[0_0_10px_rgba(0,212,236,0.5)]" />
                    Target Entity
                  </Label>
                  <Select 
                    onValueChange={(val) => setFormData({...formData, departmentId: val})}
                    required
                  >
                    <SelectTrigger className="h-16 border-border/40 bg-background/20 dark:bg-black/40 focus:border-secondary/60 transition-all font-bold rounded-xl">
                      <SelectValue placeholder={fetchingDeps ? "Synchronizing Data..." : "Select Department"} />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-3xl border-border bg-card/95">
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()} className="font-bold focus:bg-secondary/10 py-3">
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="priority" className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2 group-hover:text-primary transition-colors">
                    <div className="w-1 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(126,81,255,0.5)]" />
                    Urgency Analysis
                  </Label>
                  <Select 
                    onValueChange={(val) => setFormData({...formData, priority: val})}
                    required
                  >
                    <SelectTrigger className="h-16 border-border/40 bg-background/20 dark:bg-black/40 focus:border-primary/60 transition-all font-bold rounded-xl">
                      <SelectValue placeholder="Analyze Priority" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-3xl border-border bg-card/95">
                      <SelectItem value="LOW" className="group py-3 font-bold uppercase tracking-widest text-[10px]">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]" />
                          <span className="text-green-500/80 group-hover:text-green-400 transition-colors">Routine / Low</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="MEDIUM" className="group py-3 font-bold uppercase tracking-widest text-[10px]">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.4)]" />
                          <span className="text-yellow-500/80 group-hover:text-yellow-400 transition-colors">Escalated / Medium</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="HIGH" className="group py-3 font-bold uppercase tracking-widest text-[10px]">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-destructive shadow-[0_0_12px_rgba(255,81,250,0.4)]" />
                          <span className="text-destructive group-hover:text-destructive/80 transition-colors">Critical / High</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* SECTION: CONTEXT */}
              <div className="p-6 md:p-8 rounded-3xl border border-border/10 bg-muted/5 space-y-4 transition-all hover:border-secondary/30 hover:shadow-[0_0_30px_rgba(0,212,236,0.05)] group">
                <Label htmlFor="description" className="text-[11px] font-black uppercase tracking-[0.25em] text-secondary/60 flex items-center gap-2 group-hover:text-secondary transition-colors">
                  <div className="w-1 h-3 bg-secondary rounded-full shadow-[0_0_10px_rgba(0,212,236,0.5)]" />
                  Detailed Log & Narrative
                </Label>
                <Textarea 
                  id="description" 
                  placeholder="Provide a comprehensive breakdown of the incident..." 
                  className="min-h-[220px] border-border/40 bg-background/20 dark:bg-black/40 focus:border-secondary/60 focus:ring-secondary/5 focus:shadow-[0_0_30px_rgba(0,212,236,0.15)] transition-all font-bold text-lg resize-none placeholder:text-muted-foreground/20 leading-relaxed rounded-xl p-6"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>

              {/* SECTION: EVIDENCE */}
              <div className="p-6 md:p-8 rounded-3xl border border-border/10 bg-muted/5 space-y-6 transition-all hover:border-primary/30 hover:shadow-[0_0_30px_rgba(126,81,255,0.05)] group">
                <Label className="text-[11px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2 group-hover:text-primary transition-colors">
                  <div className="w-1 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(126,81,255,0.5)]" />
                  Evidence Uplink Terminal
                </Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div 
                    className="relative border-2 border-dashed border-border/20 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer overflow-hidden group shadow-inner dark:bg-black/20"
                  >
                    {preview ? (
                      <div className="absolute inset-0">
                        <img src={preview} alt="Preview" className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                          <Button 
                            type="button"
                            variant="destructive" 
                            size="sm"
                            className="font-black uppercase tracking-widest px-6 shadow-2xl"
                            onClick={(e) => { e.stopPropagation(); setPreview(null); setFile(null); }}
                          >
                            Purge Asset
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-[0_0_20px_rgba(126,81,255,0.2)]">
                          <Upload className="w-8 h-8 text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-black uppercase tracking-widest mb-1 text-foreground/80">Uplink Visuals</p>
                          <p className="text-[10px] text-muted-foreground/60 font-bold tracking-tight">Direct file injection (JPG/PNG)</p>
                        </div>
                        <Input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                      </>
                    )}
                  </div>

                  <div className="space-y-6 p-10 border border-border/10 rounded-2xl bg-muted/5 backdrop-blur-2xl flex flex-col justify-center dark:bg-black/20">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-secondary/60">
                      <LinkIcon className="w-4 h-4 text-secondary/80 shadow-[0_0_8px_rgba(0,212,236,0.4)]" />
                      External Data Link
                    </div>
                    <Input 
                      placeholder="https://cloud.matrix/evidence..." 
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      className="bg-background/20 dark:bg-black/40 border-border/40 h-12 focus:border-secondary/60 focus:shadow-[0_0_20px_rgba(0,212,236,0.2)] transition-all text-sm font-bold rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* ACTION: SUBMISSION */}
              <div className="pt-10">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-20 text-sm font-black uppercase tracking-[0.4em] bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-white border-none shadow-[0_0_40px_rgba(126,81,255,0.3)] hover:shadow-[0_0_60px_rgba(126,81,255,0.5)] transition-all transform active:scale-[0.97] rounded-2xl group"
                >
                  {loading ? (
                    <div className="flex items-center gap-4">
                      <Loader2 className="w-6 h-6 animate-spin" /> 
                      <span className="animate-pulse tracking-widest">Broadcasting Protocol...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 group-hover:scale-105 transition-transform">
                      Deliver Grievance Protocol
                      <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_white] animate-pulse" />
                    </div>
                  )}
                </Button>
                <div className="mt-8 flex items-center justify-center gap-3 opacity-30 group">
                  <AlertCircle className="w-4 h-4 text-primary group-hover:animate-shake" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Verified Secure End-to-End Encryption Enabled</p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog 
        isOpen={modal.isOpen}
        title={modal.title}
        description={modal.description}
        type={modal.type}
        confirmText="Acknowledge"
        onConfirm={() => setModal(prev => ({ ...prev, isOpen: false }))}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default NewGrievancePage;
