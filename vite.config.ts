import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Läs både .env-filer och process.env (Vercel sätter VITE_* i process.env).
  const fileEnv = loadEnv(mode, process.cwd(), "VITE_");
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ?? fileEnv.VITE_SUPABASE_URL ?? "";
  const supabaseAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY ?? fileEnv.VITE_SUPABASE_ANON_KEY ?? "";

  if (process.env.VERCEL && (!supabaseUrl || !supabaseAnonKey)) {
    console.warn(
      "[vite] Vercel-build saknar VITE_SUPABASE_URL och/eller VITE_SUPABASE_ANON_KEY. " +
        "Kontrollera Environment Variables i Vercel-projektet som faktiskt deployas."
    );
  }

  return {
    plugins: [react()],
    base: "/",
    // Tvinga in värdena i klientbunten (pålitligare än enbart import.meta.env på Vercel).
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(supabaseAnonKey),
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
