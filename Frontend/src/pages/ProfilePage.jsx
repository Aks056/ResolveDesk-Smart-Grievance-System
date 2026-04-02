import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  KeyRound, 
  Save, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { getCurrentProfile, updateProfile, changePassword } from '../lib/api';

const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: ''
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getCurrentProfile();
      const data = response.data;
      setProfileData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phoneNumber: data.phone || '', // Backend uses 'phone' in UserResponse but 'phoneNumber' in ProfileUpdateRequest
        address: data.address || ''
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const onUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await updateProfile(profileData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      // Keep message for 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match!' });
      return;
    }
    
    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });
    
    try {
      await changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setPasswordMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change password. Profile verification failed.' 
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-20 px-4 md:px-8 relative selection:bg-primary/30 overflow-hidden transition-colors duration-700">
      {/* Brand Vignette Layers */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-primary/5 rounded-full blur-[200px] -z-10 mix-blend-screen opacity-40 animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[140px] -z-10 opacity-30" />

      <div className="w-full max-w-6xl mx-auto space-y-10 relative animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Profile Header Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Identity Card */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-border/10 bg-card/30 backdrop-blur-3xl ring-1 ring-white/10 rounded-[2.5rem] overflow-hidden group shadow-2xl relative">
              <div className="h-40 bg-gradient-to-br from-primary/20 via-background to-secondary/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
              </div>
              
              <div className="px-8 pb-10 -mt-20 relative text-center">
                <div className="relative inline-block group/avatar">
                  <div className="h-40 w-40 rounded-full border-8 border-background bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-6xl font-black shadow-[0_0_50px_rgba(126,81,255,0.3)] transition-all duration-700 group-hover:scale-105 group-hover:rotate-3">
                    {profileData.firstName?.charAt(0)}{profileData.lastName?.charAt(0)}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-secondary text-secondary-foreground p-3 rounded-2xl shadow-xl border-4 border-background group-hover/avatar:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-primary drop-shadow-[0_0_8px_rgba(126,81,255,0.4)]">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_rgba(126,81,255,1)]" />
                    Operational Identity
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter truncate">
                    {profileData.firstName} {profileData.lastName}
                  </h2>
                  <div className="pt-2">
                    <span className="px-4 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
                      {user?.role} Access Protocol
                    </span>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border/10 space-y-4 text-left">
                  <div className="flex items-center gap-4 group/item">
                    <div className="w-10 h-10 rounded-xl bg-muted/20 flex items-center justify-center group-hover/item:bg-primary/20 transition-colors">
                      <Mail className="h-4 w-4 text-primary/70" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Uplink Address</p>
                      <p className="text-sm font-bold truncate opacity-80">{profileData.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 group/item">
                    <div className="w-10 h-10 rounded-xl bg-muted/20 flex items-center justify-center group-hover/item:bg-secondary/20 transition-colors">
                      <Phone className="h-4 w-4 text-secondary/70" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Communication Key</p>
                      <p className="text-sm font-bold opacity-80">{profileData.phoneNumber || 'Not Synchronized'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="p-8 rounded-[2rem] border border-secondary/10 bg-secondary/5 backdrop-blur-md space-y-4 shadow-xl group hover:border-secondary/30 transition-all">
               <div className="flex items-center gap-3 text-secondary font-black uppercase text-xs tracking-[0.3em] drop-shadow-[0_0_8px_rgba(0,212,236,0.3)]">
                 <ShieldCheck className="h-5 w-5" /> Security Status
               </div>
               <p className="text-xs font-bold leading-relaxed text-muted-foreground/80 italic">
                 "Your biometric signature and account access tokens are currently valid and synchronized with the central repository."
               </p>
            </div>
          </div>

          {/* RIGHT: Action Forms */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* PROFILE FORM */}
            <Card className="border-border/10 bg-card/20 backdrop-blur-3xl ring-1 ring-white/5 rounded-[2.5rem] overflow-hidden group hover:border-primary/20 transition-all duration-500 shadow-2xl">
              <div className="h-2 bg-gradient-to-r from-primary via-primary/40 to-transparent" />
              <CardHeader className="pt-10 px-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-[0_0_20px_rgba(126,81,255,0.1)]">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black tracking-tighter uppercase">Matrix Signature Settings</CardTitle>
                    <CardDescription className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Maintain your digital footprint across the redressal interface.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <form onSubmit={onUpdateProfile}>
                <CardContent className="p-10 pt-4 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label htmlFor="firstName" className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                        <div className="w-1 h-3 bg-primary rounded-full" />
                        First designation
                      </Label>
                      <Input 
                        id="firstName" 
                        name="firstName"
                        value={profileData.firstName} 
                        onChange={handleProfileChange}
                        className="h-14 border-border/40 bg-background/20 dark:bg-black/30 focus:border-primary/60 focus:shadow-[0_0_20px_rgba(126,81,255,0.15)] transition-all font-bold rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-4">
                      <Label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                        <div className="w-1 h-3 bg-primary rounded-full" />
                        Last designation
                      </Label>
                      <Input 
                        id="lastName" 
                        name="lastName"
                        value={profileData.lastName} 
                        onChange={handleProfileChange}
                        className="h-14 border-border/40 bg-background/20 dark:bg-black/30 focus:border-primary/60 focus:shadow-[0_0_20px_rgba(126,81,255,0.15)] transition-all font-bold rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.25em] text-secondary/60 flex items-center gap-2">
                        <div className="w-1 h-3 bg-secondary rounded-full" />
                        Uplink Correspondence
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                        <Input 
                          id="email" 
                          name="email"
                          type="email"
                          value={profileData.email} 
                          onChange={handleProfileChange}
                          className="pl-12 h-14 border-border/40 bg-background/20 dark:bg-black/30 focus:border-secondary/60 focus:shadow-[0_0_20px_rgba(0,212,236,0.15)] transition-all font-bold rounded-xl"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label htmlFor="phoneNumber" className="text-[10px] font-black uppercase tracking-[0.25em] text-secondary/60 flex items-center gap-2">
                        <div className="w-1 h-3 bg-secondary rounded-full" />
                        Communication Key
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                        <Input 
                          id="phoneNumber" 
                          name="phoneNumber"
                          value={profileData.phoneNumber} 
                          onChange={handleProfileChange}
                          className="pl-12 h-14 border-border/40 bg-background/20 dark:bg-black/30 focus:border-secondary/60 focus:shadow-[0_0_20px_rgba(0,212,236,0.15)] transition-all font-bold rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                      <div className="w-1 h-3 bg-primary rounded-full" />
                      Operational Coordinates
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-5 h-5 w-5 text-muted-foreground/40" />
                      <Textarea 
                        id="address" 
                        name="address"
                        value={profileData.address} 
                        onChange={handleProfileChange}
                        className="pl-12 min-h-[120px] pt-4 border-border/40 bg-background/20 dark:bg-black/30 focus:border-primary/60 focus:shadow-[0_0_20px_rgba(126,81,255,0.15)] transition-all font-bold text-lg resize-none placeholder:text-muted-foreground/20 leading-relaxed rounded-xl"
                        placeholder="Department or residential coordinates"
                      />
                    </div>
                  </div>

                  {message.text && (
                    <div className={`p-6 rounded-2xl flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] animate-in slide-in-from-top-4 duration-500 shadow-xl ${
                      message.type === 'success' 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}>
                      {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 shadow-[0_0_10px_rgba(126,81,255,0.5)]" /> : <AlertCircle className="h-5 w-5" />}
                      {message.text}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="px-10 pb-10 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="h-16 px-10 bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-white font-black uppercase tracking-[0.4em] rounded-2xl shadow-[0_0_40px_rgba(126,81,255,0.25)] hover:shadow-[0_0_60px_rgba(126,81,255,0.4)] transition-all transform active:scale-[0.98]"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="mr-3 h-5 w-5" />}
                    Synchronize Profile Protocol
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* PASSWORD FORM */}
            <Card className="border-border/10 bg-card/20 backdrop-blur-3xl ring-1 ring-white/5 rounded-[2.5rem] overflow-hidden group hover:border-secondary/20 transition-all duration-500 shadow-2xl">
              <div className="h-2 bg-gradient-to-r from-secondary via-secondary/40 to-transparent" />
              <CardHeader className="pt-10 px-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-secondary/10 text-secondary shadow-[0_0_20px_rgba(0,212,236,0.1)]">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black tracking-tighter uppercase">Security Authorization Hub</CardTitle>
                    <CardDescription className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Update your encryption keys for administrative access.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <form onSubmit={onChangePassword}>
                <CardContent className="p-10 pt-4 space-y-8">
                  <div className="space-y-4">
                    <Label htmlFor="oldPassword" className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/60 flex items-center gap-2">
                       <div className="w-1 h-3 bg-primary rounded-full" />
                       Current Authorization Key
                    </Label>
                    <Input 
                      id="oldPassword" 
                      name="oldPassword"
                      type="password"
                      placeholder="••••••••"
                      value={passwordData.oldPassword} 
                      onChange={handlePasswordChange}
                      className="h-14 border-border/40 bg-background/20 dark:bg-black/30 focus:border-primary/60 focus:shadow-[0_0_20px_rgba(126,81,255,0.15)] transition-all font-bold rounded-xl"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label htmlFor="newPassword" className="text-[10px] font-black uppercase tracking-[0.25em] text-secondary/60 flex items-center gap-2">
                        <div className="w-1 h-3 bg-secondary rounded-full" />
                        New Matrix Key
                      </Label>
                      <Input 
                        id="newPassword" 
                        name="newPassword"
                        type="password"
                        placeholder="••••••••"
                        value={passwordData.newPassword} 
                        onChange={handlePasswordChange}
                        className="h-14 border-border/40 bg-background/20 dark:bg-black/30 focus:border-secondary/60 focus:shadow-[0_0_20px_rgba(0,212,236,0.15)] transition-all font-bold rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-4">
                      <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-[0.25em] text-secondary/60 flex items-center gap-2">
                        <div className="w-1 h-3 bg-secondary rounded-full" />
                        Verify Key Signature
                      </Label>
                      <Input 
                        id="confirmPassword" 
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={passwordData.confirmPassword} 
                        onChange={handlePasswordChange}
                        className="h-14 border-border/40 bg-background/20 dark:bg-black/30 focus:border-secondary/60 focus:shadow-[0_0_20px_rgba(0,212,236,0.15)] transition-all font-bold rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  {passwordMessage.text && (
                    <div className={`p-6 rounded-2xl flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] animate-in zoom-in-95 duration-300 shadow-xl ${
                      passwordMessage.type === 'success' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}>
                      {passwordMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5 shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> : <AlertCircle className="h-5 w-5" />}
                      {passwordMessage.text}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="px-10 pb-10 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={passwordLoading}
                    variant="outline"
                    className="h-16 px-10 border-secondary/30 hover:bg-secondary/10 hover:text-secondary text-secondary font-black uppercase tracking-[0.4em] rounded-2xl transition-all shadow-[0_0_30px_rgba(0,212,236,0.05)] hover:shadow-[0_0_50px_rgba(0,212,236,0.2)]"
                  >
                    {passwordLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="mr-3 h-5 w-5" />}
                    Update Authorization Keys
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
