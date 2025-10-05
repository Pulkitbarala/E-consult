import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, FileText, BarChart3, User, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Force navigation and reload to ensure clean state
      navigate('/', { replace: true });
      // Small delay to ensure navigation completes
      setTimeout(() => {
        window.location.href = '/'; // Force page reload for complete state reset
      }, 100);
    } catch (error) {
      console.error('Logout failed:', error);
      // Force navigation even on error
      navigate('/', { replace: true });
    }
  };

  const navItems = [
    { path: '/feed', label: 'Feed', icon: MessageSquare },
    { path: '/my-consultations', label: 'My Consultations', icon: FileText },
    { path: '/commented', label: 'Commented', icon: BarChart3 },
  ];

  const saveThemePreference = (theme: string) => {
    localStorage.setItem('theme', theme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [setTheme]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    saveThemePreference(newTheme);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/feed" className="text-lg font-bold text-slate-900 dark:text-slate-100">
            E-Consult
          </Link>
          
          <nav className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors text-sm ${
                    isActive 
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-3">
            <ThemeToggle onThemeChange={handleThemeChange} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" align="end" forceMount>
                <DropdownMenuItem onClick={() => navigate('/profile')} className="text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-slate-200 dark:border-slate-700">
          <nav className="flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex-1 flex items-center justify-center space-x-1 py-3 px-2 transition-colors ${
                    isActive 
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4">
        {children}
      </main>
    </div>
  );
};

export default Layout;