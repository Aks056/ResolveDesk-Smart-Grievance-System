import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CoreNarrative from '../components/CoreNarrative';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Link as LinkIcon, Loader2, CheckCircle2, AlertCircle, ShieldCheck, Zap, Activity } from "lucide-react";
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
  const [evidenceType, setEvidenceType] = useState('upload'); // 'upload' or 'link'
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
    if (!formData.description || !formData.description.trim()) {
      setModal({
        isOpen: true,
        title: "Validation Error",
        description: "The description cannot be empty.",
        type: "error"
      });
      return;
    }
    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      
      let finalDescription = formData.description;
      if (evidenceType === 'link' && formData.imageUrl) {
        finalDescription += `\n\nReference Image URL: ${formData.imageUrl}`;
      }
      data.append('description', finalDescription);
      data.append('departmentId', formData.departmentId);
      data.append('priority', formData.priority);
      if (evidenceType === 'upload' && file) {
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
        description: "Network distortion interrupted the relay. Verify connection and retry.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background animate-pulse duration-[3000ms]" />
        <Card className="w-full max-w-lg text-center py-16 shadow-[0_0_80px_rgba(182,160,255,0.3)] border-primary/30 backdrop-blur-3xl bg-card/40 z-10 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full blur-[50px]" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px]" />
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-[30px] bg-primary/10 flex items-center justify-center animate-in zoom-in spin-in-12 duration-700 relative shadow-inner">
                <div className="absolute inset-0 rounded-[30px] border border-primary/50 animate-ping opacity-30" />
                <CheckCircle2 className="w-12 h-12 text-primary drop-shadow-[0_0_15px_rgba(182,160,255,1)]" />
              </div>
            </div>
            <CardTitle className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-primary to-secondary pt-4">
              Relay Complete
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground/90 font-medium">
              Your transmission has been securely injected into the main grid. Initiating redirect...
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] w-full bg-background text-foreground relative overflow-hidden flex items-stretch">

      {/* Immersive Background Effects */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] bg-primary/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3 opacity-50 dark:opacity-70 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] bg-secondary/10 rounded-full blur-[150px] translate-y-1/3 -translate-x-1/3 opacity-50 dark:opacity-70 pointer-events-none" />

      {/* Cyber-Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none" />

      <div className="w-full h-full z-10 flex items-stretch relative">

        {/* Left Column: Branding / Info (Pinned & Static) */}
        <div className="hidden lg:flex lg:w-[40%] xl:w-[35%] flex-col justify-between h-full p-8 lg:p-12 xl:p-16 border-r border-border/10 bg-background/20 backdrop-blur-sm z-10 relative overflow-hidden select-none">
          {/* Visual background decorations in left pane */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-[80px]" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-secondary/5 rounded-full blur-[80px]" />

          <div className="my-auto space-y-8 animate-in slide-in-from-left-8 fade-in duration-1000">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary w-max shadow-[0_0_15px_rgba(182,160,255,0.2)]">
              <Activity className="w-4 h-4 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Submit a Request</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl xl:text-6xl font-black tracking-tighter leading-[1.1]">
                Raise a <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient">
                  Concern.
                </span>
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed max-w-md font-medium">
                Please provide the details of your issue below. Your complaint will be routed to the respective department for quick resolution.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/10 flex flex-col gap-2 backdrop-blur-md">
                <ShieldCheck className="w-6 h-6 text-secondary drop-shadow-[0_0_8px_rgba(0,212,236,0.6)]" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-foreground">Secure Submission</h4>
                  <p className="text-[10px] text-muted-foreground leading-snug">End-to-end trace protection</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col gap-2 backdrop-blur-md">
                <Zap className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(182,160,255,0.6)]" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-foreground">Fast Resolution</h4>
                  <p className="text-[10px] text-muted-foreground leading-snug">Automated priority routing</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scrollable Form Container */}
        <div className="flex-1 h-full overflow-y-auto z-10 flex flex-col items-center py-10 px-4 sm:px-8 lg:px-12 xl:px-16 scrollbar-thin scrollbar-thumb-border/20 scrollbar-track-transparent">
          <div className="w-full max-w-2xl my-auto animate-in slide-in-from-right-8 fade-in duration-1000 delay-150">
            <Card className="rounded-[2.5rem] border-border/20 shadow-2xl bg-card/60 backdrop-blur-2xl overflow-hidden relative">
              {/* Top gradient edge */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-80" />

              <CardContent className="p-8 sm:p-10">
                {/* Mobile Header (Hidden on Desktop) */}
                <div className="lg:hidden pb-10 space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary w-max">
                    <Activity className="w-3 h-3 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Secure Node</span>
                  </div>
                  <h1 className="text-4xl font-black tracking-tighter">Submit Concern</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                  {/* Title */}
                  <div className="space-y-3 group">
                    <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-foreground transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(182,160,255,0.8)] transition-all" />
                      Subject 
                    </Label>
                    <Input
                      id="title"
                      placeholder="Briefly summarize the issue..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="h-14 border-x-0 border-t-0 border-b-2 border-b-border/30 rounded-none bg-transparent px-2 text-lg font-bold hover:border-b-primary/50 focus:border-b-primary focus:ring-0 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/65 shadow-none px-0"
                      required
                    />
                  </div>

                  {/* Dropdowns row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {/* Department */}
                    <div className="space-y-3 group">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-foreground transition-colors flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(0,212,236,0.8)] transition-all" />
                        Department
                      </Label>
                      <Select onValueChange={(val) => setFormData({ ...formData, departmentId: val })} required>
                        <SelectTrigger className="h-14 border-border/30 bg-background/50 hover:bg-background focus:ring-secondary/20 focus:border-secondary transition-all rounded-2xl font-semibold shadow-inner">
                          <SelectValue placeholder={fetchingDeps ? "Scanning Sectors..." : "Select Department"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/50 backdrop-blur-2xl bg-card/90">
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()} className="font-semibold py-3 cursor-pointer focus:bg-secondary/15 focus:text-secondary">
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Priority */}
                    <div className="space-y-3 group">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-foreground transition-colors flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(182,160,255,0.8)] transition-all" />
                        Priority
                      </Label>
                      <Select onValueChange={(val) => setFormData({ ...formData, priority: val })} required>
                        <SelectTrigger className="h-14 border-border/30 bg-background/50 hover:bg-background focus:ring-primary/20 focus:border-primary transition-all rounded-2xl font-semibold shadow-inner">
                          <SelectValue placeholder="Assess Priority" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/50 backdrop-blur-2xl bg-card/90">
                          <SelectItem value="LOW" className="py-3 font-bold text-xs uppercase tracking-wider cursor-pointer text-green-500/80 focus:bg-green-500/10 focus:text-green-400">
                            Routine / Low
                          </SelectItem>
                          <SelectItem value="MEDIUM" className="py-3 font-bold text-xs uppercase tracking-wider cursor-pointer text-yellow-500/80 focus:bg-yellow-500/10 focus:text-yellow-400">
                            Escalated / Medium
                          </SelectItem>
                          <SelectItem value="HIGH" className="py-3 font-bold text-xs uppercase tracking-wider cursor-pointer text-destructive/90 focus:bg-destructive/10 focus:text-destructive">
                            Critical / High
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Description (CoreNarrative Terminal) */}
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(0,212,236,0.8)] transition-all" />
                      Description
                    </Label>
                    <CoreNarrative                      value={formData.description}
                      onChange={(text) => setFormData({ ...formData, description: text })}
                      placeholder="Provide a comprehensive operational log. Include specific locations, dates, and the immediate impact to expedite routing..."
                    />
                  </div>

                  {/* File Upload & External Link Tabs */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(182,160,255,0.8)] transition-all" />
                        Supporting Documents
                      </Label>
                      
                      {/* Glassmorphic Tab Switcher */}
                      <div className="flex p-1 bg-muted/40 backdrop-blur-md rounded-2xl border border-border/30 w-max">
                        <button
                          type="button"
                          onClick={() => setEvidenceType('upload')}
                          className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                            evidenceType === 'upload'
                              ? 'bg-background text-foreground shadow-sm border border-border/20'
                              : 'text-muted-foreground/60 hover:text-foreground'
                          }`}
                        >
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setEvidenceType('link')}
                          className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                            evidenceType === 'link'
                              ? 'bg-background text-foreground shadow-sm border border-border/20'
                              : 'text-muted-foreground/60 hover:text-foreground'
                          }`}
                        >
                          Paste Link
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      {evidenceType === 'upload' ? (
                        /* Visual Upload Area */
                        <div className="relative border-2 border-dashed border-border/40 hover:border-primary/50 bg-background/30 hover:bg-primary/5 transition-all rounded-3xl h-28 flex items-center justify-center overflow-hidden cursor-pointer group shadow-inner">
                          {preview ? (
                            <div className="absolute inset-0 w-full h-full">
                              <img src={preview} alt="Upload Preview" className="w-full h-full object-cover opacity-60" />
                              <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  type="button" size="sm" variant="destructive"
                                  onClick={(e) => { e.stopPropagation(); setPreview(null); setFile(null); }}
                                  className="font-bold tracking-widest uppercase text-[10px] rounded-xl"
                                >
                                  Discard
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:-translate-y-1 transition-all" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground">Upload Image</span>
                            </div>
                          )}
                          <Input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                          />
                        </div>
                      ) : (
                        /* External Link Input */
                        <div className="relative flex flex-col justify-center bg-background/50 border border-border/30 rounded-3xl px-6 h-28 shadow-inner focus-within:border-secondary/50 focus-within:ring-1 focus-within:ring-secondary/20 transition-all">
                          <div className="flex items-center gap-2 mb-2">
                            <LinkIcon className="w-3 h-3 text-secondary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ext. Link</span>
                          </div>
                          <Input
                            placeholder="https://cloud.host/image.png"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            className="h-8 border-none bg-transparent p-0 shadow-none focus-visible:ring-0 text-xs font-medium placeholder:text-muted-foreground/65"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Action */}
                  <div className="pt-6">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-16 rounded-[2rem] text-sm font-black uppercase tracking-widest bg-foreground text-background hover:bg-primary hover:text-white shadow-[0_10px_40px_rgba(0,0,0,0.2)] hover:shadow-[0_10px_40px_rgba(182,160,255,0.4)] transition-all duration-300 transform active:scale-95 group overflow-hidden relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      {loading ? (
                        <span className="relative z-10 flex items-center justify-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Encrypting & Sending...
                        </span>
                      ) : (
                        <span className="relative z-10 flex items-center justify-center gap-3">
                          Submit Grievance <Zap className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </div>
                </form>

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
        confirmText="Acknowledge"
        onConfirm={() => setModal(prev => ({ ...prev, isOpen: false }))}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default NewGrievancePage;
