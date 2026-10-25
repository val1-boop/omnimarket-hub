"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { useTheme } from "@/components/theme/use-theme";

// Proveedores globales del lado del cliente:
// - TanStack Query: caché de datos y mutaciones optimistas (Kanban, edición en lote).
// - Sonner: notificaciones Toast de éxito o error (en el mismo modo claro u oscuro que la app).
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  );

  const { theme } = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors closeButton theme={theme} />
    </QueryClientProvider>
  );
}