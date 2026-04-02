import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  LayoutDashboard, 
  PlusCircle, 
  ShieldAlert, 
  LogOut, 
  Sun, 
  Moon, 
  User, 
  Bell, 
  Menu, 
  X 
} from 'lucide-react';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Synchronize theme with document class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['USER', 'OFFICER', 'ADMIN'] },
    { name: 'My Grievances', path: '/grievances', icon: ShieldAlert, roles: ['USER'] },
    { name: 'New Grievance', path: '/grievances/new', icon: PlusCircle, roles: ['USER'] },
    { name: 'Admin Panel', path: '/admin', icon: ShieldAlert, roles: ['ADMIN'] },
  ];

  const filteredLinks = navLinks.filter(link => 
    link.roles.includes(user?.role?.toUpperCase())
  );

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 selection:bg-primary/30 transition-all duration-300">
      <div className="container flex h-16 max-w-7xl mx-auto items-center justify-between px-4">
        {/* Left: Branding */}
        <div className="flex items-center gap-2 md:gap-8">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5] shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all group-hover:scale-110 group-hover:rotate-3 rotate-0">
               <ShieldAlert className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black uppercase tracking-tighter text-lg md:text-xl leading-none bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                ResolveDesk
              </span>
              <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-primary/60 mt-0.5">Campus Support</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {filteredLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${
                  isActive(link.path) 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            {isDark ? <Sun className="h-5 w-5 text-cyan-400" /> : <Moon className="h-5 w-5 text-indigo-600" />}
          </Button>

          <Button variant="ghost" size="icon" className="relative text-muted-foreground hidden sm:flex">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(255,81,250,0.8)]" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 md:h-11 md:w-11 rounded-full p-0 overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-all ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-black uppercase text-sm md:text-base">
                  {user?.firstName?.charAt(0) || user?.username?.charAt(0)}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mt-2 backdrop-blur-3xl border-border bg-card/95 selection:bg-primary/30 shadow-2xl" align="end">
              <DropdownMenuLabel className="font-normal py-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-black uppercase tracking-widest leading-none text-foreground">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs font-medium leading-none text-muted-foreground">{user?.email || user?.username}</p>
                  <div className="pt-2">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-black uppercase tracking-widest text-primary">
                      {user?.role}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="opacity-10" />
              <Link to="/profile">
                <DropdownMenuItem className="py-2.5 font-semibold text-sm cursor-pointer focus:bg-primary/10 focus:text-primary transition-colors">
                  <User className="mr-3 h-4 w-4" /> Profile Details
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator className="opacity-10" />
              <DropdownMenuItem 
                className="py-2.5 font-semibold text-sm cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-4 w-4" /> Authenticate Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Toggle */}
           <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-card/95 backdrop-blur-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="container space-y-2 py-4 px-4">
            {filteredLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
                  isActive(link.path) 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <link.icon className="h-5 w-5" />
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
