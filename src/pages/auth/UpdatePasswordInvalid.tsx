import { SharedAuthLayout } from '@/components/auth/SharedAuthLayout';
import { Button } from '@/components/ui/button';
import { Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UpdatePasswordInvalid({ checking = false }: { checking?: boolean }) {
  const navigate = useNavigate();
  return checking ? (
    <SharedAuthLayout
      title="Verifying reset link..."
      description="Please wait a moment"
      icon={<Mail className="w-5 h-5 text-white" />}
      showModeToggle={false}
    >
      <div className="min-h-[120px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    </SharedAuthLayout>
  ) : (
    <SharedAuthLayout
      title="Access Denied"
      description="Open this page from a valid reset link"
      icon={<Lock className="w-5 h-5 text-white" />}
      showModeToggle={false}
    >
      <div className="space-y-4 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Go to the sign-in page and click "Forgot password?" to receive a new reset link.
        </p>
        <Button onClick={() => navigate('/auth?mode=signin', { replace: true })} className="w-full h-10 text-sm font-medium">
          Go to Sign In
        </Button>
      </div>
    </SharedAuthLayout>
  );
}
