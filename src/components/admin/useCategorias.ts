import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCategorias = (tipo?: string) => {
  return useQuery({
    queryKey: ['categorias', tipo],
    queryFn: async () => {
      let query = supabase.from('categorias').select('*').order('nombre');
      if (tipo) query = query.eq('tipo', tipo);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
};
