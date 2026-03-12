import { useAuth } from "./useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const role = profile?.role as 'encargado' | 'vendedor' | 'user' | null;
  const isEncargado = role === 'encargado';
  const isVendedor = role === 'vendedor';
  const isStaff = isEncargado || isVendedor;
  const displayName = profile?.full_name || user?.email || '';

  return {
    role,
    isEncargado,
    isVendedor,
    isStaff,
    displayName,
    loading: authLoading || profileLoading,
    user,
  };
};
