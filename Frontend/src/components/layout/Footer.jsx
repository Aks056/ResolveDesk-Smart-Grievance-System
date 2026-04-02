import { Link } from 'react-router-dom';
import { LayoutDashboard, Mail, Phone, MapPin, ExternalLink, Code, Globe, Share2 } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/40 bg-card/10 backdrop-blur-sm selection:bg-primary/30 pt-16 pb-8 px-4">
      <div className="container max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg transition-transform group-hover:rotate-12">
                 <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-black uppercase tracking-tighter text-2xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                ResolveDesk
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs font-medium">
              The next-generation campus grievance redressal system. Empowering students and authorities through transparent, end-to-end synchronized issue tracking.
            </p>
            <div className="flex items-center gap-4">
              <Link to="#" className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300">
                <Globe className="w-4 h-4" />
              </Link>
              <Link to="#" className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300">
                <Code className="w-4 h-4" />
              </Link>
              <Link to="#" className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300">
                <Share2 className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/50">Navigation</h4>
            <ul className="space-y-4">
              {[
                { label: 'Dashboard', path: '/dashboard' },
                { label: 'My Grievances', path: '/grievances' },
                { label: 'Recent Grievance', path: '/recent-grievances' },
                { label: 'Submit Report', path: '/grievances/new' }
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Campus Resources */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/50">Campus Resources</h4>
            <ul className="space-y-4">
              {['Student Portal', 'Academic Calendar', 'Library Access', 'Hostel Services'].map((link) => (
                <li key={link}>
                  <Link to="#" className="text-sm font-semibold text-muted-foreground hover:text-secondary transition-colors flex items-center gap-2 group">
                    <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/50">Command Support</h4>
            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">Uplink Email</p>
                  <p className="text-sm font-bold">support@resolvedesk.edu</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">Tactical Comms</p>
                  <p className="text-sm font-bold">+1-800-CAMPUS-HQ</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">Command Post</p>
                  <p className="text-sm font-bold">Central Admin, Wing B-12</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="opacity-10" />

        {/* Bottom Section */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
            &copy; {currentYear} ResolveDesk Terminal v2.4.0
          </div>
          <div className="flex items-center gap-8">
            <Link to="#" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-primary transition-colors">Privacy Protocol</Link>
            <Link to="#" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-primary transition-colors">Usage Terms</Link>
            <Link to="#" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-primary transition-colors">Redressal Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
