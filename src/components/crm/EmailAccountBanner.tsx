import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Mail, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function EmailAccountBanner() {
  const [hasEmailAccount, setHasEmailAccount] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkEmailAccount();
  }, []);

  const checkEmailAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('email_accounts')
        .select('id, is_verified')
        .eq('user_id', user.id)
        .eq('is_verified', true)
        .maybeSingle();

      setHasEmailAccount(!!data);
    } catch (error) {
      console.error('Error checking email account:', error);
    }
  };

  if (hasEmailAccount === null || hasEmailAccount || dismissed) {
    return null;
  }

  return (
    <Alert className="mb-6 bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-500 mt-0.5" />
        <div className="flex-1">
          <AlertDescription className="text-sm text-orange-900 dark:text-orange-100">
            <strong className="font-semibold">No email account connected.</strong> Workflow emails will not be sent until you connect an email account.
          </AlertDescription>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950"
            onClick={() => navigate('/email-settings')}
          >
            <Mail className="h-4 w-4 mr-2" />
            Connect Email Account
          </Button>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-orange-600 dark:text-orange-500"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}