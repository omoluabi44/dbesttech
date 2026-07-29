"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useSchoolCategory } from "@/lib/hooks/useSchoolCategory";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));
  
  const hydrate = useAuthStore(state => state.hydrate);
  const { isPrimary } = useSchoolCategory();
  
  // Hydrate auth store on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Apply theme to document body
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isPrimary) {
        document.documentElement.setAttribute('data-theme', 'primary-mode');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }
  }, [isPrimary]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
