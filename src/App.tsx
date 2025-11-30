import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { UserRoleProvider } from "./contexts/UserRoleContext";
import { supabase } from "./integrations/supabase/client";
import { useEffect } from "react";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import History from "./pages/History";
import Admin from "./pages/Admin";
import Success from "./pages/Success";
import Billing from "./pages/Billing";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import DataEthics from "./pages/DataEthics";
import AuditLogs from "./pages/AuditLogs";
import EmailSequence from "./pages/EmailSequence";
import CRM from "./pages/CRM";
import Analytics from "./pages/Analytics";
import ChurnAnalytics from "./pages/ChurnAnalytics";
import Profile from "./pages/Profile";
import Support from "./pages/Support";
import KnowledgeBase from "./pages/KnowledgeBase";
import EmailSettings from "./pages/EmailSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Handle hash-based auth tokens (for magic links) and OAuth codes (for Google OAuth)
  useEffect(() => {
    // Check if there's a hash with auth tokens (magic links)
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      if (accessToken) {
        // Supabase will automatically handle this via detectSessionInUrl
        // Wait a moment for Supabase to process the token, then clear the hash
        setTimeout(() => {
          supabase.auth.getSession().then(() => {
            // Clear the hash from URL after processing
            window.history.replaceState(null, '', window.location.pathname);
          });
        }, 500);
      }
    }
    
    // Check if there's an OAuth code in query parameters (Google OAuth with PKCE)
    const urlParams = new URLSearchParams(window.location.search);
    const oauthCode = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (oauthCode) {
      // Supabase will automatically exchange the code for tokens with PKCE flow
      // Wait for the session to be established, then clear the query params
      setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            // Clear the code from URL after successful authentication
            window.history.replaceState(null, '', window.location.pathname);
          }
        });
      }, 1000);
    }
    
    if (error) {
      // Handle OAuth errors
      console.error('OAuth error:', error);
      // Clear error from URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <UserRoleProvider>
            <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/success"
            element={
              <ProtectedRoute>
                <Success />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crm"
            element={
              <ProtectedRoute>
                <CRM />
              </ProtectedRoute>
            }
          />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/data-ethics" element={<DataEthics />} />
          <Route path="/audit-logs" element={
            <ProtectedRoute>
              <AuditLogs />
            </ProtectedRoute>
          } />
          <Route path="/email-sequence" element={<EmailSequence />} />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="/churn-analytics" element={
            <ProtectedRoute>
              <ChurnAnalytics />
            </ProtectedRoute>
          } />
          <Route path="/support" element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          } />
          <Route path="/kb" element={
            <ProtectedRoute>
              <KnowledgeBase />
            </ProtectedRoute>
          } />
          <Route path="/email-settings" element={
            <ProtectedRoute>
              <EmailSettings />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
            </Routes>
          </UserRoleProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
