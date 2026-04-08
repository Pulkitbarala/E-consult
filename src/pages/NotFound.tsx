import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#f7f8ff] dark:bg-slate-900 text-[#0f172a] dark:text-slate-100 overflow-hidden animate-page-smooth">
      <div className="purple-page-bg" />
      <div className="relative z-10 w-full max-w-md p-4 sm:p-6">
        <div className="glass-card-pro bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 backdrop-blur-xl text-center p-6 sm:p-8">
          <h1 className="mb-3 text-4xl font-bold">404</h1>
          <p className="mb-6 text-base text-slate-600 dark:text-slate-300">Oops! Page not found</p>
          <Link
            to="/"
            replace
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
