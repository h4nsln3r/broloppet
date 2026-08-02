import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Preferera process.env (Vercel) framför .env-filer.
  const fileEnv = loadEnv(mode, process.cwd(), "VITE_");
  const supabaseUrl = process.env.VITE_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY || fileEnv.VITE_SUPABASE_ANON_KEY;

  return {
    plugins: [react()],
    base: "/",
    // Definiera bara om värdet finns – annars låt koden falla tillbaka på publika defaults.
    define: {
      ...(supabaseUrl
        ? { "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl) }
        : {}),
      ...(supabaseAnonKey
        ? {
            "import.meta.env.VITE_SUPABASE_ANON_KEY":
              JSON.stringify(supabaseAnonKey),
          }
        : {}),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            motion: ["framer-motion", "react-scroll-parallax"],
          },
        },
      },
    },
  };
});
