import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => {
  const allowedPreviewHosts = ["unityvault-1.onrender.com", process.env.RENDER_EXTERNAL_HOSTNAME].filter(
    Boolean
  ) as string[];

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    preview: {
      allowedHosts: allowedPreviewHosts,
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return;
            }

            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }

            if (id.includes("radix") || id.includes("lucide") || id.includes("clsx")) {
              return "ui-vendor";
            }

            return;
          },
        },
      },
    },
  };
});
