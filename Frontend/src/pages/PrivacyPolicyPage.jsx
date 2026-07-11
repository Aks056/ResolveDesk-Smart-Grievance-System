import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Database, 
  ArrowLeft, 
  FileText,
  Server,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();
  const lastUpdated = "July 6, 2026";

  const sections = [
    {
      icon: <Database className="w-6 h-6 text-primary" />,
      title: "1. Data Collection Protocols",
      description: "How and what information is ingested into the system.",
      points: [
        "Identity Credentials: First name, last name, email address, contact numbers, and campus affiliation are collected upon user registration to authenticate credentials.",
        "Grievance Data: Description of grievances, category types, related files, and chronological event logs submitted for redressal.",
        "System Interactions: Automatic session logs, JWT-based credentials, and access timestamps are logged securely for administrative oversight."
      ]
    },
    {
      icon: <UserCheck className="w-6 h-6 text-secondary" />,
      title: "2. Operational Data Usage",
      description: "How details are handled through our administrative channels.",
      points: [
        "Redressal Workflow: Grievances are routed directly to assigned officers and admin panels relative to the grievance classification.",
        "Communications: Automated status notifications via email or system alerts are dispatched dynamically when grievances update.",
        "Statistical Analytics: High-level dashboards process grievance counts and resolution durations anonymously to compute campus wellness statistics."
      ]
    },
    {
      icon: <Lock className="w-6 h-6 text-primary" />,
      title: "3. Cryptographic & Security Measures",
      description: "Industry-standard protocols to shield sensitive information.",
      points: [
        "Data Encryption: Sensitive authentication databases and user sessions are stored using robust security hashes (bcrypt/JWT tokens).",
        "Encrypted Transport: All network packets transmitted between ResolveDesk backend servers and client devices use secure protocols (HTTPS).",
        "Role-Based Access Control: Granular authority tiers ensure student grievances are only viewable by authorized system administrators and specific grievance officers."
      ]
    },
    {
      icon: <Eye className="w-6 h-6 text-secondary" />,
      title: "4. User Privacy & Access Rights",
      description: "System protocols guaranteeing control over your credentials.",
      points: [
        "Grievance Tracking: Complete transparency over who has reviewed, assigned, or edited your grievance timeline.",
        "Profile Management: Direct access via settings panels to update personal information, change security keys, or correct inaccurate credentials.",
        "Record Retention: Closed grievances are safely archived within the database to prevent accidental data destruction and verify compliance logs."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background py-20 px-4 md:px-8 relative selection:bg-primary/30 overflow-hidden transition-colors duration-700">
      {/* Brand Vignette Layers */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-primary/5 rounded-full blur-[200px] -z-10 mix-blend-screen opacity-40 animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[140px] -z-10 opacity-30" />

      <div className="w-full max-w-4xl mx-auto space-y-10 relative animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <span className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary shadow-[0_0_15px_rgba(126,81,255,0.15)]">
            Active Security Protocol
          </span>
        </div>

        {/* Page Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/20 mb-2">
            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/70">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground font-medium text-sm md:text-base leading-relaxed">
            ResolveDesk takes your data security and user anonymity seriously. Read our institutional parameters governing grievance transparency and credentials collection.
          </p>
        </div>

        {/* Main Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {sections.map((section, idx) => (
            <Card key={idx} className="border-border/10 bg-card/30 backdrop-blur-3xl ring-1 ring-white/10 rounded-[2rem] overflow-hidden shadow-xl hover:border-primary/20 hover:ring-primary/10 transition-all duration-300 flex flex-col">
              <CardHeader className="space-y-3 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-muted/20 flex items-center justify-center">
                  {section.icon}
                </div>
                <div>
                  <CardTitle className="text-lg font-black tracking-tight">
                    {section.title}
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-muted-foreground/80 mt-1">
                    {section.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <ul className="space-y-3 text-sm text-muted-foreground font-medium">
                  {section.points.map((point, pointIdx) => (
                    <li key={pointIdx} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2 shrink-0" />
                      <p className="leading-relaxed">{point}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Meta Details */}
        <Card className="border-border/10 bg-card/10 backdrop-blur-md ring-1 ring-white/5 rounded-[2rem] p-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
            <FileText className="w-4 h-4 text-muted-foreground/50" />
            Document Verification
          </div>
          <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-xl mx-auto font-medium">
            This security protocol is maintained and supervised by the Central Administration. Updates are periodically implemented to meet changing security models and institutional campus guidelines.
          </p>
          <div className="pt-2 border-t border-border/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
            Last Updated: {lastUpdated} &bull; Security Standard v2.4.0
          </div>
        </Card>

      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
