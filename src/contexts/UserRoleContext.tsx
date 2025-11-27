import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserRoleData {
  role: string;
  hasAiAccess: boolean;
  hasCrmAccess: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

const UserRoleContext = createContext<UserRoleData>({
  role: 'free',
  hasAiAccess: false,
  hasCrmAccess: false,
  isAdmin: false,
  isLoading: true,
});

export const useUserRole = () => useContext(UserRoleContext);

export const UserRoleProvider = ({ children }: { children: ReactNode }) => {
  const [roleData, setRoleData] = useState<UserRoleData>(() => {
    // Load from sessionStorage for instant display
    const cached = sessionStorage.getItem('userRoleData');
    if (cached) {
      try {
        return { ...JSON.parse(cached), isLoading: true };
      } catch {
        return { role: 'free', hasAiAccess: false, hasCrmAccess: false, isAdmin: false, isLoading: true };
      }
    }
    return { role: 'free', hasAiAccess: false, hasCrmAccess: false, isAdmin: false, isLoading: true };
  });

  useEffect(() => {
    let mounted = true;

    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role, has_crm_access, has_ai_access')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!mounted) return;

        const result = {
          role: roleData?.role || 'free',
          hasAiAccess: roleData?.role === 'admin' || roleData?.has_ai_access || false,
          hasCrmAccess: roleData?.role === 'admin' || roleData?.has_crm_access || false,
          isAdmin: roleData?.role === 'admin',
          isLoading: false,
        };

        setRoleData(result);
        // Cache in sessionStorage
        sessionStorage.setItem('userRoleData', JSON.stringify(result));
      } catch (error) {
        console.error('Error fetching user role:', error);
        if (mounted) {
          setRoleData({ role: 'free', hasAiAccess: false, hasCrmAccess: false, isAdmin: false, isLoading: false });
        }
      }
    };

    fetchUserRole();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem('userRoleData');
        setRoleData({ role: 'free', hasAiAccess: false, hasCrmAccess: false, isAdmin: false, isLoading: false });
      } else if (event === 'SIGNED_IN') {
        fetchUserRole();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserRoleContext.Provider value={roleData}>
      {children}
    </UserRoleContext.Provider>
  );
};
