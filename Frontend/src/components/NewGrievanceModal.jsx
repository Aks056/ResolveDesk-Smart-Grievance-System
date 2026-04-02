import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Upload, Link as LinkIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const NewGrievanceModal = ({ isOpen, onClose, onSuccess }) => {
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

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);

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
      setTimeout(() => {
        setSuccess(false);
        setFormData({ title: '', description: '', priority: '', departmentId: '', imageUrl: '' });
        setFile(null);
        setPreview(null);
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Submission failed", err);
      alert("Failed to submit grievance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="absolute inset-0 -z-10" onClick={onClose} />
      
      <Card className="w-full max-w-2xl border-border shadow-2xl bg-card/60 backdrop-blur-xl ring-1 ring-white/10 overflow-hidden transform perspective(1000px) rotateX(1deg) transition-all">
        <div className="h-1.5 bg-gradient-to-r from-cyan-400 via-primary to-blue-600 w-full" />
        
        <CardHeader className="relative space-y-2 pb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground rounded-full"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
          <CardTitle className="text-3xl font-extrabold tracking-tight">Submit New Grievance</CardTitle>
          <CardDescription className="text-base text-muted-foreground/80">
            Escalate your concern to campus authorities with 3D-tracked resolution.
          </CardDescription>
        </CardHeader>

        <CardContent className="max-h-[75vh] overflow-y-auto custom-scrollbar pr-2">
          {success ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-in zoom-in duration-500">
              <div className="w-20 h-20 rounded-full bg-cyan-400/10 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-cyan-400 animate-bounce" />
              </div>
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                Transmission Successful
              </h3>
              <p className="text-muted-foreground">Your grievance has been securely registered in the system.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 pb-2">
              {/* Title */}
              <div className="space-y-2.5">
                <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Issue Title</Label>
                <Input 
                  id="title" 
                  placeholder="Summarize your issue..." 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="h-12 border-muted-foreground/10 bg-background/30 focus:border-cyan-400/50 focus:ring-cyan-400/10 transition-all placeholder:text-muted-foreground/30 font-medium"
                  required
                />
              </div>

              {/* Department & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="department" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Target Department</Label>
                  <Select 
                    onValueChange={(val) => setFormData({...formData, departmentId: val})}
                    required
                  >
                    <SelectTrigger className="h-12 border-muted-foreground/10 bg-background/30 focus:border-cyan-400/50 transition-all">
                      <SelectValue placeholder={fetchingDeps ? "Syncing..." : "Choose Department"} />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-xl border-border bg-card/90">
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="priority" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Urgency Level</Label>
                  <Select 
                    onValueChange={(val) => setFormData({...formData, priority: val})}
                    required
                  >
                    <SelectTrigger className="h-12 border-muted-foreground/10 bg-background/30 focus:border-cyan-400/50 transition-all">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-xl border-border bg-card/90">
                      <SelectItem value="LOW" className="group">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                          <span className="group-hover:text-green-400 transition-colors">Low (Routine)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="MEDIUM" className="group">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                          <span className="group-hover:text-yellow-400 transition-colors">Medium (Important)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="HIGH" className="group">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                          <span className="group-hover:text-destructive transition-colors">High (Critical)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2.5">
                <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Description & Details</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe your grievance in detail..." 
                  className="min-h-[120px] border-muted-foreground/10 bg-background/30 focus:border-cyan-400/50 transition-all placeholder:text-muted-foreground/30 font-medium resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>

              {/* Evidence Group */}
              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Supporting Evidence</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className="relative border-2 border-dashed border-muted-foreground/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all cursor-pointer overflow-hidden group"
                  >
                    {preview ? (
                      <div className="absolute inset-0">
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                          <Button 
                            type="button"
                            variant="ghost" 
                            className="text-white hover:bg-white/10" 
                            onClick={(e) => { e.stopPropagation(); setPreview(null); setFile(null); }}
                          >
                            Reset
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/80">Upload Photo</p>
                        <Input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                      </>
                    )}
                  </div>

                  <div className="space-y-2 p-4 border border-muted-foreground/5 rounded-xl bg-muted/10 backdrop-blur-sm flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-muted-foreground/60">
                      <LinkIcon className="w-3 h-3 text-cyan-400" />
                      External Link
                    </div>
                    <Input 
                      placeholder="https://..." 
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      className="bg-transparent border-muted-foreground/10 h-8 focus:border-cyan-400/30 transition-all text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 text-sm font-black uppercase tracking-[0.2em] bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-white border-none shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] transform transition-active active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Synchronizing...
                    </div>
                  ) : (
                    "Transmit Grievance"
                  )}
                </Button>
                <div className="mt-4 flex items-center justify-center gap-2 opacity-50">
                  <AlertCircle className="w-3 h-3 text-cyan-400" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted Redressal</p>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NewGrievanceModal;
