import { QueryClient } from "@tanstack/react-query";

// Instancia única, separada de main.jsx para poder importarla también desde
// api/axios.js (leer la caché del estado de la plataforma) sin generar un
// import circular entre el entrypoint y la capa de red.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
