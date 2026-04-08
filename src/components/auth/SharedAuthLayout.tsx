import { PropsWithChildren } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SharedAuthLayoutProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  activeMode?: 'signin' | 'signup' | 'reset';
  showModeToggle?: boolean;
  backTo?: string;
  backReplace?: boolean;
}

export function SharedAuthLayout({
  title,
  description,
  icon,
  activeMode = 'signin',
  showModeToggle = true,
  backTo = '/',
  backReplace = false,
  children,
}: PropsWithChildren<SharedAuthLayoutProps>) {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-[#f7f8ff] dark:bg-slate-900 overflow-hidden animate-page-smooth">
      <div className="purple-page-bg" />

      <header className="relative z-10 w-full py-6 px-4 sm:px-6 flex flex-wrap justify-between items-center gap-3">
        <Button
          variant="ghost"
          onClick={() => navigate(backTo, { replace: backReplace })}
          className="flex items-center space-x-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        <ThemeToggle />
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[calc(100vh-120px)]">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-600 dark:to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">E-consult</span>
        </div>

        <div className="w-full max-w-md">
          <div className="glass-card auth-glass">
            <div className="p-6">
              {showModeToggle && (
                <div className="flex bg-slate-100/60 dark:bg-slate-700/50 rounded-lg p-1 mb-4">
                  <button
                    onClick={() => navigate('/auth?mode=signin', { replace: true })}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                      activeMode === 'signin'
                        ? 'bg-white/80 dark:bg-slate-600/60 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/auth?mode=signup', { replace: true })}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                      activeMode === 'signup'
                        ? 'bg-white/80 dark:bg-slate-600/60 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              <div className="flex flex-col items-center space-y-2 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-indigo-100/60 dark:bg-indigo-900/20">
                  {icon}
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
                </div>
              </div>

              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
